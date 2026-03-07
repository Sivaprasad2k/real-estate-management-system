package com.rems.realestate.repository;

import com.rems.realestate.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
        List<Message> findBySenderIdAndReceiverIdAndPropertyIdOrderByTimestampAsc(String senderId, String receiverId,
                        String propertyId);

        List<Message> findByReceiverIdAndSenderIdAndPropertyIdOrderByTimestampAsc(String receiverId, String senderId,
                        String propertyId);

        List<Message> findBySenderIdOrReceiverIdOrderByTimestampDesc(String senderId, String receiverId);
}
