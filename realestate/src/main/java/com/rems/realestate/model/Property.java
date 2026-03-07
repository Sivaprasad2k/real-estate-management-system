package com.rems.realestate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
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
    private PropertyStatus status = PropertyStatus.PENDING;

    @Builder.Default
    private int reportCount = 0;

    private String transactionName;
    private String transactionContact;
    private Double transactionAmount;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
