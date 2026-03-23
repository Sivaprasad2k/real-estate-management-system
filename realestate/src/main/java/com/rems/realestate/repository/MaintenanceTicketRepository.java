package com.rems.realestate.repository;

import com.rems.realestate.model.MaintenanceTicket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceTicketRepository extends MongoRepository<MaintenanceTicket, String> {
    List<MaintenanceTicket> findByOwnerId(String ownerId);

    List<MaintenanceTicket> findByStaffId(String staffId);

    List<MaintenanceTicket> findByTenantId(String tenantId);

    long countByStatus(com.rems.realestate.model.MaintenanceTicketStatus status);

    List<MaintenanceTicket> findByStatusAndTypeIn(com.rems.realestate.model.MaintenanceTicketStatus status,
            List<com.rems.realestate.model.MaintenanceType> types);
}
