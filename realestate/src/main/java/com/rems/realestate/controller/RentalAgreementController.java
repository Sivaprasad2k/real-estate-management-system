package com.rems.realestate.controller;

import com.rems.realestate.model.RentalAgreement;
import com.rems.realestate.security.UserDetailsImpl;
import com.rems.realestate.service.RentalAgreementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rentals")
public class RentalAgreementController {

    @Autowired
    private RentalAgreementService rentalAgreementService;

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{propertyId}/end")
    public ResponseEntity<?> endRental(@PathVariable String propertyId, Authentication authentication) {
        try {
            String ownerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            RentalAgreement agreement = rentalAgreementService.endRental(propertyId, ownerId);
            return ResponseEntity.ok(agreement);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/owner")
    public ResponseEntity<List<RentalAgreement>> getOwnerAgreements(Authentication authentication) {
        String ownerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(rentalAgreementService.getOwnerAgreements(ownerId));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/tenant")
    public ResponseEntity<List<RentalAgreement>> getTenantAgreements(Authentication authentication) {
        String tenantId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(rentalAgreementService.getTenantAgreements(tenantId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<List<RentalAgreement>> getAllAgreements() {
        return ResponseEntity.ok(rentalAgreementService.getAllAgreements());
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{propertyId}/accept")
    public ResponseEntity<?> acceptAgreement(@PathVariable String propertyId, Authentication authentication) {
        try {
            String tenantId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            RentalAgreement agreement = rentalAgreementService.acceptAgreement(propertyId, tenantId);
            return ResponseEntity.ok(agreement);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{propertyId}/simulate-payment")
    public ResponseEntity<?> simulatePayment(@PathVariable String propertyId, Authentication authentication) {
        try {
            String tenantId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            RentalAgreement agreement = rentalAgreementService.simulatePayment(propertyId, tenantId);
            return ResponseEntity.ok(agreement);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{propertyId}/agreement")
    public ResponseEntity<?> getAgreementDetails(@PathVariable String propertyId) {
        try {
            RentalAgreement agreement = rentalAgreementService.getAgreementDetails(propertyId);
            return ResponseEntity.ok(agreement);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/upload")
    public ResponseEntity<?> uploadLeaseAgreement(
            @RequestParam("propertyId") String propertyId,
            @RequestParam(value = "tenantId", required = false) String tenantId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            Authentication authentication) {
        try {
            String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            RentalAgreement agreement = rentalAgreementService.uploadLeaseAgreement(propertyId, tenantId, file, userId);
            return ResponseEntity.ok(agreement);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{propertyId}/verify")
    public ResponseEntity<?> verifyLease(@PathVariable String propertyId, Authentication authentication) {
        try {
            String tenantId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            RentalAgreement agreement = rentalAgreementService.confirmLease(propertyId, tenantId);
            return ResponseEntity.ok(agreement);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{propertyId}/document")
    public ResponseEntity<byte[]> downloadDocument(@PathVariable String propertyId) {
        try {
            RentalAgreement agreement = rentalAgreementService.getAgreementDetails(propertyId);
            if (agreement.getDocumentData() == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + agreement.getFileName() + "\"")
                    .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, agreement.getFileType())
                    .body(agreement.getDocumentData());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
