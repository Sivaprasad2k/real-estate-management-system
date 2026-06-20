package com.rems.realestate.repository;

import com.rems.realestate.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Boolean existsByEmail(String email);

    Boolean existsByEmailIgnoreCase(String email);

    List<User> findByRolesContainingAndSkillsContaining(String role, com.rems.realestate.model.MaintenanceType skill);
}
