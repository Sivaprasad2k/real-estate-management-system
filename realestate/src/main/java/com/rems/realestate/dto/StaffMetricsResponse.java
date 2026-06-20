package com.rems.realestate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffMetricsResponse {
    private long totalCompleted;
    private double averageResolutionTimeHours;
    private long activeJobs;
    private long reopenedTicketsCount;
    private double completionRate;
}
