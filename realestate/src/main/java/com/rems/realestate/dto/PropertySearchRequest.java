package com.rems.realestate.dto;

import com.rems.realestate.model.PropertyPurpose;
import com.rems.realestate.model.PropertyType;
import lombok.Data;

import java.util.List;

@Data
public class PropertySearchRequest {
    private String keyword;
    private PropertyPurpose purpose;
    private PropertyType type;
    private Double minPrice;
    private Double maxPrice;
    private List<String> amenities;
    private String sortBy; // "recent", "price_asc", "price_desc", "recommended"
}
