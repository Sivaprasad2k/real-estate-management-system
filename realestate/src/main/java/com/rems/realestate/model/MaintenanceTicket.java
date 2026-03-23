package com.rems.realestate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "maintenance_tickets")
public class MaintenanceTicket {

    @Id
    private String id;

    @Indexed
    private String propertyId;

    @Indexed
    private String ownerId;

    @Indexed
    private String tenantId;

    private String title;
    private String description;

    @Builder.Default
    private MaintenanceType type = MaintenanceType.GENERAL;

    @Indexed
    private String staffId;

    @Builder.Default
    private MaintenanceTicketStatus status = MaintenanceTicketStatus.OPEN;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    private LocalDateTime acceptedAt;

    private LocalDateTime completedAt;
}
