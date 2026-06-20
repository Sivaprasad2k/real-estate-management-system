package com.rems.realestate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SystemStatsResponse {
    private long totalUsers;
    private long totalProperties;
    private long activeReports;
    private long activeTickets;
    private long activeRentals;
    private long activeSales;
}

