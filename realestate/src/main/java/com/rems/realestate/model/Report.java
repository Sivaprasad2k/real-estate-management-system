package com.rems.realestate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "reports")
public class Report {

    @Id
    private String id;

    @Indexed
    private String propertyId;

    @Indexed
    private String reportedBy;

    private String reason;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
