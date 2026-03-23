package com.rems.realestate.repository;

import com.rems.realestate.model.SaleAgreement;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaleAgreementRepository extends MongoRepository<SaleAgreement, String> {
    List<SaleAgreement> findByPropertyId(String propertyId);

    List<SaleAgreement> findBySellerId(String sellerId);

    List<SaleAgreement> findByBuyerId(String buyerId);

    boolean existsByPropertyIdAndStatusNot(String propertyId, com.rems.realestate.model.SaleAgreementStatus status);
}
