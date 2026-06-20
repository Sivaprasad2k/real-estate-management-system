package com.rems.realestate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceCompleteRequest {
    private String resolutionSummary;
    private List<String> beforeRepairPhotos;
    private List<String> afterRepairPhotos;
}
