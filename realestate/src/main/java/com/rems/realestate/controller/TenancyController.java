package com.rems.realestate.controller;

import com.rems.realestate.dto.TenancyRequest;
import com.rems.realestate.model.Property;
import com.rems.realestate.model.PropertyStatus;
import com.rems.realestate.model.Tenancy;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.TenancyRepository;
import com.rems.realestate.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/tenancies")
public class TenancyController {

    @Autowired
    private TenancyRepository tenancyRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<?> createTenancy(@Valid @RequestBody TenancyRequest request, Authentication authentication) {
        try {
            String currentUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();

            // Verify owner is the one making the request
            if (!currentUserId.equals(request.getOwnerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Not authorized to create tenancy for this owner");
            }

            Property property = propertyRepository.findById(request.getPropertyId())
                    .orElseThrow(() -> new RuntimeException("Property not found"));

            if (!property.getOwnerId().equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized to modify this property");
            }

            // Create Tenancy
            Tenancy tenancy = Tenancy.builder()
                    .propertyId(request.getPropertyId())
                    .ownerId(request.getOwnerId())
                    .tenantName(request.getTenantName())
                    .tenantPhone(request.getTenantPhone())
                    .rentAmount(request.getRentAmount())
                    .startDate(request.getStartDate())
                    .status("ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .build();

            Tenancy savedTenancy = tenancyRepository.save(tenancy);

            // Update property status
            property.setStatus(PropertyStatus.RENTED);
            // Optionally set the transaction details on property as we did in the previous
            // step
            property.setTransactionName(request.getTenantName());
            property.setTransactionContact(request.getTenantPhone());
            property.setTransactionAmount(request.getRentAmount());
            propertyRepository.save(property);

            return new ResponseEntity<>(savedTenancy, HttpStatus.CREATED);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
