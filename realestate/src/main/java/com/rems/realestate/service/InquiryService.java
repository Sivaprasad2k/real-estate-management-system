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

    public Inquiry createInquiry(String propertyId, String message, String senderId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getOwnerId().equals(senderId)) {
            throw new RuntimeException("Cannot send an inquiry for your own property.");
        }

        if (property.getStatus() != PropertyStatus.APPROVED) {
            throw new RuntimeException("Cannot inquire on a property that is not APPROVED.");
        }

        Inquiry inquiry = Inquiry.builder()
                .propertyId(propertyId)
                .ownerId(property.getOwnerId())
                .senderId(senderId)
                .message(message)
                .createdAt(LocalDateTime.now())
                .build();

        return inquiryRepository.save(inquiry);
    }

    public List<Inquiry> getOwnerInquiries(String ownerId) {
        return inquiryRepository.findByOwnerId(ownerId);
    }

    public List<Inquiry> getUserSentInquiries(String senderId) {
        return inquiryRepository.findBySenderId(senderId);
    }
}
