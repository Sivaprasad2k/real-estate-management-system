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
}
