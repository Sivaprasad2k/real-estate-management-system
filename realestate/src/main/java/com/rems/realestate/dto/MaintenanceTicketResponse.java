package com.rems.realestate.dto;

import com.rems.realestate.model.MaintenanceTicketStatus;
import com.rems.realestate.model.MaintenanceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceTicketResponse {
    private String id;
    private String propertyId;
    private String propertyTitle;
    private String tenantName;
    private String tenantEmail;
    private String ownerId;
    private String ownerName;
    private String staffId;
    private String propertyAddress;

    private String title;
    private String description;
    private MaintenanceType type;
    private MaintenanceTicketStatus status;
    private String priority;
    private String resolutionSummary;
    private java.util.List<String> beforeRepairPhotos;
    private java.util.List<String> afterRepairPhotos;
    private java.util.List<com.rems.realestate.model.MaintenanceTicket.TimelineEntry> timeline;
    private int reopenedCount;
    private LocalDateTime slaDeadline;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
