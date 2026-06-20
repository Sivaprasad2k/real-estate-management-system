package com.rems.realestate.repository;

import com.rems.realestate.model.RentalRequest;
import com.rems.realestate.model.RentalRequestStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RentalRequestRepository extends MongoRepository<RentalRequest, String> {

    List<RentalRequest> findByTenantId(String tenantId);

    List<RentalRequest> findByOwnerId(String ownerId);

    List<RentalRequest> findByPropertyId(String propertyId);

    List<RentalRequest> findByPropertyIdAndStatus(String propertyId, RentalRequestStatus status);

    Optional<RentalRequest> findFirstByPropertyIdAndTenantId(String propertyId, String tenantId);
}
