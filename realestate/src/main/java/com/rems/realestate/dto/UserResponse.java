package com.rems.realestate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String name;
    private String email;
    private String phoneNumber;
    private String address;
    private java.util.List<com.rems.realestate.model.MaintenanceType> skills;
    private LocalDateTime createdAt;
}
