package com.rems.realestate.repository;

import com.rems.realestate.model.Report;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends MongoRepository<Report, String> {
    boolean existsByPropertyIdAndReportedBy(String propertyId, String reportedBy);

    List<Report> findByPropertyId(String propertyId);
}
