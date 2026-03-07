package com.rems.realestate.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MessageRequest {
    @NotBlank(message = "Receiver ID is required")
    private String receiverId;

    @NotBlank(message = "Property ID is required")
    private String propertyId;

    @NotBlank(message = "Message content cannot be empty")
    private String content;
}
