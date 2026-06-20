package com.rems.realestate.repository;

import com.rems.realestate.model.VisitRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VisitRequestRepository extends MongoRepository<VisitRequest, String> {

    List<VisitRequest> findByBuyerId(String buyerId);

    List<VisitRequest> findByOwnerId(String ownerId);

    List<VisitRequest> findByPropertyId(String propertyId);
}
