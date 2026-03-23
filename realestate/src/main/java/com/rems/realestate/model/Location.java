package com.rems.realestate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {
    @Builder.Default
    private String type = "Point";
    private List<Double> coordinates; // [longitude, latitude]
}
