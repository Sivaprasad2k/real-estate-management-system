package com.rems.realestate.service;

import com.rems.realestate.model.Property;
import com.rems.realestate.model.PropertyStatus;
import com.rems.realestate.model.RentalAgreement;
import com.rems.realestate.model.RentalAgreementStatus;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.RentalAgreementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RentalAgreementService {

    @Autowired
    private RentalAgreementRepository rentalAgreementRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    public RentalAgreement endRental(String propertyId, String ownerId) {
        RentalAgreement agreement = rentalAgreementRepository
                .findByPropertyIdAndStatus(propertyId, RentalAgreementStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No ACTIVE rental agreement found for this property."));

        if (!agreement.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized to end this rental agreement.");
        }

        agreement.setStatus(RentalAgreementStatus.ENDED);
        agreement.setEndDate(LocalDateTime.now());
        rentalAgreementRepository.save(agreement);

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found."));

        property.setStatus(PropertyStatus.APPROVED);
        propertyRepository.save(property);

        return agreement;
    }

    public RentalAgreement acceptAgreement(String propertyId, String tenantId) {
        RentalAgreement agreement = rentalAgreementRepository
                .findByPropertyIdAndStatus(propertyId, RentalAgreementStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No ACTIVE rental agreement found."));

        if (!agreement.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Not authorized.");
        }
        if (agreement.isTermsAccepted()) {
            throw new RuntimeException("Terms already accepted.");
        }
        agreement.setTermsAccepted(true);
        return rentalAgreementRepository.save(agreement);
    }

    public RentalAgreement simulatePayment(String propertyId, String tenantId) {
        RentalAgreement agreement = rentalAgreementRepository
                .findByPropertyIdAndStatus(propertyId, RentalAgreementStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No ACTIVE rental agreement found."));

        if (!agreement.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Not authorized.");
        }
        if (!agreement.isTermsAccepted()) {
            throw new RuntimeException("Cannot pay before accepting terms.");
        }
        if (agreement.getPaymentStatus() == com.rems.realestate.model.PaymentStatus.PAID) {
            throw new RuntimeException("Already paid.");
        }
        agreement.setPaymentStatus(com.rems.realestate.model.PaymentStatus.PAID);
        return rentalAgreementRepository.save(agreement);
    }

    public RentalAgreement getAgreementDetails(String propertyId) {
        return rentalAgreementRepository.findByPropertyIdAndStatus(propertyId, RentalAgreementStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No ACTIVE rental agreement found."));
    }

    public List<RentalAgreement> getOwnerAgreements(String ownerId) {
        return rentalAgreementRepository.findByOwnerId(ownerId);
    }

    public List<RentalAgreement> getTenantAgreements(String tenantId) {
        return rentalAgreementRepository.findByTenantId(tenantId);
    }

    public List<RentalAgreement> getAllAgreements() {
        return rentalAgreementRepository.findAll();
    }

    public RentalAgreement uploadLeaseAgreement(String propertyId, String tenantId,
            org.springframework.web.multipart.MultipartFile file, String userId) throws java.io.IOException {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getStatus() != PropertyStatus.RENT_IN_PROGRESS) {
            throw new RuntimeException("Lease agreement upload is only allowed when property status is RENT_IN_PROGRESS");
        }

        if (!property.getOwnerId().equals(userId)) {
            throw new RuntimeException("Only the property owner can upload the lease agreement.");
        }

        RentalAgreement agreement = rentalAgreementRepository.findByPropertyIdAndStatus(propertyId, RentalAgreementStatus.ACTIVE)
                .orElse(null);

        if (agreement == null) {
            String agreementNumber = "RA-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            agreement = RentalAgreement.builder()
                    .propertyId(propertyId)
                    .ownerId(property.getOwnerId())
                    .tenantId(tenantId != null && !tenantId.isEmpty() ? tenantId : property.getTenantId())
                    .agreementNumber(agreementNumber)
                    .monthlyRent(property.getPrice())
                    .securityDeposit(property.getPrice() * 2)
                    .status(RentalAgreementStatus.ACTIVE)
                    .build();
        }

        agreement.setFileName(file.getOriginalFilename());
        agreement.setFileType(file.getContentType());
        agreement.setDocumentData(file.getBytes());
        agreement.setDocumentUrl("/api/rentals/" + propertyId + "/document");

        RentalAgreement saved = rentalAgreementRepository.save(agreement);

        property.setStatus(PropertyStatus.PENDING_TENANT_CONFIRMATION);
        propertyRepository.save(property);

        return saved;
    }

    public RentalAgreement confirmLease(String propertyId, String tenantId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getStatus() != PropertyStatus.PENDING_TENANT_CONFIRMATION) {
            throw new RuntimeException("Property is not in PENDING_TENANT_CONFIRMATION status");
        }

        if (property.getTenantId() == null || !property.getTenantId().equals(tenantId)) {
            throw new RuntimeException("Only the designated tenant can confirm this lease agreement");
        }

        RentalAgreement agreement = rentalAgreementRepository.findByPropertyIdAndStatus(propertyId, RentalAgreementStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No active rental agreement found to confirm"));

        agreement.setTermsAccepted(true);
        agreement.setPaymentStatus(com.rems.realestate.model.PaymentStatus.PAID);
        rentalAgreementRepository.save(agreement);

        property.setStatus(PropertyStatus.RENTED);
        property.setTransactionName("Tenant ID: " + agreement.getTenantId());
        property.setTransactionAmount(property.getPrice());
        propertyRepository.save(property);

        return agreement;
    }

}
