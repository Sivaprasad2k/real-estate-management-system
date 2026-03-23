package com.rems.realestate.service;

import com.rems.realestate.dto.SaleAgreementUploadRequest;
import com.rems.realestate.model.*;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.SaleAgreementRepository;
import com.rems.realestate.repository.MessageRepository;
import com.rems.realestate.repository.SuspiciousActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SaleAgreementService {

    @Autowired
    private SaleAgreementRepository saleAgreementRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private SuspiciousActivityLogRepository suspiciousActivityLogRepository;

    public SaleAgreement uploadAgreement(String propertyId, String buyerId,
            org.springframework.web.multipart.MultipartFile file, User currentUser) throws java.io.IOException {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        // Fraud Prevention: Check if property is already sold or has a pending
        // agreement
        // For simplicity, we assume an active agreement means it's not REJECTED.
        boolean duplicateExists = saleAgreementRepository.existsByPropertyIdAndStatusNot(property.getId(),
                SaleAgreementStatus.REJECTED);

        if (duplicateExists) {
            // Log to suspicious activities (could be an admin log collection, but we keep
            // it simple or throw exception)
            throw new RuntimeException("SUSPICIOUS: An agreement for this property already exists.");
        }

        SaleAgreement agreement = SaleAgreement.builder()
                .propertyId(property.getId())
                .sellerId(property.getOwnerId())
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .documentData(file.getBytes())
                .uploadedBy(currentUser.getId())
                .uploadDate(LocalDateTime.now())
                .build();

        if (currentUser.getId().equals(property.getOwnerId())) {
            // Seller Upload Scenario
            agreement.setStatus(SaleAgreementStatus.APPROVED);
            agreement.setBuyerId(buyerId); // Assume seller provides buyer ID

            // Auto update property to SOLD
            property.setStatus(PropertyStatus.SOLD);
            property.setSaleAgreementId(agreement.getAgreementId()); // Will set after save
            property.setSoldDate(LocalDateTime.now());

        } else {
            // Buyer Upload Scenario
            agreement.setStatus(SaleAgreementStatus.PENDING_SELLER_APPROVAL);
            agreement.setBuyerId(currentUser.getId());

            // Notify seller
            Message msg = Message.builder()
                    .senderId("system_admin")
                    .receiverId(property.getOwnerId())
                    .propertyId(property.getId())
                    .content("System Notice: A new Sale Agreement for your property '" + property.getTitle()
                            + "' has been uploaded by the buyer and requires your approval.")
                    .timestamp(LocalDateTime.now())
                    .read(false)
                    .build();
            messageRepository.save(msg);
        }

        SaleAgreement savedAgreement = saleAgreementRepository.save(agreement);

        if (currentUser.getId().equals(property.getOwnerId())) {
            property.setSaleAgreementId(savedAgreement.getAgreementId());
            propertyRepository.save(property);
        }

        return savedAgreement;
    }

    public SaleAgreement reviewAgreement(String agreementId, boolean approve, String sellerId) {
        SaleAgreement agreement = saleAgreementRepository.findById(agreementId)
                .orElseThrow(() -> new RuntimeException("Agreement not found"));

        if (!agreement.getSellerId().equals(sellerId)) {
            throw new RuntimeException("Only the property owner can review this agreement");
        }

        if (agreement.getStatus() != SaleAgreementStatus.PENDING_SELLER_APPROVAL) {
            throw new RuntimeException("Agreement is not in a pending state");
        }

        Property property = propertyRepository.findById(agreement.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (approve) {
            agreement.setStatus(SaleAgreementStatus.APPROVED);

            property.setStatus(PropertyStatus.SOLD);
            property.setSaleAgreementId(agreement.getAgreementId());
            property.setSoldDate(LocalDateTime.now());
            propertyRepository.save(property);

            // Notify buyer
            Message msg = Message.builder()
                    .senderId(sellerId)
                    .receiverId(agreement.getBuyerId())
                    .propertyId(property.getId())
                    .content("System Notice: Your Sale Agreement for property '" + property.getTitle()
                            + "' has been APPROVED.")
                    .timestamp(LocalDateTime.now())
                    .read(false)
                    .build();
            messageRepository.save(msg);

        } else {
            agreement.setStatus(SaleAgreementStatus.REJECTED);
            // Property remains AVAILABLE/PENDING

            // Notify buyer
            Message msg = Message.builder()
                    .senderId(sellerId)
                    .receiverId(agreement.getBuyerId())
                    .propertyId(property.getId())
                    .content("System Notice: Your Sale Agreement for property '" + property.getTitle()
                            + "' has been REJECTED by the seller.")
                    .timestamp(LocalDateTime.now())
                    .read(false)
                    .build();
            messageRepository.save(msg);
        }

        return saleAgreementRepository.save(agreement);
    }

    public SaleAgreement getAgreementById(String agreementId) {
        return saleAgreementRepository.findById(agreementId)
                .orElseThrow(() -> new RuntimeException("Agreement not found"));
    }

    public List<SaleAgreement> getAgreementsForSeller(String sellerId) {
        return saleAgreementRepository.findBySellerId(sellerId);
    }

    public List<SaleAgreement> getAgreementsForBuyer(String buyerId) {
        return saleAgreementRepository.findByBuyerId(buyerId);
    }
}
