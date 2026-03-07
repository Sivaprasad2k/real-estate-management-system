package com.rems.realestate.controller;

import com.rems.realestate.dto.MasterStatusRequest;
import com.rems.realestate.dto.TenantMaintenanceDto;
import com.rems.realestate.model.MaintenanceRequest;
import com.rems.realestate.security.UserDetailsImpl;
import com.rems.realestate.service.TenantMaintenanceService;
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
public class TenantMaintenanceController {

    @Autowired
    private TenantMaintenanceService tenantMaintenanceService;

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<?> createMaintenanceRequest(@Valid @RequestBody TenantMaintenanceDto request,
            Authentication authentication) {
        try {
            MaintenanceRequest created = tenantMaintenanceService.createMaintenanceRequest(request);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<MaintenanceRequest>> getOwnerRequests(@PathVariable String ownerId,
            Authentication authentication) {
        String currentUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        if (!currentUserId.equals(ownerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(tenantMaintenanceService.getOwnerRequests(ownerId));
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{requestId}")
    public ResponseEntity<?> updateMaintenanceStatus(@PathVariable String requestId,
            @Valid @RequestBody MasterStatusRequest statusReq, Authentication authentication) {
        try {
            String currentUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            MaintenanceRequest updated = tenantMaintenanceService.updateStatus(requestId, statusReq.getStatus(),
                    currentUserId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
