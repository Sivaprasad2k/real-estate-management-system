package com.rems.realestate.controller;

import com.rems.realestate.dto.PropertyRequest;
import com.rems.realestate.dto.PropertySearchRequest;
import com.rems.realestate.dto.MarkRentedRequest;
import com.rems.realestate.dto.RentalMetadataRequest;
import com.rems.realestate.model.Property;
import com.rems.realestate.model.PropertyPurpose;
import com.rems.realestate.security.UserDetailsImpl;
import com.rems.realestate.service.PropertyService;
import com.rems.realestate.service.RecommendationEngine;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    @Autowired
    private PropertyService propertyService;

    @Autowired
    private RecommendationEngine recommendationEngine;

    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<?> createProperty(@Valid @RequestBody PropertyRequest request,
            Authentication authentication) {
        try {
            String ownerId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            Property property = propertyService.createProperty(request, ownerId);
            return new ResponseEntity<>(property, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Property>> getAllProperties() {
        return ResponseEntity.ok(propertyService.getAllProperties());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Property>> searchProperties(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) PropertyPurpose purpose,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice) {
        return ResponseEntity.ok(propertyService.searchProperties(city, purpose, minPrice, maxPrice));
    }

    @PostMapping("/advanced-search")
    public ResponseEntity<List<Property>> advancedSearch(@RequestBody PropertySearchRequest request) {
        return ResponseEntity.ok(propertyService.advancedSearch(request));
    }

    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyProperties(
            @RequestParam double longitude,
            @RequestParam double latitude,
            @RequestParam(defaultValue = "10") double distance) {
        try {
            List<Property> properties = propertyService.getNearbyProperties(longitude, latitude, distance);
            return ResponseEntity.ok(properties);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/recommendations")
    public ResponseEntity<List<Property>> getRecommendations(Authentication authentication,
            @RequestParam(defaultValue = "10") int limit) {
        String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        return ResponseEntity.ok(recommendationEngine.getRecommendationsForUser(userId, limit));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Property> getPropertyById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(propertyService.getPropertyById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProperty(@PathVariable String id, @Valid @RequestBody PropertyRequest request,
            Authentication authentication) {
        try {
            String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            Property property = propertyService.updateProperty(id, request, userId);
            return ResponseEntity.ok(property);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProperty(@PathVariable String id, Authentication authentication) {
        try {
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            boolean isAdmin = userDetails.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            propertyService.deleteProperty(id, userDetails.getId(), isAdmin);
            return ResponseEntity.ok("Property deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/{id}/sale/initiate")
    public ResponseEntity<?> initiateSale(@PathVariable String id,
            @RequestParam(value = "buyerDetails", required = false) String buyerDetails,
            @RequestParam(value = "file", required = false) org.springframework.web.multipart.MultipartFile file,
            Authentication authentication) {
        try {
            String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            propertyService.initiateSale(id, userId, buyerDetails, file);
            return ResponseEntity.ok("Sale initiated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/sale/approve")
    public ResponseEntity<?> approveSale(@PathVariable String id, Authentication authentication) {
        try {
            String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            propertyService.approveSale(id, userId);
            return ResponseEntity.ok("Sale approved successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/sale/reject")
    public ResponseEntity<?> rejectSale(@PathVariable String id, Authentication authentication) {
        try {
            String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            propertyService.rejectSale(id, userId);
            return ResponseEntity.ok("Sale rejected successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/mark-sold")
    public ResponseEntity<?> markSold(@PathVariable String id,
            @Valid @RequestBody com.rems.realestate.dto.MarkSoldRequest request, Authentication authentication) {
        try {
            String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            propertyService.markSold(id, userId, request);
            return ResponseEntity.ok("Property marked as sold");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/mark-rented")
    public ResponseEntity<?> markRented(@PathVariable String id, @Valid @RequestBody MarkRentedRequest request,
            Authentication authentication) {
        try {
            String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            propertyService.markRented(id, userId, request);
            return ResponseEntity.ok("Property marked as rented");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER')")
    @PutMapping("/{id}/rental-metadata")
    public ResponseEntity<?> updateRentalMetadata(@PathVariable String id,
            @Valid @RequestBody RentalMetadataRequest request,
            Authentication authentication) {
        try {
            String userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
            Property property = propertyService.updateRentalMetadata(id, userId, request);
            return ResponseEntity.ok(property);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
