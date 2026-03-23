package com.rems.realestate.repository;

import com.rems.realestate.model.Property;
import com.rems.realestate.model.PropertyPurpose;
import com.rems.realestate.model.PropertyStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Point;

import java.util.List;

@Repository
public interface PropertyRepository extends MongoRepository<Property, String> {

        @Query("{ 'status': 'APPROVED', " +
                        "?#{[0] == null ? '{ $exists: true }' : [0]} : 'city', " +
                        "?#{[1] == null ? '{ $exists: true }' : [1]} : 'purpose', " +
                        "'price': { $gte: ?#{[2] == null ? 0 : [2]}, $lte: ?#{[3] == null ? 9999999999 : [3]} } }")
        List<Property> searchProperties(String city, PropertyPurpose purpose, Double minPrice, Double maxPrice);

        // Fallback if SpEL is too complex for Mongo in this version
        List<Property> findByStatusAndCityAndPurposeAndPriceBetween(PropertyStatus status, String city,
                        PropertyPurpose purpose,
                        Double minPrice, Double maxPrice);

        List<Property> findByStatus(PropertyStatus status);

        List<Property> findByLocationNear(Point location, Distance distance);
}
