package com.rems.realestate.controller;

import com.rems.realestate.model.PurchaseRequest;
import com.rems.realestate.security.UserDetailsImpl;
import com.rems.realestate.service.PurchaseRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-requests")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PurchaseRequestController {

    @Autowired
    private PurchaseRequestService purchaseRequestService;

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<?> createPurchaseRequest(@RequestBody Map<String, String> requestBody, Authentication authentication) {
        try {
            String propertyId = requestBody.get("propertyId");
            if (propertyId == null || propertyId.isEmpty()) {
                return ResponseEntity.badRequest().body("propertyId is required");
            }
            String buyerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            PurchaseRequest request = purchaseRequestService.createPurchaseRequest(propertyId, buyerId);
            return new ResponseEntity<>(request, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/buyer")
    public ResponseEntity<List<PurchaseRequest>> getBuyerRequests(Authentication authentication) {
        String buyerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(purchaseRequestService.getBuyerRequests(buyerId));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/owner")
    public ResponseEntity<List<PurchaseRequest>> getOwnerRequests(Authentication authentication) {
        String ownerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(purchaseRequestService.getOwnerRequests(ownerId));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<?> getPropertyRequests(@PathVariable String propertyId, Authentication authentication) {
        try {
            String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            List<PurchaseRequest> requests = purchaseRequestService.getPropertyRequests(propertyId, userId);
            return ResponseEntity.ok(requests);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable String id, Authentication authentication) {
        try {
            String ownerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            PurchaseRequest request = purchaseRequestService.acceptRequest(id, ownerId);
            return ResponseEntity.ok(request);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable String id, Authentication authentication) {
        try {
            String ownerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            PurchaseRequest request = purchaseRequestService.rejectRequest(id, ownerId);
            return ResponseEntity.ok(request);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
