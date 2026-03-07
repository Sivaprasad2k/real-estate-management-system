package com.rems.realestate.dto;

import com.rems.realestate.model.Property;
import lombok.Data;

@Data
public class PropertyResponse {
    private Property property;
    private String message;

    public PropertyResponse(Property property, String message) {
        this.property = property;
        this.message = message;
    }
}
