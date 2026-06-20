package com.rems.realestate.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.rems.realestate.model.MaintenanceType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantMaintenanceDto {
    @NotBlank(message = "Property ID is required")
    private String propertyId;

    @NotBlank(message = "Tenant name is required")
    private String tenantName;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    private MaintenanceType type;

    private String priority;
}
