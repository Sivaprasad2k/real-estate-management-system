package com.rems.realestate.event;

import com.rems.realestate.model.User;
import com.rems.realestate.repository.UserRepository;
import com.rems.realestate.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class MaintenanceEventListener {

        @Autowired
        private NotificationService notificationService;

        @Autowired
        private UserRepository userRepository;

        @EventListener
        public void handleMaintenanceCreated(MaintenanceEvent.MaintenanceCreatedEvent event) {
                // notify maintenance staff, update dashboard, log request creation
                List<User> maintenanceStaff = userRepository.findAll().stream()
                                .filter(u -> u.getRoles() != null && u.getRoles().contains("ROLE_MAINTENANCE"))
                                .toList();

                for (User staff : maintenanceStaff) {
                        notificationService.createNotification(
                                        staff.getId(),
                                        "System Notice: A new maintenance ticket '" + event.getTicket().getTitle()
                                                        + "' is OPEN and ready for acceptance.",
                                        "MAINTENANCE");
                }
        }

        @EventListener
        public void handleMaintenanceAccepted(MaintenanceEvent.MaintenanceAcceptedEvent event) {
                notificationService.createNotification(
                                event.getTicket().getTenantId(),
                                "System Notice: Your maintenance ticket '" + event.getTicket().getTitle()
                                                + "' has been ASSIGNED.",
                                "MAINTENANCE");
        }

        @EventListener
        public void handleMaintenanceCancelled(MaintenanceEvent.MaintenanceCancelledEvent event) {
                // notify staff again, reopen maintenance request
                List<User> maintenanceStaff = userRepository.findAll().stream()
                                .filter(u -> u.getRoles() != null && u.getRoles().contains("ROLE_MAINTENANCE"))
                                .toList();

                for (User staff : maintenanceStaff) {
                        notificationService.createNotification(
                                        staff.getId(),
                                        "System Notice: Maintenance ticket '" + event.getTicket().getTitle()
                                                        + "' was CANCELLED and is OPEN again.",
                                        "MAINTENANCE");
                }
        }

        @EventListener
        public void handleMaintenanceCompleted(MaintenanceEvent.MaintenanceCompletedEvent event) {
                notificationService.createNotification(
                                event.getTicket().getTenantId(),
                                "System Notice: Your maintenance ticket '" + event.getTicket().getTitle()
                                                + "' has been COMPLETED.",
                                "MAINTENANCE");
        }
}
