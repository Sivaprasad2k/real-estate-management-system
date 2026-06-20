package com.rems.realestate.service;

import com.rems.realestate.model.*;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.RentalRequestRepository;
import com.rems.realestate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RentalRequestService {

    @Autowired
    private RentalRequestRepository rentalRequestRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public RentalRequest createRentalRequest(String propertyId, String tenantId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getOwnerId().equals(tenantId)) {
            throw new RuntimeException("You cannot submit a rental request for your own property.");
        }

        if (property.getStatus() == PropertyStatus.SOLD || property.getStatus() == PropertyStatus.RENTED) {
            throw new RuntimeException("Property is already sold or rented.");
        }

        // Check if there's already a pending rental request by this tenant
        List<RentalRequest> existing = rentalRequestRepository.findByPropertyId(propertyId);
        boolean alreadySubmitted = existing.stream()
                .anyMatch(r -> r.getTenantId().equals(tenantId) && r.getStatus() == RentalRequestStatus.PENDING);

        if (alreadySubmitted) {
            throw new RuntimeException("You already have a pending rental request for this property.");
        }

        RentalRequest request = RentalRequest.builder()
                .propertyId(propertyId)
                .tenantId(tenantId)
                .ownerId(property.getOwnerId())
                .status(RentalRequestStatus.PENDING)
                .requestDate(LocalDateTime.now())
                .build();

        RentalRequest saved = rentalRequestRepository.save(request);

        User tenant = userRepository.findById(tenantId).orElseThrow(() -> new RuntimeException("Tenant not found"));
        notificationService.createNotification(
                property.getOwnerId(),
                "New Rental Request: User " + tenant.getName() + " has submitted a rental request for your property '" + property.getTitle() + "'.",
                "RENTAL_REQUEST"
        );

        return saved;
    }

    public List<RentalRequest> getTenantRequests(String tenantId) {
        return rentalRequestRepository.findByTenantId(tenantId);
    }

    public List<RentalRequest> getOwnerRequests(String ownerId) {
        return rentalRequestRepository.findByOwnerId(ownerId);
    }

    public List<RentalRequest> getPropertyRequests(String propertyId, String userId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwnerId().equals(userId)) {
            throw new RuntimeException("Not authorized to view requests for this property.");
        }

        return rentalRequestRepository.findByPropertyId(propertyId);
    }

    public RentalRequest acceptRequest(String requestId, String ownerId) {
        RentalRequest request = rentalRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Rental request not found"));

        if (!request.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized to accept this rental request.");
        }

        if (request.getStatus() != RentalRequestStatus.PENDING) {
            throw new RuntimeException("Request is not in PENDING status.");
        }

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        // Update request status
        request.setStatus(RentalRequestStatus.ACCEPTED);
        rentalRequestRepository.save(request);

        // Update property status
        property.setStatus(PropertyStatus.RENT_IN_PROGRESS);
        // Save tenantId for later
        property.setTenantId(request.getTenantId());
        propertyRepository.save(property);

        // Reject other pending requests for the same property
        List<RentalRequest> allRequests = rentalRequestRepository.findByPropertyId(request.getPropertyId());
        for (RentalRequest req : allRequests) {
            if (!req.getId().equals(requestId) && req.getStatus() == RentalRequestStatus.PENDING) {
                req.setStatus(RentalRequestStatus.REJECTED);
                rentalRequestRepository.save(req);
                notificationService.createNotification(
                        req.getTenantId(),
                        "Rental Request Rejected: Your rental request for '" + property.getTitle() + "' was rejected because another request was accepted.",
                        "RENTAL_REQUEST"
                );
            }
        }

        notificationService.createNotification(
                request.getTenantId(),
                "Rental Request Accepted: Your rental request for '" + property.getTitle() + "' has been accepted by the owner! You can now upload the lease agreement or wait for the owner to generate it.",
                "RENTAL_REQUEST"
        );

        return request;
    }

    public RentalRequest rejectRequest(String requestId, String ownerId) {
        RentalRequest request = rentalRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Rental request not found"));

        if (!request.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized to reject this rental request.");
        }

        if (request.getStatus() != RentalRequestStatus.PENDING) {
            throw new RuntimeException("Request is not in PENDING status.");
        }

        request.setStatus(RentalRequestStatus.REJECTED);
        rentalRequestRepository.save(request);

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        notificationService.createNotification(
                request.getTenantId(),
                "Rental Request Rejected: Your rental request for '" + property.getTitle() + "' has been rejected.",
                "RENTAL_REQUEST"
        );

        return request;
    }
}
