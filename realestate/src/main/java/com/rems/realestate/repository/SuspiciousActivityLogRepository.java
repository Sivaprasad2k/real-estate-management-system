package com.rems.realestate.repository;

import com.rems.realestate.model.SuspiciousActivityLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuspiciousActivityLogRepository extends MongoRepository<SuspiciousActivityLog, String> {
    List<SuspiciousActivityLog> findByIsResolvedFalse();
}
