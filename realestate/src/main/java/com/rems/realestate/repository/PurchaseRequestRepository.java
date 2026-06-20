package com.rems.realestate.repository;

import com.rems.realestate.model.PurchaseRequest;
import com.rems.realestate.model.PurchaseRequestStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRequestRepository extends MongoRepository<PurchaseRequest, String> {

    List<PurchaseRequest> findByBuyerId(String buyerId);

    List<PurchaseRequest> findByOwnerId(String ownerId);

    List<PurchaseRequest> findByPropertyId(String propertyId);

    List<PurchaseRequest> findByPropertyIdAndStatus(String propertyId, PurchaseRequestStatus status);

    Optional<PurchaseRequest> findFirstByPropertyIdAndBuyerId(String propertyId, String buyerId);
}
