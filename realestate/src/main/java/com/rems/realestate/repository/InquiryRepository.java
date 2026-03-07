package com.rems.realestate.repository;

import com.rems.realestate.model.Inquiry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryRepository extends MongoRepository<Inquiry, String> {

    List<Inquiry> findByOwnerId(String ownerId);

    List<Inquiry> findBySenderId(String senderId);

}
