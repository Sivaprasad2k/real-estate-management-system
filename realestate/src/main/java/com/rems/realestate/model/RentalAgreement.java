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
@Document(collection = "rental_agreements")
public class RentalAgreement {

    @Id
    private String id;

    @Indexed(unique = true)
    private String agreementNumber;

    @Indexed
    private String propertyId;

    @Indexed
    private String ownerId;

    @Indexed
    private String tenantId;

    @Builder.Default
    private LocalDateTime startDate = LocalDateTime.now();

    private LocalDateTime endDate;

    private Double monthlyRent;

    private Double securityDeposit;

    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Builder.Default
    private boolean termsAccepted = false;

    @Builder.Default
    private RentalAgreementStatus status = RentalAgreementStatus.ACTIVE;

    private String fileName;

    private String fileType;

    private byte[] documentData;

    private String documentUrl;

    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
