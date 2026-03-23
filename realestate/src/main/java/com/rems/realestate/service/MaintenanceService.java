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

                MaintenanceTicket savedTicket = maintenanceTicketRepository.save(ticket);
                eventPublisher.publishEvent(new MaintenanceCreatedEvent(this, savedTicket));
                return savedTicket;
        }

        public MaintenanceTicket createGuestTicket(String propertyId, MaintenanceTicketRequest request,
                        Tenancy tenancy) {
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

                MaintenanceTicket savedTicket = maintenanceTicketRepository.save(ticket);
                eventPublisher.publishEvent(new MaintenanceCreatedEvent(this, savedTicket));
                return savedTicket;
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

                if (newStatus == MaintenanceTicketStatus.COMPLETED) {
                        ticket.setCompletedAt(LocalDateTime.now());
                }

                ticket.setStatus(newStatus);
                ticket.setUpdatedAt(LocalDateTime.now());
                MaintenanceTicket savedTicket = maintenanceTicketRepository.save(ticket);

                if (newStatus == MaintenanceTicketStatus.COMPLETED) {
                        eventPublisher.publishEvent(new MaintenanceCompletedEvent(this, savedTicket));
                }

                return savedTicket;
        }

        public MaintenanceTicket acceptTicket(String ticketId, String staffId) {
                Query query = new Query(
                                Criteria.where("id").is(ticketId).and("status").is(MaintenanceTicketStatus.OPEN));

                Update update = new Update();
                update.set("staffId", staffId);
                update.set("status", MaintenanceTicketStatus.ASSIGNED);
                update.set("acceptedAt", LocalDateTime.now());
                update.set("updatedAt", LocalDateTime.now());

                com.mongodb.client.result.UpdateResult result = mongoTemplate.updateFirst(query, update,
                                MaintenanceTicket.class);

                if (result.getModifiedCount() == 0) {
                        throw new RuntimeException(
                                        "Ticket could not be accepted. It may have already been assigned to another staff member or is not OPEN.");
                }

                MaintenanceTicket savedTicket = maintenanceTicketRepository.findById(ticketId).orElseThrow();
                eventPublisher.publishEvent(new MaintenanceAcceptedEvent(this, savedTicket));
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

                MaintenanceTicket savedTicket = maintenanceTicketRepository.save(ticket);
                eventPublisher.publishEvent(new MaintenanceCancelledEvent(this, savedTicket));
                return savedTicket;
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
}
