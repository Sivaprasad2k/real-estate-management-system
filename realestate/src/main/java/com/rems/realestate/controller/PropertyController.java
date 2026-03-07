package com.rems.realestate.controller;

import com.rems.realestate.dto.PropertyRequest;
import com.rems.realestate.dto.MarkRentedRequest;
import com.rems.realestate.model.Property;
import com.rems.realestate.model.PropertyPurpose;
import com.rems.realestate.security.UserDetailsImpl;
import com.rems.realestate.service.PropertyService;
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
}
