package com.rems.realestate.service;

import com.rems.realestate.model.*;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.PurchaseRequestRepository;
import com.rems.realestate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PurchaseRequestService {

    @Autowired
    private PurchaseRequestRepository purchaseRequestRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public PurchaseRequest createPurchaseRequest(String propertyId, String buyerId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getOwnerId().equals(buyerId)) {
            throw new RuntimeException("You cannot submit a purchase request for your own property.");
        }

        if (property.getStatus() == PropertyStatus.SOLD || property.getStatus() == PropertyStatus.RENTED) {
            throw new RuntimeException("Property is already sold or rented.");
        }

        // Check if there's already a pending purchase request by this buyer
        List<PurchaseRequest> existing = purchaseRequestRepository.findByPropertyId(propertyId);
        boolean alreadySubmitted = existing.stream()
                .anyMatch(r -> r.getBuyerId().equals(buyerId) && r.getStatus() == PurchaseRequestStatus.PENDING);

        if (alreadySubmitted) {
            throw new RuntimeException("You already have a pending purchase request for this property.");
        }

        PurchaseRequest request = PurchaseRequest.builder()
                .propertyId(propertyId)
                .buyerId(buyerId)
                .ownerId(property.getOwnerId())
                .status(PurchaseRequestStatus.PENDING)
                .requestDate(LocalDateTime.now())
                .build();

        PurchaseRequest saved = purchaseRequestRepository.save(request);

        User buyer = userRepository.findById(buyerId).orElseThrow(() -> new RuntimeException("Buyer not found"));
        notificationService.createNotification(
                property.getOwnerId(),
                "New Purchase Request: User " + buyer.getName() + " has submitted a purchase request for your property '" + property.getTitle() + "'.",
                "PURCHASE_REQUEST"
        );

        return saved;
    }

    public List<PurchaseRequest> getBuyerRequests(String buyerId) {
        return purchaseRequestRepository.findByBuyerId(buyerId);
    }

    public List<PurchaseRequest> getOwnerRequests(String ownerId) {
        return purchaseRequestRepository.findByOwnerId(ownerId);
    }

    public List<PurchaseRequest> getPropertyRequests(String propertyId, String userId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwnerId().equals(userId)) {
            throw new RuntimeException("Not authorized to view requests for this property.");
        }

        return purchaseRequestRepository.findByPropertyId(propertyId);
    }

    public PurchaseRequest acceptRequest(String requestId, String ownerId) {
        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Purchase request not found"));

        if (!request.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized to accept this purchase request.");
        }

        if (request.getStatus() != PurchaseRequestStatus.PENDING) {
            throw new RuntimeException("Request is not in PENDING status.");
        }

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        // Update request status
        request.setStatus(PurchaseRequestStatus.ACCEPTED);
        purchaseRequestRepository.save(request);

        // Update property status and associate initiating fields
        property.setStatus(PropertyStatus.SALE_IN_PROGRESS);
        property.setSaleInitiatedBy(request.getBuyerId());
        property.setSaleInitiatedAt(LocalDateTime.now());
        User buyer = userRepository.findById(request.getBuyerId()).orElseThrow();
        property.setSaleBuyerDetails(buyer.getName() + " (" + buyer.getEmail() + ")");
        propertyRepository.save(property);

        // Reject other pending requests for the same property
        List<PurchaseRequest> allRequests = purchaseRequestRepository.findByPropertyId(request.getPropertyId());
        for (PurchaseRequest req : allRequests) {
            if (!req.getId().equals(requestId) && req.getStatus() == PurchaseRequestStatus.PENDING) {
                req.setStatus(PurchaseRequestStatus.REJECTED);
                purchaseRequestRepository.save(req);
                notificationService.createNotification(
                        req.getBuyerId(),
                        "Purchase Request Rejected: Your purchase request for '" + property.getTitle() + "' was rejected because another request was accepted.",
                        "PURCHASE_REQUEST"
                );
            }
        }

        notificationService.createNotification(
                request.getBuyerId(),
                "Purchase Request Accepted: Your purchase request for '" + property.getTitle() + "' has been accepted by the owner! You can now proceed to upload the sale agreement.",
                "PURCHASE_REQUEST"
        );

        return request;
    }

    public PurchaseRequest rejectRequest(String requestId, String ownerId) {
        PurchaseRequest request = purchaseRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Purchase request not found"));

        if (!request.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized to reject this purchase request.");
        }

        if (request.getStatus() != PurchaseRequestStatus.PENDING) {
            throw new RuntimeException("Request is not in PENDING status.");
        }

        request.setStatus(PurchaseRequestStatus.REJECTED);
        purchaseRequestRepository.save(request);

        Property property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        notificationService.createNotification(
                request.getBuyerId(),
                "Purchase Request Rejected: Your purchase request for '" + property.getTitle() + "' has been rejected.",
                "PURCHASE_REQUEST"
        );

        return request;
    }
}
