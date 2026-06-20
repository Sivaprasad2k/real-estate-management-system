package com.rems.realestate.controller;

import com.rems.realestate.dto.TenancyRequest;
import com.rems.realestate.model.Property;
import com.rems.realestate.model.PropertyStatus;
import com.rems.realestate.model.Tenancy;
import com.rems.realestate.model.RentalAgreement;
import com.rems.realestate.model.RentalAgreementStatus;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.TenancyRepository;
import com.rems.realestate.repository.RentalAgreementRepository;
import com.rems.realestate.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import java.util.ArrayList;
import com.rems.realestate.model.User;
import com.rems.realestate.repository.UserRepository;

@RestController
@RequestMapping("/api/tenancies")
public class TenancyController {

    @Autowired
    private TenancyRepository tenancyRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private RentalAgreementRepository rentalAgreementRepository;

    @Autowired
    private UserRepository userRepository;

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
            String tenantCode = "T-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            Tenancy tenancy = Tenancy.builder()
                    .propertyId(request.getPropertyId())
                    .ownerId(request.getOwnerId())
                    .tenantName(request.getTenantName())
                    .tenantPhone(request.getTenantPhone())
                    .rentAmount(request.getRentAmount())
                    .startDate(request.getStartDate())
                    .tenantCode(tenantCode)
                    .status("ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .build();

            Tenancy savedTenancy = tenancyRepository.save(tenancy);

            // Update property status
            property.setStatus(PropertyStatus.RENTED);
            property.setTransactionName(request.getTenantName());
            property.setTransactionContact(request.getTenantPhone());
            property.setTransactionAmount(request.getRentAmount());
            propertyRepository.save(property);

            return new ResponseEntity<>(savedTenancy, HttpStatus.CREATED);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{propertyId}/terminate")
    public ResponseEntity<?> terminateTenancy(@PathVariable String propertyId, @RequestBody java.util.Map<String, String> body, Authentication authentication) {
        try {
            String currentUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            String reason = body.getOrDefault("reason", "");

            Property property = propertyRepository.findById(propertyId)
                    .orElseThrow(() -> new RuntimeException("Property not found"));

            if (!property.getOwnerId().equals(currentUserId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized to modify this property");
            }

            // Find active tenancy if exists
            Optional<Tenancy> activeTenancy = tenancyRepository.findByPropertyId(propertyId).stream()
                    .filter(t -> "ACTIVE".equalsIgnoreCase(t.getStatus()))
                    .findFirst();

            if (activeTenancy.isPresent()) {
                Tenancy tenancy = activeTenancy.get();
                tenancy.setStatus("ENDED");
                tenancy.setEndDate(LocalDateTime.now());
                tenancy.setEndedBy(currentUserId);
                tenancy.setTerminationReason(reason);
                tenancyRepository.save(tenancy);
            }

            // Find active rental agreement if exists
            Optional<RentalAgreement> activeAgreement = rentalAgreementRepository
                    .findByPropertyIdAndStatus(propertyId, RentalAgreementStatus.ACTIVE);

            if (activeAgreement.isPresent()) {
                RentalAgreement agreement = activeAgreement.get();
                agreement.setStatus(RentalAgreementStatus.ENDED);
                agreement.setEndDate(LocalDateTime.now());
                rentalAgreementRepository.save(agreement);
            }

            // Update property status
            property.setStatus(PropertyStatus.APPROVED); // Change back to APPROVED/Available
            property.setTenantId(null);
            property.setTransactionName(null);
            property.setTransactionContact(null);
            property.setTransactionAmount(null);
            propertyRepository.save(property);

            return ResponseEntity.ok("Tenancy terminated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<Tenancy>> getPropertyTenancies(@PathVariable String propertyId) {
        List<Tenancy> tenancies = new ArrayList<>(tenancyRepository.findByPropertyId(propertyId));
        try {
            List<RentalAgreement> agreements = rentalAgreementRepository.findByPropertyId(propertyId);
            if (agreements != null) {
                for (RentalAgreement agreement : agreements) {
                    String tenantName = "Tenant";
                    String tenantPhone = "N/A";
                    if (agreement.getTenantId() != null) {
                        Optional<User> tenantUser = userRepository.findById(agreement.getTenantId());
                        if (tenantUser.isPresent()) {
                            tenantName = tenantUser.get().getName();
                            tenantPhone = tenantUser.get().getPhoneNumber();
                        }
                    }
                    Tenancy mapped = Tenancy.builder()
                            .id(agreement.getId())
                            .propertyId(agreement.getPropertyId())
                            .ownerId(agreement.getOwnerId())
                            .tenantName(tenantName)
                            .tenantPhone(tenantPhone)
                            .rentAmount(agreement.getMonthlyRent())
                            .startDate(agreement.getStartDate())
                            .endDate(agreement.getEndDate())
                            .tenantCode(agreement.getAgreementNumber())
                            .status(agreement.getStatus() != null ? agreement.getStatus().name() : "ACTIVE")
                            .createdAt(agreement.getCreatedAt())
                            .build();
                    tenancies.add(mapped);
                }
            }
        } catch (Exception e) {
            // Log or ignore if repository has issues
        }
        return ResponseEntity.ok(tenancies);
    }
}
