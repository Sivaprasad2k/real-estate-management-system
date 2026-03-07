package com.rems.realestate.service;

import com.rems.realestate.dto.ReportRequest;
import com.rems.realestate.model.Property;
import com.rems.realestate.model.PropertyStatus;
import com.rems.realestate.model.Report;
import com.rems.realestate.model.User;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.ReportRepository;
import com.rems.realestate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    public Report createReport(String propertyId, ReportRequest request, String reporterId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getOwnerId().equals(reporterId)) {
            throw new RuntimeException("Owner cannot report their own property.");
        }

        if (reportRepository.existsByPropertyIdAndReportedBy(propertyId, reporterId)) {
            throw new RuntimeException("You have already reported this property.");
        }

        Report report = Report.builder()
                .propertyId(propertyId)
                .reportedBy(reporterId)
                .reason(request.getReason())
                .createdAt(LocalDateTime.now())
                .build();
        reportRepository.save(report);

        property.setReportCount(property.getReportCount() + 1);

        if (property.getReportCount() >= 3) {
            property.setStatus(PropertyStatus.FLAGGED);

            User owner = userRepository.findById(property.getOwnerId())
                    .orElseThrow(() -> new RuntimeException("Owner not found"));

            owner.setReportCount(owner.getReportCount() + 1);
            if (owner.getReportCount() > 5) {
                owner.setBanned(true);
            }
            userRepository.save(owner);
        }

        propertyRepository.save(property);
        return report;
    }

    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }
}
