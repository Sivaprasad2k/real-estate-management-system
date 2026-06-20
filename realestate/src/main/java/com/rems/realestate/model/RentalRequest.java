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
@Document(collection = "rental_requests")
public class RentalRequest {

    @Id
    private String id;

    @Indexed
    private String propertyId;

    @Indexed
    private String tenantId;

    @Indexed
    private String ownerId;

    @Builder.Default
    private RentalRequestStatus status = RentalRequestStatus.PENDING;

    @Builder.Default
    private LocalDateTime requestDate = LocalDateTime.now();
}
