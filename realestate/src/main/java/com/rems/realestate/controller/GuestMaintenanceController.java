package com.rems.realestate.controller;

import com.rems.realestate.dto.TenantMaintenanceDto;
import com.rems.realestate.dto.MaintenanceTicketRequest;
import com.rems.realestate.model.MaintenanceTicket;
import com.rems.realestate.model.Tenancy;
import com.rems.realestate.repository.TenancyRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/guest/maintenance")
public class GuestMaintenanceController {

    @Autowired
    private TenancyRepository tenancyRepository;

    @Autowired
    private com.rems.realestate.service.MaintenanceService maintenanceService;

    // Unsecured endpoint allowing guests (tenants) to create maintenance requests
    // using their phone number
    @PostMapping
    public ResponseEntity<?> createGuestMaintenanceRequest(@Valid @RequestBody TenantMaintenanceDto request,
            @RequestParam String tenantPhone) {
        try {
            // Validate the user's phone number against the active tenancy for this property
            String cleanedPhone = tenantPhone.trim();
            // Flexible match: trim stored phone numbers to handle existing records with
            // trailing whitespace
            Optional<Tenancy> tenancyObj = tenancyRepository.findByPropertyId(request.getPropertyId())
                    .stream()
                    .filter(t -> t.getTenantPhone() != null && t.getTenantPhone().trim().equals(cleanedPhone))
                    .findFirst();

            if (tenancyObj.isEmpty()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Verification failed. No active tenancy matches this property and phone number.");
            }

            MaintenanceTicketRequest ticketRequest = new MaintenanceTicketRequest();
            ticketRequest.setTitle(request.getTitle());
            ticketRequest.setDescription(request.getDescription());
            ticketRequest.setType(request.getType());

            MaintenanceTicket createdRequest = maintenanceService.createGuestTicket(request.getPropertyId(),
                    ticketRequest, tenancyObj.get());
            return new ResponseEntity<>(createdRequest, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
