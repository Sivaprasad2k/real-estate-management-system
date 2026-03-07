package com.rems.realestate.dto;

import com.rems.realestate.model.PropertyPurpose;
import com.rems.realestate.model.PropertyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class PropertyRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private PropertyType type;

    @NotNull
    private PropertyPurpose purpose;

    @NotNull
    private Double price;

    @NotBlank
    private String city;

    private String state;

    private List<String> amenities;

    private List<String> images;
}
