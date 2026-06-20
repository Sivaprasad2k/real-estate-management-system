package com.rems.realestate.service;

import com.rems.realestate.model.Property;
import com.rems.realestate.model.PropertyStatus;
import com.rems.realestate.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RecommendationEngine {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * Recommends properties to a user based on promoted status, price range, and
     * recent availability.
     * In a full implementation, this could use collaborative filtering or
     * content-based learning based on user view history.
     */
    public List<Property> getRecommendationsForUser(String userId, int limit) {
        // Fallback simple engine: return promoted properties that are available, then
        // most recent ones.
        Query query = new Query();
        query.addCriteria(Criteria.where("status").in(PropertyStatus.APPROVED, PropertyStatus.AVAILABLE));
        if (userId != null && !userId.isEmpty() && !"anonymousUser".equals(userId)) {
            query.addCriteria(Criteria.where("ownerId").ne(userId));
        }
        query.with(Sort.by(Sort.Direction.DESC, "isPromoted").and(Sort.by(Sort.Direction.DESC, "createdAt")));
        query.limit(limit);

        return mongoTemplate.find(query, Property.class);
    }
}
