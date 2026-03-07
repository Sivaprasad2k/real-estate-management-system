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

    private String title;
    private String description;
    private MaintenanceType type;
    private MaintenanceTicketStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
