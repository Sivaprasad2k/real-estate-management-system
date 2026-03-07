package com.rems.realestate.service;

import com.rems.realestate.dto.MaintenanceTicketRequest;
import com.rems.realestate.dto.MaintenanceTicketResponse;
import com.rems.realestate.model.*;
import com.rems.realestate.repository.MaintenanceTicketRepository;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.RentalAgreementRepository;
import com.rems.realestate.repository.UserRepository;
import com.rems.realestate.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MaintenanceService {

    @Autowired
    private MaintenanceTicketRepository maintenanceTicketRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private RentalAgreementRepository rentalAgreementRepository;

    @Autowired
    private com.rems.realestate.repository.TenancyRepository tenancyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageRepository messageRepository;

    public MaintenanceTicket createTicket(String propertyId, MaintenanceTicketRequest request, String tenantId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getStatus() != PropertyStatus.RENTED) {
            throw new RuntimeException("Maintenance tickets can only be created for RENTED properties.");
        }

        boolean hasActiveRental = rentalAgreementRepository
                .findByPropertyIdAndStatus(propertyId, RentalAgreementStatus.ACTIVE).isPresent();
        boolean hasActiveTenancy = tenancyRepository.findByPropertyId(propertyId).stream()
                .anyMatch(t -> "ACTIVE".equals(t.getStatus()));

        if (!hasActiveRental && !hasActiveTenancy) {
            throw new RuntimeException("No active rental agreement or tenancy found for this property.");
        }

        MaintenanceType type = request.getType() != null ? request.getType() : MaintenanceType.GENERAL;

        MaintenanceTicket ticket = MaintenanceTicket.builder()
                .propertyId(propertyId)
                .ownerId(property.getOwnerId())
                .tenantId(tenantId)
                .title(request.getTitle())
                .description(request.getDescription())
                .status(MaintenanceTicketStatus.OPEN)
                .type(type)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Auto-assign staff based on ticket type: manually filter to avoid MongoDB Enum
        // query mapping issues
        List<User> qualifiedStaff = userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().contains("ROLE_MAINTENANCE"))
                .filter(u -> u.getSkills() != null && u.getSkills().contains(type))
                .collect(Collectors.toList());

        if (!qualifiedStaff.isEmpty()) {
            User assignedStaff = qualifiedStaff.get(0);
            ticket.setStaffId(assignedStaff.getId());
            ticket.setStatus(MaintenanceTicketStatus.ASSIGNED);

            Message msg = Message.builder()
                    .senderId("system_admin")
                    .receiverId(property.getOwnerId())
                    .propertyId(property.getId())
                    .content(String.format(
                            "System Notice: A new %s maintenance ticket '%s' was auto-assigned to %s (%s).",
                            type.toString(), ticket.getTitle(), assignedStaff.getName(),
                            assignedStaff.getPhoneNumber() != null ? assignedStaff.getPhoneNumber() : "No Phone"))
                    .timestamp(LocalDateTime.now())
                    .read(false)
                    .build();
            messageRepository.save(msg);
            messageRepository.save(msg);
        }

        return maintenanceTicketRepository.save(ticket);
    }

    public MaintenanceTicket createGuestTicket(String propertyId, MaintenanceTicketRequest request, Tenancy tenancy) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        MaintenanceType type = request.getType() != null ? request.getType() : MaintenanceType.GENERAL;

        MaintenanceTicket ticket = MaintenanceTicket.builder()
                .propertyId(propertyId)
                .ownerId(property.getOwnerId())
                .tenantId("GUEST_" + tenancy.getId()) // Fake ID for guests
                .title(request.getTitle())
                .description(request.getDescription())
                .status(MaintenanceTicketStatus.OPEN)
                .type(type)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Auto-assign staff based on ticket type: manually filter to avoid MongoDB Enum
        // query mapping issues
        List<User> qualifiedStaff = userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().contains("ROLE_MAINTENANCE"))
                .filter(u -> u.getSkills() != null && u.getSkills().contains(type))
                .collect(Collectors.toList());

        if (!qualifiedStaff.isEmpty()) {
            User assignedStaff = qualifiedStaff.get(0);
            ticket.setStaffId(assignedStaff.getId());
            ticket.setStatus(MaintenanceTicketStatus.ASSIGNED);

            Message msg = Message.builder()
                    .senderId("system_admin")
                    .receiverId(property.getOwnerId())
                    .propertyId(property.getId())
                    .content(String.format(
                            "System Notice: A new %s maintenance ticket '%s' from guest '%s' was auto-assigned to %s (%s).",
                            type.toString(), ticket.getTitle(), tenancy.getTenantName(), assignedStaff.getName(),
                            assignedStaff.getPhoneNumber() != null ? assignedStaff.getPhoneNumber() : "No Phone"))
                    .timestamp(LocalDateTime.now())
                    .read(false)
                    .build();
            messageRepository.save(msg);
        }

        return maintenanceTicketRepository.save(ticket);
    }

    private MaintenanceTicketResponse mapToResponse(MaintenanceTicket ticket) {
        Property property = propertyRepository.findById(ticket.getPropertyId()).orElse(null);
        User tenant = userRepository.findById(ticket.getTenantId()).orElse(null);
        User owner = userRepository.findById(ticket.getOwnerId()).orElse(null);

        return MaintenanceTicketResponse.builder()
                .id(ticket.getId())
                .propertyId(ticket.getPropertyId())
                .propertyTitle(property != null ? property.getTitle() : "Unknown Property")
                .tenantName(tenant != null ? tenant.getName() : "Unknown Tenant")
                .tenantEmail(tenant != null ? tenant.getEmail() : "Unknown Email")
                .ownerId(ticket.getOwnerId())
                .ownerName(owner != null ? owner.getName() : "Unknown Owner")
                .staffId(ticket.getStaffId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .type(ticket.getType())
                .status(ticket.getStatus())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }

    public List<MaintenanceTicketResponse> getOwnerTickets(String ownerId) {
        return maintenanceTicketRepository.findByOwnerId(ownerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<MaintenanceTicketResponse> getTenantTickets(String tenantId) {
        return maintenanceTicketRepository.findByTenantId(tenantId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<MaintenanceTicketResponse> getStaffTickets(String staffId) {
        return maintenanceTicketRepository.findByStaffId(staffId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<MaintenanceTicketResponse> getAllTickets() {
        return maintenanceTicketRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public MaintenanceTicket assignStaff(String ticketId, String staffId, String ownerId) {
        MaintenanceTicket ticket = maintenanceTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (!ticket.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Only the property owner can assign staff.");
        }

        ticket.setStaffId(staffId);
        ticket.setStatus(MaintenanceTicketStatus.ASSIGNED);
        ticket.setUpdatedAt(LocalDateTime.now());

        return maintenanceTicketRepository.save(ticket);
    }

    public MaintenanceTicket updateStatus(String ticketId, MaintenanceTicketStatus newStatus, String userId,
            boolean isStaff, boolean isOwner) {
        MaintenanceTicket ticket = maintenanceTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        if (!isStaff && !isOwner) {
            throw new RuntimeException("Not authorized to update ticket status.");
        }

        if (isStaff && !userId.equals(ticket.getStaffId())) {
            throw new RuntimeException("Only assigned staff can update this ticket.");
        }

        if (isOwner && !userId.equals(ticket.getOwnerId())) {
            throw new RuntimeException("Only the property owner can update this ticket.");
        }

        // Staff can only set to IN_PROGRESS or COMPLETED
        if (isStaff && (newStatus == MaintenanceTicketStatus.CLOSED || newStatus == MaintenanceTicketStatus.OPEN
                || newStatus == MaintenanceTicketStatus.ASSIGNED)) {
            throw new RuntimeException("Staff can only update status to IN_PROGRESS or COMPLETED.");
        }

        ticket.setStatus(newStatus);
        ticket.setUpdatedAt(LocalDateTime.now());
        return maintenanceTicketRepository.save(ticket);
    }
}
