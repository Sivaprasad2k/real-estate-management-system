package com.rems.realestate.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarkRentedRequest {
    @NotBlank(message = "Tenant name is required")
    private String tenantName;

    @NotBlank(message = "Tenant contact is required")
    private String tenantContact;

    @NotNull(message = "Rent amount is required")
    private Double rentAmount;
}
