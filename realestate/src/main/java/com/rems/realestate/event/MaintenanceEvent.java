package com.rems.realestate.event;

import com.rems.realestate.model.MaintenanceTicket;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class MaintenanceEvent extends ApplicationEvent {
    private final MaintenanceTicket ticket;

    public MaintenanceEvent(Object source, MaintenanceTicket ticket) {
        super(source);
        this.ticket = ticket;
    }

    public static class MaintenanceCreatedEvent extends MaintenanceEvent {
        public MaintenanceCreatedEvent(Object source, MaintenanceTicket ticket) {
            super(source, ticket);
        }
    }

    public static class MaintenanceAcceptedEvent extends MaintenanceEvent {
        public MaintenanceAcceptedEvent(Object source, MaintenanceTicket ticket) {
            super(source, ticket);
        }
    }

    public static class MaintenanceCancelledEvent extends MaintenanceEvent {
        public MaintenanceCancelledEvent(Object source, MaintenanceTicket ticket) {
            super(source, ticket);
        }
    }

    public static class MaintenanceCompletedEvent extends MaintenanceEvent {
        public MaintenanceCompletedEvent(Object source, MaintenanceTicket ticket) {
            super(source, ticket);
        }
    }
}
