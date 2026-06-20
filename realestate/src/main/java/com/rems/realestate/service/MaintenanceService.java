package com.rems.realestate.service;

import com.rems.realestate.dto.MaintenanceTicketRequest;
import com.rems.realestate.dto.MaintenanceTicketResponse;
import com.rems.realestate.model.*;
import com.rems.realestate.repository.MaintenanceTicketRepository;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.RentalAgreementRepository;
import com.rems.realestate.repository.UserRepository;
import com.rems.realestate.repository.MessageRepository;
import com.rems.realestate.event.MaintenanceEvent.*;
import com.rems.realestate.dto.MaintenanceAnalyticsResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
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

        @Autowired
        private MongoTemplate mongoTemplate;

        @Autowired
        private ApplicationEventPublisher eventPublisher;

        @Autowired
        private NotificationService notificationService;

        public MaintenanceTicket createTicket(String propertyId, MaintenanceTicketRequest request, String tenantId) {
                Property property = propertyRepository.findById(propertyId)
                                .orElseThrow(() -> new RuntimeException("Property not found"));

                if (property.getStatus() != PropertyStatus.RENTED) {
                        throw new RuntimeException("Maintenance tickets can only be created for RENTED properties.");
                }

                boolean isTenantOfAgreement = rentalAgreementRepository
                                .findByPropertyIdAndStatus(propertyId, RentalAgreementStatus.ACTIVE)
                                .map(agreement -> tenantId.equals(agreement.getTenantId()))
                                .orElse(false);

                boolean isTenantOfProperty = tenantId.equals(property.getTenantId());

                if (!isTenantOfAgreement && !isTenantOfProperty) {
                        throw new RuntimeException("Access denied. Only the active tenant of this property is allowed to submit maintenance tickets.");
                }

                MaintenanceType type = request.getType() != null ? request.getType() : MaintenanceType.GENERAL;
                String priority = request.getPriority();
                if (priority == null || priority.isEmpty()) {
                        priority = deducePriority(request.getTitle(), request.getDescription());
                } else {
                        priority = priority.toUpperCase();
                }
                LocalDateTime deadline = calculateSlaDeadline(priority);

                MaintenanceTicket ticket = MaintenanceTicket.builder()
                                .propertyId(propertyId)
                                .ownerId(property.getOwnerId())
                                .tenantId(tenantId)
                                .title(request.getTitle())
                                .description(request.getDescription())
                                .status(MaintenanceTicketStatus.OPEN)
                                .type(type)
                                .priority(priority)
                                .slaDeadline(deadline)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();

                addTimelineEntry(ticket, "OPEN", "Ticket Created", "Maintenance ticket created with status OPEN.");
                MaintenanceTicket savedTicket = maintenanceTicketRepository.save(ticket);
                eventPublisher.publishEvent(new MaintenanceCreatedEvent(this, savedTicket));
                return savedTicket;
        }

        public MaintenanceTicket createGuestTicket(String propertyId, MaintenanceTicketRequest request,
                        Tenancy tenancy) {
                Property property = propertyRepository.findById(propertyId)
                                .orElseThrow(() -> new RuntimeException("Property not found"));

                MaintenanceType type = request.getType() != null ? request.getType() : MaintenanceType.GENERAL;
                String priority = request.getPriority();
                if (priority == null || priority.isEmpty()) {
                        priority = deducePriority(request.getTitle(), request.getDescription());
                } else {
                        priority = priority.toUpperCase();
                }
                LocalDateTime deadline = calculateSlaDeadline(priority);

                MaintenanceTicket ticket = MaintenanceTicket.builder()
                                .propertyId(propertyId)
                                .ownerId(property.getOwnerId())
                                .tenantId("GUEST_" + tenancy.getId()) // Fake ID for guests
                                .title(request.getTitle())
                                .description(request.getDescription())
                                .status(MaintenanceTicketStatus.OPEN)
                                .type(type)
                                .priority(priority)
                                .slaDeadline(deadline)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();

                addTimelineEntry(ticket, "OPEN", "Ticket Created", "Maintenance ticket created with status OPEN (Guest Request).");
                MaintenanceTicket savedTicket = maintenanceTicketRepository.save(ticket);
                eventPublisher.publishEvent(new MaintenanceCreatedEvent(this, savedTicket));
                return savedTicket;
        }

        private MaintenanceTicketResponse mapToResponse(MaintenanceTicket ticket) {
                Property property = propertyRepository.findById(ticket.getPropertyId()).orElse(null);
                User tenant = userRepository.findById(ticket.getTenantId()).orElse(null);
                User owner = userRepository.findById(ticket.getOwnerId()).orElse(null);

                String address = "N/A";
                if (property != null) {
                        address = property.getCity() != null ? property.getCity() : "";
                        if (property.getState() != null && !property.getState().isEmpty()) {
                                if (!address.isEmpty()) {
                                        address += ", ";
                                }
                                address += property.getState();
                        }
                        if (address.isEmpty()) {
                                address = "N/A";
                        }
                }

                return MaintenanceTicketResponse.builder()
                                .id(ticket.getId())
                                .propertyId(ticket.getPropertyId())
                                .propertyTitle(property != null ? property.getTitle() : "Unknown Property")
                                .propertyAddress(address)
                                .tenantName(tenant != null ? tenant.getName() : "Unknown Tenant")
                                .tenantEmail(tenant != null ? tenant.getEmail() : "Unknown Email")
                                .ownerId(ticket.getOwnerId())
                                .ownerName(owner != null ? owner.getName() : "Unknown Owner")
                                .staffId(ticket.getStaffId())
                                .title(ticket.getTitle())
                                .description(ticket.getDescription())
                                .type(ticket.getType())
                                .status(ticket.getStatus())
                                .priority(ticket.getPriority())
                                .resolutionSummary(ticket.getResolutionSummary())
                                .beforeRepairPhotos(ticket.getBeforeRepairPhotos() != null ? ticket.getBeforeRepairPhotos() : java.util.List.of())
                                .afterRepairPhotos(ticket.getAfterRepairPhotos() != null ? ticket.getAfterRepairPhotos() : java.util.List.of())
                                .timeline(ticket.getTimeline() != null ? ticket.getTimeline() : java.util.List.of())
                                .reopenedCount(ticket.getReopenedCount())
                                .slaDeadline(ticket.getSlaDeadline())
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

        public List<MaintenanceTicketResponse> getAvailableTicketsForStaff(String staffId) {
                User staff = userRepository.findById(staffId)
                                .orElseThrow(() -> new RuntimeException("Staff not found"));

                List<MaintenanceType> skills = staff.getSkills();
                if (skills == null || skills.isEmpty()) {
                        return List.of();
                }

                return maintenanceTicketRepository.findByStatusAndTypeIn(MaintenanceTicketStatus.OPEN, skills)
                                .stream()
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

                User staff = userRepository.findById(staffId)
                                .orElseThrow(() -> new RuntimeException("Staff member not found"));

                ticket.setStaffId(staffId);
                ticket.setStatus(MaintenanceTicketStatus.ASSIGNED);
                ticket.setUpdatedAt(LocalDateTime.now());

                addTimelineEntry(ticket, "ASSIGNED", "Job Assigned", "Property owner assigned the job to staff: " + staff.getName());

                MaintenanceTicket savedTicket = maintenanceTicketRepository.save(ticket);

                // Notify staff
                notificationService.createNotification(staffId, "New Job Assigned: " + ticket.getTitle(), "MAINTENANCE");

                return savedTicket;
        }

        public MaintenanceTicket updateStatus(String ticketId, MaintenanceTicketStatus newStatus, String userId,
                        boolean isStaff, boolean isOwner) {
                MaintenanceTicket ticket = maintenanceTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new RuntimeException("Ticket not found"));

                boolean actualOwner = isOwner || userId.equals(ticket.getOwnerId());

                if (!isStaff && !actualOwner) {
                        throw new RuntimeException("Not authorized to update ticket status.");
                }

                if (isStaff && !userId.equals(ticket.getStaffId())) {
                        throw new RuntimeException("Only assigned staff can update this ticket.");
                }

                if (actualOwner && !userId.equals(ticket.getOwnerId())) {
                        throw new RuntimeException("Only the property owner can update this ticket.");
                }

                MaintenanceTicketStatus current = ticket.getStatus();

                if (isStaff) {
                        if (newStatus == MaintenanceTicketStatus.ACCEPTED) {
                                if (current != MaintenanceTicketStatus.ASSIGNED) {
                                        throw new RuntimeException("Invalid status transition: Can only accept ticket if it is ASSIGNED. Current status: " + current);
                                }
                                ticket.setStatus(MaintenanceTicketStatus.ACCEPTED);
                                addTimelineEntry(ticket, "ACCEPTED", "Job Accepted", "Staff member accepted the job.");
                        } else if (newStatus == MaintenanceTicketStatus.IN_PROGRESS) {
                                if (current != MaintenanceTicketStatus.ACCEPTED) {
                                        throw new RuntimeException("Invalid status transition: Can only start work if ticket is ACCEPTED. Current status: " + current);
                                }
                                ticket.setStatus(MaintenanceTicketStatus.IN_PROGRESS);
                                addTimelineEntry(ticket, "IN_PROGRESS", "Work Started", "Staff started working on the ticket.");
                        } else if (newStatus == MaintenanceTicketStatus.COMPLETED) {
                                throw new RuntimeException("COMPLETED status requires resolution notes and photo evidence. Please use the Complete Job button.");
                        } else {
                                throw new RuntimeException("Staff cannot transition ticket to status " + newStatus);
                        }
                } else {
                        if (newStatus == MaintenanceTicketStatus.CLOSED) {
                                if (current != MaintenanceTicketStatus.COMPLETED) {
                                        throw new RuntimeException("Can only close a ticket that is COMPLETED. Current status: " + current);
                                }
                                ticket.setStatus(MaintenanceTicketStatus.CLOSED);
                                addTimelineEntry(ticket, "CLOSED", "Ticket Closed", "Owner approved completion and closed the ticket.");
                                
                                // Notify staff
                                if (ticket.getStaffId() != null) {
                                        notificationService.createNotification(ticket.getStaffId(), "Owner approved completion for ticket: " + ticket.getTitle(), "MAINTENANCE");
                                }
                        } else if (newStatus == MaintenanceTicketStatus.ASSIGNED) {
                                if (current != MaintenanceTicketStatus.COMPLETED && current != MaintenanceTicketStatus.CLOSED) {
                                        throw new RuntimeException("Can only reopen a ticket that is COMPLETED or CLOSED. Current status: " + current);
                                }
                                ticket.setStatus(MaintenanceTicketStatus.ASSIGNED);
                                ticket.setReopenedCount(ticket.getReopenedCount() + 1);
                                addTimelineEntry(ticket, "ASSIGNED", "Ticket Reopened", "Ticket reopened by owner/admin. Incremented reopened count.");
                                
                                // Notify staff
                                if (ticket.getStaffId() != null) {
                                        notificationService.createNotification(ticket.getStaffId(), "Ticket has been REOPENED: " + ticket.getTitle(), "MAINTENANCE");
                                }
                        } else {
                                throw new RuntimeException("Owner cannot transition ticket to status " + newStatus);
                        }
                }

                ticket.setUpdatedAt(LocalDateTime.now());
                return maintenanceTicketRepository.save(ticket);
        }

        public MaintenanceTicket acceptTicket(String ticketId, String staffId) {
                MaintenanceTicket ticket = maintenanceTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new RuntimeException("Ticket not found"));

                if (ticket.getStatus() != MaintenanceTicketStatus.OPEN) {
                        throw new RuntimeException("Ticket is already claimed or assigned.");
                }

                User staff = userRepository.findById(staffId)
                                .orElseThrow(() -> new RuntimeException("Staff member not found"));

                if (staff.getSkills() == null || !staff.getSkills().contains(ticket.getType())) {
                        throw new RuntimeException("Cannot claim job: Your registered maintenance skills do not match this ticket's category.");
                }

                ticket.setStaffId(staffId);
                ticket.setStatus(MaintenanceTicketStatus.ASSIGNED);
                ticket.setAcceptedAt(LocalDateTime.now());
                ticket.setUpdatedAt(LocalDateTime.now());

                addTimelineEntry(ticket, "ASSIGNED", "Job Claimed Successfully", "Job claimed from Available Pool by staff: " + staff.getName());

                MaintenanceTicket savedTicket = maintenanceTicketRepository.save(ticket);
                eventPublisher.publishEvent(new MaintenanceAcceptedEvent(this, savedTicket));

                // Send notifications
                notificationService.createNotification(staffId, "Job claimed successfully for ticket: " + ticket.getTitle(), "MAINTENANCE");
                notificationService.createNotification(ticket.getOwnerId(), "Staff " + staff.getName() + " has claimed maintenance ticket: " + ticket.getTitle(), "MAINTENANCE");

                return savedTicket;
        }

        public MaintenanceTicket cancelTicket(String ticketId, String staffId) {
                MaintenanceTicket ticket = maintenanceTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new RuntimeException("Ticket not found"));

                if (!staffId.equals(ticket.getStaffId())) {
                        throw new RuntimeException("Only the assigned staff can cancel this ticket.");
                }

                if (ticket.getAcceptedAt() == null
                                || ticket.getAcceptedAt().isBefore(LocalDateTime.now().minusMinutes(30))) {
                        throw new RuntimeException("Cancellation window of 30 minutes has expired.");
                }

                ticket.setStaffId(null);
                ticket.setStatus(MaintenanceTicketStatus.OPEN);
                ticket.setAcceptedAt(null);
                ticket.setUpdatedAt(LocalDateTime.now());

                addTimelineEntry(ticket, "OPEN", "Job Released", "Staff member released the job back to the Available Pool.");

                MaintenanceTicket savedTicket = maintenanceTicketRepository.save(ticket);
                eventPublisher.publishEvent(new MaintenanceCancelledEvent(this, savedTicket));

                // Send notification to owner
                notificationService.createNotification(ticket.getOwnerId(), "Maintenance job released by staff. Ticket is now back in available pool.", "MAINTENANCE");

                return savedTicket;
        }

        public MaintenanceTicket completeTicket(String ticketId, String staffId, String resolutionSummary,
                                                List<String> beforeRepairPhotos, List<String> afterRepairPhotos) {
                MaintenanceTicket ticket = maintenanceTicketRepository.findById(ticketId)
                                .orElseThrow(() -> new RuntimeException("Ticket not found"));

                if (!staffId.equals(ticket.getStaffId())) {
                        throw new RuntimeException("Only the assigned staff can complete this ticket.");
                }

                if (ticket.getStatus() != MaintenanceTicketStatus.IN_PROGRESS) {
                        throw new RuntimeException("Cannot complete work: Ticket must be in IN_PROGRESS status.");
                }

                if (resolutionSummary == null || resolutionSummary.trim().isEmpty()) {
                        throw new RuntimeException("Resolution summary is mandatory before marking as completed.");
                }

                if (beforeRepairPhotos == null || beforeRepairPhotos.isEmpty()) {
                        throw new RuntimeException("Before repair photos are mandatory before marking as completed.");
                }

                if (afterRepairPhotos == null || afterRepairPhotos.isEmpty()) {
                        throw new RuntimeException("After repair photos are mandatory before marking as completed.");
                }

                ticket.setResolutionSummary(resolutionSummary);
                ticket.setBeforeRepairPhotos(beforeRepairPhotos);
                ticket.setAfterRepairPhotos(afterRepairPhotos);
                ticket.setStatus(MaintenanceTicketStatus.COMPLETED);
                ticket.setCompletedAt(LocalDateTime.now());
                ticket.setUpdatedAt(LocalDateTime.now());

                addTimelineEntry(ticket, "COMPLETED", "Work Completed", "Staff marked job as completed. Resolution details and photo evidence uploaded.");

                MaintenanceTicket savedTicket = maintenanceTicketRepository.save(ticket);
                eventPublisher.publishEvent(new MaintenanceCompletedEvent(this, savedTicket));

                // Notify owner
                notificationService.createNotification(ticket.getOwnerId(), "Maintenance job completed for ticket: " + ticket.getTitle() + ". Please review and close.", "MAINTENANCE");

                return savedTicket;
        }

        public com.rems.realestate.dto.StaffMetricsResponse getStaffMetrics(String staffId) {
                List<MaintenanceTicket> tickets = maintenanceTicketRepository.findByStaffId(staffId);

                long totalCompleted = tickets.stream()
                                .filter(t -> t.getStatus() == MaintenanceTicketStatus.COMPLETED || t.getStatus() == MaintenanceTicketStatus.CLOSED)
                                .count();

                long activeJobs = tickets.stream()
                                .filter(t -> t.getStatus() == MaintenanceTicketStatus.ASSIGNED 
                                          || t.getStatus() == MaintenanceTicketStatus.ACCEPTED 
                                          || t.getStatus() == MaintenanceTicketStatus.IN_PROGRESS)
                                .count();

                long reopenedTicketsCount = tickets.stream()
                                .mapToLong(MaintenanceTicket::getReopenedCount)
                                .sum();

                long assignedCount = tickets.size();
                double completionRate = assignedCount == 0 ? 0.0 : (totalCompleted * 100.0) / assignedCount;

                List<MaintenanceTicket> resolvedWithTimes = tickets.stream()
                                .filter(t -> t.getCompletedAt() != null && t.getAcceptedAt() != null && (t.getStatus() == MaintenanceTicketStatus.COMPLETED || t.getStatus() == MaintenanceTicketStatus.CLOSED))
                                .collect(Collectors.toList());

                double avgResolutionTimeHours = 0.0;
                if (!resolvedWithTimes.isEmpty()) {
                        long totalMs = 0;
                        for (MaintenanceTicket t : resolvedWithTimes) {
                                java.time.Duration duration = java.time.Duration.between(t.getAcceptedAt(), t.getCompletedAt());
                                totalMs += duration.toMillis();
                        }
                        avgResolutionTimeHours = (double) totalMs / (1000 * 60 * 60 * resolvedWithTimes.size());
                }

                return com.rems.realestate.dto.StaffMetricsResponse.builder()
                                .totalCompleted(totalCompleted)
                                .averageResolutionTimeHours(avgResolutionTimeHours)
                                .activeJobs(activeJobs)
                                .reopenedTicketsCount(reopenedTicketsCount)
                                .completionRate(completionRate)
                                .build();
        }

        public MaintenanceAnalyticsResponse getAnalytics() {
                long total = maintenanceTicketRepository.count();
                long open = maintenanceTicketRepository.countByStatus(MaintenanceTicketStatus.OPEN);
                long assigned = maintenanceTicketRepository.countByStatus(MaintenanceTicketStatus.ASSIGNED);
                long completed = maintenanceTicketRepository.countByStatus(MaintenanceTicketStatus.COMPLETED);

                return MaintenanceAnalyticsResponse.builder()
                                .totalTickets(total)
                                .openTickets(open)
                                .assignedTickets(assigned)
                                .completedTickets(completed)
                                .build();
        }

        private String deducePriority(String title, String description) {
                String combined = (title + " " + description).toLowerCase();
                if (combined.contains("shock") || combined.contains("emergency") || combined.contains("short circuit") || 
                    combined.contains("power failure") || combined.contains("power out") || combined.contains("gas leak") || 
                    combined.contains("fire") || combined.contains("spark")) {
                        return "EMERGENCY";
                }
                if (combined.contains("leak") || combined.contains("burst") || combined.contains("flood") || 
                    combined.contains("clog") || combined.contains("water") || combined.contains("no water") || 
                    combined.contains("ac not working") || combined.contains("air conditioner") || combined.contains("heater")) {
                        return "HIGH";
                }
                if (combined.contains("fan") || combined.contains("bulb") || combined.contains("light") || 
                    combined.contains("switch") || combined.contains("key") || combined.contains("lock")) {
                        return "LOW";
                }
                if (combined.contains("paint") || combined.contains("wall") || combined.contains("stain") || 
                    combined.contains("crack") || combined.contains("furniture") || combined.contains("door") || 
                    combined.contains("window")) {
                        return "MEDIUM";
                }
                return "MEDIUM";
        }

        private LocalDateTime calculateSlaDeadline(String priority) {
                LocalDateTime now = LocalDateTime.now();
                if ("EMERGENCY".equalsIgnoreCase(priority)) {
                        return now.plusHours(4);
                } else if ("HIGH".equalsIgnoreCase(priority)) {
                        return now.plusDays(1);
                } else if ("LOW".equalsIgnoreCase(priority)) {
                        return now.plusDays(7);
                } else {
                        return now.plusDays(3); // default MEDIUM
                }
        }

        private void addTimelineEntry(MaintenanceTicket ticket, String status, String title, String description) {
                if (ticket.getTimeline() == null) {
                        ticket.setTimeline(new java.util.ArrayList<>());
                }
                ticket.getTimeline().add(MaintenanceTicket.TimelineEntry.builder()
                                .status(status)
                                .title(title)
                                .description(description)
                                .timestamp(LocalDateTime.now())
                                .build());
        }
}
