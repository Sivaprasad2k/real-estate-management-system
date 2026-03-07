package com.rems.realestate.repository;

import com.rems.realestate.model.MaintenanceRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRequestRepository extends MongoRepository<MaintenanceRequest, String> {
    List<MaintenanceRequest> findByOwnerId(String ownerId);
}
