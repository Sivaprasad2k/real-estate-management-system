package com.rems.realestate.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class SaleAgreementUploadRequest {

    @NotBlank(message = "Property ID is required")
    private String propertyId;

    private String buyerId; // Optional if seller is uploading, required if buyer is uploading

    @NotBlank(message = "Document URL is required")
    private String documentUrl;
}
