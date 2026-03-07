package com.rems.realestate.controller;

import com.rems.realestate.dto.SystemStatsResponse;
import com.rems.realestate.dto.StaffRegisterRequest;
import com.rems.realestate.model.MaintenanceTicket;
import com.rems.realestate.model.Property;
import com.rems.realestate.model.Report;
import com.rems.realestate.model.User;
import com.rems.realestate.dto.SystemStatsResponse;
import com.rems.realestate.service.PropertyService;
import com.rems.realestate.service.ReportService;
import com.rems.realestate.service.UserService;
import com.rems.realestate.repository.UserRepository;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.ReportRepository;
import com.rems.realestate.repository.MaintenanceTicketRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private PropertyService propertyService;

    @Autowired
    private ReportService reportService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private MaintenanceTicketRepository ticketRepository;

    @GetMapping("/stats")
    public ResponseEntity<SystemStatsResponse> getSystemStats() {
        long totalUsers = userRepository.count();
        long totalProperties = propertyRepository.count();
        long activeReports = reportRepository.count(); // Could optionally filter by status if needed
        long activeTickets = ticketRepository.count(); // Could filter by PENNDING status to be perfectly exact

        SystemStatsResponse stats = SystemStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalProperties(totalProperties)
                .activeReports(activeReports)
                .activeTickets(activeTickets)
                .build();

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/maintenance-staff")
    public ResponseEntity<?> registerMaintenanceStaff(@Valid @RequestBody StaffRegisterRequest request) {
        try {
            userService.registerMaintenanceStaff(request);
            return ResponseEntity.ok("Maintenance staff registered successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/properties")
    public ResponseEntity<List<Property>> getAllProperties() {
        return ResponseEntity.ok(propertyRepository.findAll());
    }

    @GetMapping("/maintenance")
    public ResponseEntity<List<MaintenanceTicket>> getAllMaintenanceTickets() {
        return ResponseEntity.ok(ticketRepository.findAll());
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable String id) {
        try {
            userService.banUser(id);
            return ResponseEntity.ok("User banned successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/users/{id}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable String id) {
        try {
            userService.unbanUser(id);
            return ResponseEntity.ok("User unbanned successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<List<Report>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/properties/flagged")
    public ResponseEntity<List<Property>> getFlaggedProperties() {
        return ResponseEntity.ok(propertyService.getFlaggedProperties());
    }

    @PutMapping("/properties/{id}/approve")
    public ResponseEntity<?> approveProperty(@PathVariable String id) {
        try {
            propertyService.approveProperty(id);
            return ResponseEntity.ok("Property approved successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/properties/{id}/reject")
    public ResponseEntity<?> rejectProperty(@PathVariable String id) {
        try {
            propertyService.rejectProperty(id);
            return ResponseEntity.ok("Property rejected successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
