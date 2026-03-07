package com.rems.realestate.controller;

import com.rems.realestate.dto.ReportRequest;
import com.rems.realestate.model.Report;
import com.rems.realestate.security.UserDetailsImpl;
import com.rems.realestate.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{propertyId}")
    public ResponseEntity<?> createReport(@PathVariable String propertyId,
            @Valid @RequestBody ReportRequest request,
            Authentication authentication) {
        try {
            String reporterId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            Report report = reportService.createReport(propertyId, request, reporterId);
            return new ResponseEntity<>(report, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
