package com.rems.realestate.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InquiryRequest {
    @NotBlank
    private String message;

    private boolean acceptedRentalRules;
}
