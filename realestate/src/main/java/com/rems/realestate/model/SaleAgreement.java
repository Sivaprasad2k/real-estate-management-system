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
@Document(collection = "sale_agreements")
public class SaleAgreement {

    @Id
    private String agreementId;

    @Indexed
    private String propertyId;

    @Indexed
    private String buyerId;

    @Indexed
    private String sellerId;

    private String uploadedBy;

    private String fileName;

    private String fileType;

    private byte[] documentData;

    @Builder.Default
    private SaleAgreementStatus status = SaleAgreementStatus.PENDING_SELLER_APPROVAL;

    @Builder.Default
    private LocalDateTime uploadDate = LocalDateTime.now();

}
