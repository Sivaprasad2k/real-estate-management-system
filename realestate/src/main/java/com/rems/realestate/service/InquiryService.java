package com.rems.realestate.service;

import com.rems.realestate.dto.InquiryRequest;
import com.rems.realestate.model.Inquiry;
import com.rems.realestate.model.Property;
import com.rems.realestate.model.PropertyStatus;
import com.rems.realestate.repository.InquiryRepository;
import com.rems.realestate.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InquiryService {

    @Autowired
    private InquiryRepository inquiryRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private NotificationService notificationService;

    public Inquiry createInquiry(String propertyId, String message, String senderId, boolean acceptedRentalRules) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getOwnerId().equals(senderId)) {
            throw new RuntimeException("Cannot send an inquiry for your own property.");
        }

        if (property.getStatus() != PropertyStatus.APPROVED) {
            throw new RuntimeException("Cannot inquire on a property that is not APPROVED.");
        }

        if (property.getPurpose() == com.rems.realestate.model.PropertyPurpose.RENT && property.getRentalRules() != null
                && !property.getRentalRules().isEmpty()) {
            if (!acceptedRentalRules) {
                throw new RuntimeException("You must accept the rental rules to proceed.");
            }
        }

        Inquiry inquiry = Inquiry.builder()
                .propertyId(propertyId)
                .ownerId(property.getOwnerId())
                .senderId(senderId)
                .message(message)
                .acceptedRentalRules(acceptedRentalRules)
                .createdAt(LocalDateTime.now())
                .build();

        Inquiry savedInquiry = inquiryRepository.save(inquiry);

        notificationService.createNotification(
                property.getOwnerId(),
                "System Notice: New inquiry received for your property '" + property.getTitle() + "'.",
                "INQUIRY");

        return savedInquiry;
    }

    public List<Inquiry> getOwnerInquiries(String ownerId) {
        return inquiryRepository.findByOwnerId(ownerId);
    }

    public List<Inquiry> getUserSentInquiries(String senderId) {
        return inquiryRepository.findBySenderId(senderId);
    }
}
