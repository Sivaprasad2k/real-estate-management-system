package com.rems.realestate.controller;

import com.rems.realestate.model.RentalRequest;
import com.rems.realestate.security.UserDetailsImpl;
import com.rems.realestate.service.RentalRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rental-requests")
@CrossOrigin(origins = "*", maxAge = 3600)
public class RentalRequestController {

    @Autowired
    private RentalRequestService rentalRequestService;

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<?> createRentalRequest(@RequestBody Map<String, String> requestBody, Authentication authentication) {
        try {
            String propertyId = requestBody.get("propertyId");
            if (propertyId == null || propertyId.isEmpty()) {
                return ResponseEntity.badRequest().body("propertyId is required");
            }
            String tenantId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            RentalRequest request = rentalRequestService.createRentalRequest(propertyId, tenantId);
            return new ResponseEntity<>(request, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/tenant")
    public ResponseEntity<List<RentalRequest>> getTenantRequests(Authentication authentication) {
        String tenantId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(rentalRequestService.getTenantRequests(tenantId));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/owner")
    public ResponseEntity<List<RentalRequest>> getOwnerRequests(Authentication authentication) {
        String ownerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(rentalRequestService.getOwnerRequests(ownerId));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<?> getPropertyRequests(@PathVariable String propertyId, Authentication authentication) {
        try {
            String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            List<RentalRequest> requests = rentalRequestService.getPropertyRequests(propertyId, userId);
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
            RentalRequest request = rentalRequestService.acceptRequest(id, ownerId);
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
            RentalRequest request = rentalRequestService.rejectRequest(id, ownerId);
            return ResponseEntity.ok(request);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
