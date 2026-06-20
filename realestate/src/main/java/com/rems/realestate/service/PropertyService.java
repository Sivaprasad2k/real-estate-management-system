package com.rems.realestate.service;

import com.rems.realestate.dto.PropertyRequest;
import com.rems.realestate.model.Property;
import com.rems.realestate.model.PropertyPurpose;
import com.rems.realestate.model.PropertyStatus;
import com.rems.realestate.model.User;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.UserRepository;
import com.rems.realestate.repository.RentalAgreementRepository;
import com.rems.realestate.model.RentalAgreement;
import com.rems.realestate.model.RentalAgreementStatus;
import com.rems.realestate.dto.RentalMetadataRequest;
import com.rems.realestate.dto.PropertySearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PropertyService {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RentalAgreementRepository rentalAgreementRepository;

    @Autowired
    private com.rems.realestate.repository.SaleAgreementRepository saleAgreementRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private NotificationService notificationService;

    public Property createProperty(PropertyRequest request, String ownerId) {
        User user = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Property property = Property.builder()
                .ownerId(ownerId)
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .purpose(request.getPurpose())
                .price(request.getPrice())
                .city(request.getCity())
                .state(request.getState())
                .amenities(request.getAmenities())
                .images(request.getImages())
                .bedrooms(request.getBedrooms() != null ? request.getBedrooms() : 0)
                .bathrooms(request.getBathrooms() != null ? request.getBathrooms() : 0)
                .squareFootage(request.getSquareFootage() != null ? request.getSquareFootage() : 0.0)
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .location(request.getLatitude() != null && request.getLongitude() != null
                        ? com.rems.realestate.model.Location.builder()
                                .type("Point")
                                .coordinates(java.util.Arrays.asList(request.getLongitude(), request.getLatitude()))
                                .build()
                        : null)
                .createdAt(LocalDateTime.now())
                .reportCount(0)
                .build();

        applyModerationRules(property, user);
        return propertyRepository.save(property);
    }

    public Property updateProperty(String propertyId, PropertyRequest request, String ownerId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized to update this property");
        }

        boolean priceChanged = !property.getPrice().equals(request.getPrice());

        property.setTitle(request.getTitle());
        property.setDescription(request.getDescription());
        property.setType(request.getType());
        property.setPurpose(request.getPurpose());
        property.setPrice(request.getPrice());
        property.setCity(request.getCity());
        property.setState(request.getState());
        property.setAmenities(request.getAmenities());
        property.setImages(request.getImages());
        property.setBedrooms(request.getBedrooms() != null ? request.getBedrooms() : 0);
        property.setBathrooms(request.getBathrooms() != null ? request.getBathrooms() : 0);
        property.setSquareFootage(request.getSquareFootage() != null ? request.getSquareFootage() : 0.0);
        property.setLatitude(request.getLatitude());
        property.setLongitude(request.getLongitude());

        if (request.getLatitude() != null && request.getLongitude() != null) {
            property.setLocation(com.rems.realestate.model.Location.builder()
                    .type("Point")
                    .coordinates(java.util.Arrays.asList(request.getLongitude(), request.getLatitude()))
                    .build());
        } else {
            property.setLocation(null);
        }

        if (priceChanged) {
            User user = userRepository.findById(ownerId).orElseThrow(() -> new RuntimeException("User not found"));
            applyModerationRules(property, user);
        }

        return propertyRepository.save(property);
    }

    public void deleteProperty(String propertyId, String userId, boolean isAdmin) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwnerId().equals(userId) && !isAdmin) {
            throw new RuntimeException("Not authorized to delete this property");
        }

        propertyRepository.delete(property);
    }

    public List<Property> searchProperties(String city, PropertyPurpose purpose, Double minPrice, Double maxPrice) {
        return propertyRepository.searchProperties(city, purpose, minPrice, maxPrice);
    }

    public List<Property> advancedSearch(PropertySearchRequest request) {
        Query query = new Query();
        query.addCriteria(Criteria.where("status").in(com.rems.realestate.model.PropertyStatus.APPROVED, com.rems.realestate.model.PropertyStatus.SOLD, com.rems.realestate.model.PropertyStatus.RENTED));

        if (request.getKeyword() != null && !request.getKeyword().isEmpty()) {
            Criteria keywordCriteria = new Criteria().orOperator(
                    Criteria.where("title").regex(request.getKeyword(), "i"),
                    Criteria.where("description").regex(request.getKeyword(), "i"),
                    Criteria.where("city").regex(request.getKeyword(), "i"),
                    Criteria.where("state").regex(request.getKeyword(), "i"));
            query.addCriteria(keywordCriteria);
        }

        if (request.getPurpose() != null) {
            query.addCriteria(Criteria.where("purpose").is(request.getPurpose()));
        }

        if (request.getType() != null) {
            query.addCriteria(Criteria.where("type").is(request.getType()));
        }

        if (request.getMinPrice() != null || request.getMaxPrice() != null) {
            Criteria priceCriteria = Criteria.where("price");
            if (request.getMinPrice() != null)
                priceCriteria.gte(request.getMinPrice());
            if (request.getMaxPrice() != null)
                priceCriteria.lte(request.getMaxPrice());
            query.addCriteria(priceCriteria);
        }

        if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {
            query.addCriteria(Criteria.where("amenities").all(request.getAmenities()));
        }

        // Default sort by promoted (desc), then createdAt (desc) for "recommended"
        if ("price_asc".equals(request.getSortBy())) {
            query.with(Sort.by(Sort.Direction.ASC, "price"));
        } else if ("price_desc".equals(request.getSortBy())) {
            query.with(Sort.by(Sort.Direction.DESC, "price"));
        } else if ("recent".equals(request.getSortBy())) {
            query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        } else {
            // "recommended" or default
            query.with(Sort.by(Sort.Direction.DESC, "isPromoted").and(Sort.by(Sort.Direction.DESC, "createdAt")));
        }

        return mongoTemplate.find(query, Property.class);
    }

    public List<Property> getAllProperties() {
        return propertyRepository.findAll();
    }

    public Property getPropertyById(String id) {
        return propertyRepository.findById(id).orElseThrow(() -> new RuntimeException("Property not found"));
    }

    public void markSold(String propertyId, String ownerId, com.rems.realestate.dto.MarkSoldRequest request) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized");
        }

        if (property.getStatus() != PropertyStatus.APPROVED && property.getStatus() != PropertyStatus.AVAILABLE) {
            throw new RuntimeException("Only APPROVED/AVAILABLE properties can be marked as sold directly.");
        }

        property.setStatus(PropertyStatus.SOLD);
        property.setTransactionName(request.getBuyerName());
        property.setTransactionContact(request.getBuyerContact());
        property.setTransactionAmount(request.getSoldAmount());
        propertyRepository.save(property);
    }

    public void initiateSale(String propertyId, String userId, String buyerDetails, org.springframework.web.multipart.MultipartFile file) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getStatus() != PropertyStatus.SALE_IN_PROGRESS) {
            throw new RuntimeException("Document upload is only allowed when property status is SALE_IN_PROGRESS.");
        }

        if (!property.getOwnerId().equals(userId)) {
            throw new RuntimeException("Only the property owner can upload the sale agreement.");
        }

        property.setStatus(PropertyStatus.PENDING_BUYER_CONFIRMATION);
        property.setSaleInitiatedAt(LocalDateTime.now());

        String fileUrl = "";
        if (file != null && !file.isEmpty()) {
            try {
                com.rems.realestate.model.SaleAgreement agreement = com.rems.realestate.model.SaleAgreement.builder()
                        .propertyId(property.getId())
                        .sellerId(property.getOwnerId())
                        .buyerId(property.getSaleInitiatedBy())
                        .fileName(file.getOriginalFilename())
                        .fileType(file.getContentType())
                        .documentData(file.getBytes())
                        .uploadedBy(userId)
                        .uploadDate(LocalDateTime.now())
                        .status(com.rems.realestate.model.SaleAgreementStatus.APPROVED)
                        .build();

                com.rems.realestate.model.SaleAgreement savedAgreement = saleAgreementRepository.save(agreement);
                property.setSaleAgreementId(savedAgreement.getAgreementId());
                fileUrl = "/api/sale-agreements/" + savedAgreement.getAgreementId() + "/document";
            } catch (java.io.IOException e) {
                throw new RuntimeException("Failed to save sale agreement document data", e);
            }
        }

        property.setSaleDocumentUrl(fileUrl);
        propertyRepository.save(property);

        notificationService.createNotification(
                property.getSaleInitiatedBy(),
                "System Notice: Owner has uploaded the Sale Agreement for '" + property.getTitle() + "'. Please review and confirm to finalize.",
                "SALE");
    }

    public void approveSale(String propertyId, String userId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getStatus() != PropertyStatus.PENDING_BUYER_CONFIRMATION) {
            throw new RuntimeException("No pending sale for buyer confirmation");
        }

        if (!userId.equals(property.getSaleInitiatedBy())) {
            throw new RuntimeException("Only the buyer can confirm this sale");
        }

        property.setStatus(PropertyStatus.SOLD);
        property.setSaleApprovedBy(userId);
        property.setSaleApprovedAt(LocalDateTime.now());
        property.setSoldDate(LocalDateTime.now());
        property.setTransactionName(property.getSaleBuyerDetails());
        property.setTransactionAmount(property.getPrice());

        if (property.getSaleAgreementId() != null) {
            saleAgreementRepository.findById(property.getSaleAgreementId()).ifPresent(agreement -> {
                agreement.setStatus(com.rems.realestate.model.SaleAgreementStatus.APPROVED);
                saleAgreementRepository.save(agreement);
            });
        }

        propertyRepository.save(property);

        notificationService.createNotification(
                property.getOwnerId(),
                "System Notice: Sale for property '" + property.getTitle() + "' has been confirmed by the buyer and is now SOLD.",
                "SALE");
        notificationService.createNotification(
                property.getSaleInitiatedBy(),
                "System Notice: Your purchase for property '" + property.getTitle() + "' has been confirmed and is now SOLD.",
                "SALE");
    }

    public void rejectSale(String propertyId, String userId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (property.getStatus() != PropertyStatus.SALE_IN_PROGRESS && property.getStatus() != PropertyStatus.PENDING_BUYER_CONFIRMATION) {
            throw new RuntimeException("No active sale transaction to reject/cancel");
        }

        if (!property.getOwnerId().equals(userId) && !userId.equals(property.getSaleInitiatedBy())) {
            throw new RuntimeException("Not authorized to reject/cancel this sale");
        }

        property.setStatus(PropertyStatus.APPROVED);

        if (property.getSaleAgreementId() != null) {
            saleAgreementRepository.findById(property.getSaleAgreementId()).ifPresent(agreement -> {
                agreement.setStatus(com.rems.realestate.model.SaleAgreementStatus.REJECTED);
                saleAgreementRepository.save(agreement);
            });
        }

        String oldBuyerId = property.getSaleInitiatedBy();
        property.setSaleInitiatedBy(null);
        property.setSaleInitiatedAt(null);
        property.setSaleDocumentUrl(null);
        property.setSaleBuyerDetails(null);
        property.setSaleAgreementId(null);
        propertyRepository.save(property);

        notificationService.createNotification(
                property.getOwnerId(),
                "System Notice: Sale transaction for property '" + property.getTitle() + "' has been cancelled.",
                "SALE");
        if (oldBuyerId != null) {
            notificationService.createNotification(
                    oldBuyerId,
                    "System Notice: Purchase transaction for property '" + property.getTitle() + "' was cancelled.",
                    "SALE");
        }
    }


    public void markRented(String propertyId, String ownerId, com.rems.realestate.dto.MarkRentedRequest request) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized");
        }

        if (property.getStatus() != PropertyStatus.APPROVED) {
            throw new RuntimeException("Only APPROVED properties can be marked as rented.");
        }

        property.setStatus(PropertyStatus.RENTED);
        property.setTransactionName(request.getTenantName());
        property.setTransactionContact(request.getTenantContact());
        property.setTransactionAmount(request.getRentAmount());
        propertyRepository.save(property);
    }

    public Property updateRentalMetadata(String propertyId, String ownerId, RentalMetadataRequest request) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("Not authorized to update rental metadata.");
        }

        property.setTenantId(request.getTenantId());
        property.setRentAmount(request.getRentAmount());
        property.setDepositAmount(request.getDepositAmount());
        property.setRentStartDate(request.getRentStartDate());
        property.setRentEndDate(request.getRentEndDate());
        property.setNotes(request.getNotes());
        property.setStatus(PropertyStatus.RENTED);

        return propertyRepository.save(property);
    }

    public List<Property> getNearbyProperties(double longitude, double latitude, double distanceKm) {
        Point point = new Point(longitude, latitude);
        Distance distance = new Distance(distanceKm, Metrics.KILOMETERS);
        return propertyRepository.findByLocationNear(point, distance).stream()
                .filter(p -> p.getStatus() == PropertyStatus.APPROVED || p.getStatus() == PropertyStatus.SOLD || p.getStatus() == PropertyStatus.RENTED)
                .toList();
    }

    public List<Property> getFlaggedProperties() {
        return propertyRepository.findAll().stream()
                .filter(p -> p.getStatus() == PropertyStatus.FLAGGED)
                .toList();
    }

    public void approveProperty(String id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        property.setStatus(PropertyStatus.APPROVED);
        property.setReportCount(0);
        propertyRepository.save(property);
    }

    public void rejectProperty(String id) {
        Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        property.setStatus(PropertyStatus.REJECTED);
        propertyRepository.save(property);
    }

    private void applyModerationRules(Property property, User user) {
        if (user.getReportCount() > 2 || property.getPrice() < 1000) {
            property.setStatus(PropertyStatus.FLAGGED);
        } else {
            property.setStatus(PropertyStatus.APPROVED);
        }
    }
}
