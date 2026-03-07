package com.rems.realestate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import com.rems.realestate.model.MaintenanceType;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "maintenance_requests")
public class MaintenanceRequest {

    @Id
    private String id;

    @Indexed
    private String propertyId;

    @Indexed
    private String ownerId;

    private String tenantName;
    private String title;
    private String description;

    @Builder.Default
    private MaintenanceType type = MaintenanceType.GENERAL;

    @Indexed
    private String staffId;

    @Builder.Default
    private String status = "OPEN"; // Allowed: OPEN, IN_PROGRESS, RESOLVED

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
