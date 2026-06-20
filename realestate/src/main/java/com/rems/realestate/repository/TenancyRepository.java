package com.rems.realestate.repository;

import com.rems.realestate.model.Tenancy;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenancyRepository extends MongoRepository<Tenancy, String> {
    List<Tenancy> findByPropertyId(String propertyId);

    Optional<Tenancy> findFirstByPropertyIdAndTenantPhone(String propertyId, String tenantPhone);

    Optional<Tenancy> findFirstByPropertyIdAndTenantCode(String propertyId, String tenantCode);

    List<Tenancy> findByOwnerId(String ownerId);
}
