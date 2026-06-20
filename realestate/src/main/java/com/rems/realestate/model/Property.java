package com.rems.realestate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "properties")
@CompoundIndexes({
        @CompoundIndex(name = "city_purpose_price_idx", def = "{'city': 1, 'purpose': 1, 'price': 1}")
})
public class Property {

    @Id
    private String id;

    @Indexed
    private String ownerId;

    private String title;

    private String description;

    private PropertyType type;

    @Indexed
    private PropertyPurpose purpose;

    @Indexed
    private Double price;

    @Indexed
    private String city;

    private String state;

    private List<String> amenities;

    private List<String> images;

    @Builder.Default
    private PropertyStatus status = PropertyStatus.AVAILABLE;

    @Builder.Default
    private int reportCount = 0;

    @Builder.Default
    private boolean isPromoted = false;

    // Sale Agreement fields
    private String saleAgreementId;
    private LocalDateTime soldDate;
    private String saleInitiatedBy;
    private String saleApprovedBy;
    private LocalDateTime saleInitiatedAt;
    private LocalDateTime saleApprovedAt;
    private String saleBuyerDetails;
    private String saleDocumentUrl;

    // Rental Metadata fields
    private String tenantId;
    private Double rentAmount;
    private Double depositAmount;
    private LocalDateTime rentStartDate;
    private LocalDateTime rentEndDate;
    private String notes;
    private String rentalRules;

    // Location fields
    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private Location location;
    private Double latitude;
    private Double longitude;

    private Integer bedrooms;
    private Integer bathrooms;
    private Double squareFootage;

    // Newly added spec fields
    private Integer propertyAge;
    private Integer parkingCount;
    private String furnishingStatus;
    private String ownershipType;
    private LocalDateTime availabilityDate;

    private String transactionName;
    private String transactionContact;
    private Double transactionAmount;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
