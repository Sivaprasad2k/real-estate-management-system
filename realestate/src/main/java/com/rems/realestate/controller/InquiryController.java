package com.rems.realestate.controller;

import com.rems.realestate.dto.InquiryRequest;
import com.rems.realestate.model.Inquiry;
import com.rems.realestate.security.UserDetailsImpl;
import com.rems.realestate.service.InquiryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {

    @Autowired
    private InquiryService inquiryService;

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{propertyId}")
    public ResponseEntity<?> createInquiry(@PathVariable String propertyId, @Valid @RequestBody InquiryRequest request,
            Authentication authentication) {
        try {
            String loggedInUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            Inquiry inquiry = inquiryService.createInquiry(propertyId, request.getMessage(), loggedInUserId);
            return new ResponseEntity<>(inquiry, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/owner")
    public ResponseEntity<List<Inquiry>> getOwnerInquiries(Authentication authentication) {
        String loggedInUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(inquiryService.getOwnerInquiries(loggedInUserId));
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/sent")
    public ResponseEntity<List<Inquiry>> getUserSentInquiries(Authentication authentication) {
        String loggedInUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(inquiryService.getUserSentInquiries(loggedInUserId));
    }
}
