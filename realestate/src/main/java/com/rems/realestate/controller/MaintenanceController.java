package com.rems.realestate.controller;

import com.rems.realestate.dto.MaintenanceTicketRequest;
import com.rems.realestate.dto.MaintenanceTicketResponse;
import com.rems.realestate.model.MaintenanceTicket;
import com.rems.realestate.model.MaintenanceTicketStatus;
import com.rems.realestate.security.UserDetailsImpl;
import com.rems.realestate.service.MaintenanceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

    @Autowired
    private MaintenanceService maintenanceService;

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{propertyId}")
    public ResponseEntity<?> createTicket(@PathVariable String propertyId,
            @Valid @RequestBody MaintenanceTicketRequest request,
            Authentication authentication) {
        try {
            String tenantId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            MaintenanceTicket ticket = maintenanceService.createTicket(propertyId, request, tenantId);
            return new ResponseEntity<>(ticket, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/owner")
    public ResponseEntity<List<MaintenanceTicketResponse>> getOwnerTickets(Authentication authentication) {
        String ownerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(maintenanceService.getOwnerTickets(ownerId));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/tenant")
    public ResponseEntity<List<MaintenanceTicketResponse>> getTenantTickets(Authentication authentication) {
        String tenantId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(maintenanceService.getTenantTickets(tenantId));
    }

    @PreAuthorize("hasRole('MAINTENANCE') or hasRole('ADMIN')")
    @GetMapping("/staff")
    public ResponseEntity<List<MaintenanceTicketResponse>> getStaffTickets(Authentication authentication) {
        String staffId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(maintenanceService.getStaffTickets(staffId));
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{ticketId}/assign/{staffId}")
    public ResponseEntity<?> assignStaff(@PathVariable String ticketId, @PathVariable String staffId,
            Authentication authentication) {
        try {
            String ownerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            MaintenanceTicket ticket = maintenanceService.assignStaff(ticketId, staffId, ownerId);
            return ResponseEntity.ok(ticket);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{ticketId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String ticketId,
            @RequestParam MaintenanceTicketStatus status,
            Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String userId = userDetails.getId();
            boolean isStaff = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_MAINTENANCE"));
            boolean isOwner = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_OWNER"));

            MaintenanceTicket ticket = maintenanceService.updateStatus(ticketId, status, userId, isStaff, isOwner);
            return ResponseEntity.ok(ticket);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public ResponseEntity<List<MaintenanceTicketResponse>> getAllTickets() {
        return ResponseEntity.ok(maintenanceService.getAllTickets());
    }
}
