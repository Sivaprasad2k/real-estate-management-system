package com.rems.realestate.controller;

import com.rems.realestate.model.Property;
import com.rems.realestate.model.VisitRequest;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.VisitRequestRepository;
import com.rems.realestate.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/visits")
@CrossOrigin(origins = "*", maxAge = 3600)
public class VisitRequestController {

    @Autowired
    private VisitRequestRepository visitRequestRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<?> createVisitRequest(@RequestBody Map<String, String> requestBody, Authentication authentication) {
        try {
            String propertyId = requestBody.get("propertyId");
            String visitDateStr = requestBody.get("visitDate");

            if (propertyId == null || propertyId.isEmpty() || visitDateStr == null || visitDateStr.isEmpty()) {
                return ResponseEntity.badRequest().body("propertyId and visitDate are required");
            }

            Property property = propertyRepository.findById(propertyId)
                    .orElseThrow(() -> new RuntimeException("Property not found"));

            String buyerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();

            LocalDateTime visitDate = LocalDateTime.parse(visitDateStr, DateTimeFormatter.ISO_DATE_TIME);

            VisitRequest visitRequest = VisitRequest.builder()
                    .propertyId(propertyId)
                    .buyerId(buyerId)
                    .ownerId(property.getOwnerId())
                    .visitDate(visitDate)
                    .status("PENDING")
                    .build();

            return new ResponseEntity<>(visitRequestRepository.save(visitRequest), HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/buyer")
    public ResponseEntity<List<VisitRequest>> getBuyerVisits(Authentication authentication) {
        String buyerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(visitRequestRepository.findByBuyerId(buyerId));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/owner")
    public ResponseEntity<List<VisitRequest>> getOwnerVisits(Authentication authentication) {
        String ownerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(visitRequestRepository.findByOwnerId(ownerId));
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateVisitStatus(@PathVariable String id, @RequestBody Map<String, String> requestBody, Authentication authentication) {
        try {
            String status = requestBody.get("status");
            if (status == null || status.isEmpty()) {
                return ResponseEntity.badRequest().body("status is required");
            }

            VisitRequest visitRequest = visitRequestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Visit request not found"));

            String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            if (!visitRequest.getOwnerId().equals(userId) && !visitRequest.getBuyerId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized");
            }

            visitRequest.setStatus(status);
            return ResponseEntity.ok(visitRequestRepository.save(visitRequest));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
