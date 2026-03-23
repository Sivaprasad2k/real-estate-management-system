package com.rems.realestate.controller;

import com.rems.realestate.dto.SaleAgreementUploadRequest;
import com.rems.realestate.model.SaleAgreement;
import com.rems.realestate.model.User;
import com.rems.realestate.service.SaleAgreementService;
import com.rems.realestate.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sale-agreements")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SaleAgreementController {

        @Autowired
        private SaleAgreementService saleAgreementService;

        @Autowired
        private com.rems.realestate.repository.UserRepository userRepository;

        @PostMapping("/upload")
        public ResponseEntity<SaleAgreement> uploadAgreement(
                        @RequestParam("propertyId") String propertyId,
                        @RequestParam(value = "buyerId", required = false) String buyerId,
                        @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
                        org.springframework.security.core.Authentication authentication) {

                try {
                        com.rems.realestate.security.UserDetailsImpl userDetails = (com.rems.realestate.security.UserDetailsImpl) authentication
                                        .getPrincipal();
                        User currentUser = userRepository.findById(userDetails.getId()).orElseThrow();
                        SaleAgreement agreement = saleAgreementService.uploadAgreement(propertyId, buyerId, file,
                                        currentUser);
                        return ResponseEntity.ok(agreement);
                } catch (Exception e) {
                        return ResponseEntity.badRequest().build();
                }
        }

        @GetMapping("/{agreementId}/document")
        public ResponseEntity<byte[]> downloadDocument(@PathVariable String agreementId) {
                SaleAgreement agreement = saleAgreementService.getAgreementById(agreementId);
                return ResponseEntity.ok()
                                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=\"" + agreement.getFileName() + "\"")
                                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, agreement.getFileType())
                                .body(agreement.getDocumentData());
        }

        @PostMapping("/{agreementId}/review")
        public ResponseEntity<SaleAgreement> reviewAgreement(
                        @PathVariable String agreementId,
                        @RequestBody Map<String, Boolean> request,
                        org.springframework.security.core.Authentication authentication) {

                // Expect {"approve": true} or {"approve": false}
                boolean approve = request.getOrDefault("approve", false);

                com.rems.realestate.security.UserDetailsImpl userDetails = (com.rems.realestate.security.UserDetailsImpl) authentication
                                .getPrincipal();
                User currentUser = userRepository.findById(userDetails.getId()).orElseThrow();
                SaleAgreement agreement = saleAgreementService.reviewAgreement(agreementId, approve,
                                currentUser.getId());
                return ResponseEntity.ok(agreement);
        }

        @GetMapping("/seller")
        public ResponseEntity<List<SaleAgreement>> getSellerAgreements(
                        org.springframework.security.core.Authentication authentication) {
                com.rems.realestate.security.UserDetailsImpl userDetails = (com.rems.realestate.security.UserDetailsImpl) authentication
                                .getPrincipal();
                User currentUser = userRepository.findById(userDetails.getId()).orElseThrow();
                return ResponseEntity.ok(saleAgreementService.getAgreementsForSeller(currentUser.getId()));
        }

        @GetMapping("/buyer")
        public ResponseEntity<List<SaleAgreement>> getBuyerAgreements(
                        org.springframework.security.core.Authentication authentication) {
                com.rems.realestate.security.UserDetailsImpl userDetails = (com.rems.realestate.security.UserDetailsImpl) authentication
                                .getPrincipal();
                User currentUser = userRepository.findById(userDetails.getId()).orElseThrow();
                return ResponseEntity.ok(saleAgreementService.getAgreementsForBuyer(currentUser.getId()));
        }
}
