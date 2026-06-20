package com.rems.realestate.controller;

import com.rems.realestate.dto.SystemStatsResponse;
import com.rems.realestate.dto.StaffRegisterRequest;
import com.rems.realestate.model.MaintenanceTicket;
import com.rems.realestate.model.Property;
import com.rems.realestate.model.Report;
import com.rems.realestate.model.User;
import com.rems.realestate.dto.SystemStatsResponse;
import com.rems.realestate.dto.MaintenanceAnalyticsResponse;
import com.rems.realestate.service.PropertyService;
import com.rems.realestate.service.ReportService;
import com.rems.realestate.service.UserService;
import com.rems.realestate.service.MaintenanceService;
import com.rems.realestate.repository.UserRepository;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.ReportRepository;
import com.rems.realestate.repository.MaintenanceTicketRepository;
import com.rems.realestate.repository.SuspiciousActivityLogRepository;
import com.rems.realestate.model.SuspiciousActivityLog;
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

    @Autowired
    private MaintenanceService maintenanceService;

    @Autowired
    private com.rems.realestate.service.NotificationService notificationService;

    @Autowired
    private SuspiciousActivityLogRepository suspiciousLogRepository;

    @GetMapping("/stats")
    public ResponseEntity<SystemStatsResponse> getSystemStats() {
        long totalUsers = userRepository.count();
        long totalProperties = propertyRepository.count();
        long activeReports = reportRepository.count(); 
        long activeTickets = ticketRepository.count(); 

        List<Property> allProperties = propertyRepository.findAll();
        long activeRentals = allProperties.stream()
                .filter(p -> p.getStatus() == com.rems.realestate.model.PropertyStatus.RENTED 
                          || p.getStatus() == com.rems.realestate.model.PropertyStatus.RENT_IN_PROGRESS
                          || p.getStatus() == com.rems.realestate.model.PropertyStatus.PENDING_TENANT_CONFIRMATION)
                .count();
        long activeSales = allProperties.stream()
                .filter(p -> p.getStatus() == com.rems.realestate.model.PropertyStatus.SOLD 
                          || p.getStatus() == com.rems.realestate.model.PropertyStatus.SALE_IN_PROGRESS
                          || p.getStatus() == com.rems.realestate.model.PropertyStatus.PENDING_BUYER_CONFIRMATION)
                .count();

        SystemStatsResponse stats = SystemStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalProperties(totalProperties)
                .activeReports(activeReports)
                .activeTickets(activeTickets)
                .activeRentals(activeRentals)
                .activeSales(activeSales)
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

    @GetMapping("/maintenance/analytics")
    public ResponseEntity<MaintenanceAnalyticsResponse> getMaintenanceAnalytics() {
        return ResponseEntity.ok(maintenanceService.getAnalytics());
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

    @GetMapping("/suspicious-logs")
    public ResponseEntity<List<SuspiciousActivityLog>> getSuspiciousLogs() {
        return ResponseEntity.ok(suspiciousLogRepository.findAll());
    }

    @PutMapping("/properties/{id}/featured")
    public ResponseEntity<?> toggleFeaturedProperty(@PathVariable String id, @RequestParam boolean featured) {
        try {
            Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
            property.setPromoted(featured);
            Property saved = propertyRepository.save(property);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/users/{id}/skills")
    public ResponseEntity<?> updateStaffSkills(@PathVariable String id, @RequestBody List<String> skills) {
        try {
            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            if (!user.getRoles().contains("ROLE_MAINTENANCE")) {
                return ResponseEntity.badRequest().body("User is not a maintenance staff member");
            }
            if (skills == null || skills.isEmpty()) {
                return ResponseEntity.badRequest().body("At least one technical skill is required for maintenance staff.");
            }
            List<com.rems.realestate.model.MaintenanceType> newSkills = skills.stream()
                .map(s -> com.rems.realestate.model.MaintenanceType.valueOf(s.toUpperCase()))
                .collect(java.util.stream.Collectors.toList());
            user.setSkills(newSkills);
            User saved = userRepository.save(user);
            notificationService.createNotification(id, "Your technical skills have been updated by the Administrator: " + skills.toString(), "MAINTENANCE");
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid skill name provided");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

