package com.rems.realestate.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
public class RentalMetadataRequest {
    @NotNull(message = "Tenant ID is required")
    private String tenantId;

    @NotNull(message = "Rent Amount is required")
    private Double rentAmount;

    private Double depositAmount;
    private LocalDateTime rentStartDate;
    private LocalDateTime rentEndDate;
    private String notes;
}
