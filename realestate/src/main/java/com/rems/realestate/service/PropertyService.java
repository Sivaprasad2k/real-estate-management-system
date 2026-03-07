package com.rems.realestate.service;

import com.rems.realestate.dto.PropertyRequest;
import com.rems.realestate.model.Property;
import com.rems.realestate.model.PropertyPurpose;
import com.rems.realestate.model.PropertyStatus;
import com.rems.realestate.model.User;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.UserRepository;
import com.rems.realestate.repository.RentalAgreementRepository;
import com.rems.realestate.model.RentalAgreement;
import com.rems.realestate.model.RentalAgreementStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PropertyService {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RentalAgreementRepository rentalAgreementRepository;

    public Property createProperty(PropertyRequest request, String ownerId) {
        User user = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Property property = Property.builder()
                .ownerId(ownerId)
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .purpose(request.getPurpose())
                .price(request.getPrice())
                .city(request.getCity())
                .state(request.getState())
                .amenities(request.getAmenities())
                .images(request.getImages())
                .createdAt(LocalDateTime.now())
                .reportCount(0)
                .build();

        applyModerationRules(property, user);
        return propertyRepository.save(property);
    }

    public Property updateProperty(String propertyId, PropertyRequest request, String ownerId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized to update this property");
        }

        boolean priceChanged = !property.getPrice().equals(request.getPrice());

        property.setTitle(request.getTitle());
        property.setDescription(request.getDescription());
        property.setType(request.getType());
        property.setPurpose(request.getPurpose());
        property.setPrice(request.getPrice());
        property.setCity(request.getCity());
        property.setState(request.getState());
        property.setAmenities(request.getAmenities());
        property.setImages(request.getImages());

        if (priceChanged) {
            User user = userRepository.findById(ownerId).orElseThrow(() -> new RuntimeException("User not found"));
            applyModerationRules(property, user);
        }

        return propertyRepository.save(property);
    }

    public void deleteProperty(String propertyId, String userId, boolean isAdmin) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwnerId().equals(userId) && !isAdmin) {
            throw new RuntimeException("Not authorized to delete this property");
        }

        propertyRepository.delete(property);
    }

    public List<Property> searchProperties(String city, PropertyPurpose purpose, Double minPrice, Double maxPrice) {
        return propertyRepository.searchProperties(city, purpose, minPrice, maxPrice);
    }

    public List<Property> getAllProperties() {
        return propertyRepository.findAll();
    }

    public Property getPropertyById(String id) {
        return propertyRepository.findById(id).orElseThrow(() -> new RuntimeException("Property not found"));
    }

    public void markSold(String propertyId, String ownerId, com.rems.realestate.dto.MarkSoldRequest request) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized");
        }

        if (property.getStatus() != PropertyStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED properties can be marked as sold.");
        }

        property.setStatus(PropertyStatus.SOLD);
        property.setTransactionName(request.getBuyerName());
        property.setTransactionContact(request.getBuyerContact());
        property.setTransactionAmount(request.getSoldAmount());
        propertyRepository.save(property);
    }

    public void markRented(String propertyId, String ownerId, com.rems.realestate.dto.MarkRentedRequest request) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized");
        }

        if (property.getStatus() != PropertyStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED properties can be marked as rented.");
        }

        property.setStatus(PropertyStatus.RENTED);
        property.setTransactionName(request.getTenantName());
        property.setTransactionContact(request.getTenantContact());
        property.setTransactionAmount(request.getRentAmount());
        propertyRepository.save(property);
    }

    public List<Property> getFlaggedProperties() {
        return propertyRepository.findAll().stream()
                .filter(p -> p.getStatus() == PropertyStatus.FLAGGED)
                .toList();
    }

    public void approveProperty(String id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        property.setStatus(PropertyStatus.APPROVED);
        property.setReportCount(0);
        propertyRepository.save(property);
    }

    public void rejectProperty(String id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        property.setStatus(PropertyStatus.REJECTED);
        propertyRepository.save(property);
    }

    private void applyModerationRules(Property property, User user) {
        if (user.getReportCount() > 2 || property.getPrice() < 1000) {
            property.setStatus(PropertyStatus.FLAGGED);
        } else {
            property.setStatus(PropertyStatus.APPROVED);
        }
    }
}
