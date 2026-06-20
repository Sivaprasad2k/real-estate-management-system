package com.rems.realestate.repository;

import com.rems.realestate.model.RentalAgreement;
import com.rems.realestate.model.RentalAgreementStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RentalAgreementRepository extends MongoRepository<RentalAgreement, String> {
    Optional<RentalAgreement> findByPropertyIdAndStatus(String propertyId, RentalAgreementStatus status);

    List<RentalAgreement> findByTenantId(String tenantId);

    List<RentalAgreement> findByOwnerId(String ownerId);

    List<RentalAgreement> findByPropertyId(String propertyId);
}
