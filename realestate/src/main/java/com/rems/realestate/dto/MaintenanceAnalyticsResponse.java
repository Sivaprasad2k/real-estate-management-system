package com.rems.realestate.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MaintenanceAnalyticsResponse {
    private long totalTickets;
    private long openTickets;
    private long assignedTickets;
    private long completedTickets;
}
