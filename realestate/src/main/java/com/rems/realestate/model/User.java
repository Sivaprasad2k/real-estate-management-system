package com.rems.realestate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;

    private String phoneNumber;

    private String address;

    @Builder.Default
    private Set<String> roles = new HashSet<>();

    @Builder.Default
    private List<MaintenanceType> skills = new ArrayList<>();

    @Builder.Default
    private int reportCount = 0;

    @Builder.Default
    private boolean isBanned = false;

    @Builder.Default
    private boolean isVerified = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

}
