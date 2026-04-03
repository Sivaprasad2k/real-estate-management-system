package com.rems.realestate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenancyRequest {

    @NotBlank(message = "Property ID is required")
    private String propertyId;

    @NotBlank(message = "Owner ID is required")
    private String ownerId;

    @NotBlank(message = "Tenant name is required")
    private String tenantName;

    @NotBlank(message = "Tenant phone is required")
    private String tenantPhone;

    private String tenantEmail;

    @NotNull(message = "Rent amount is required")
    private Double rentAmount;

    @NotNull(message = "Start date is required")
    private LocalDateTime startDate;
}
