package com.rems.realestate.service;

import com.rems.realestate.dto.UserResponse;
import com.rems.realestate.dto.UserUpdateRequest;
import com.rems.realestate.dto.StaffRegisterRequest;
import com.rems.realestate.model.User;
import com.rems.realestate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public void registerMaintenanceStaff(StaffRegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        if (request.getSkills() == null || request.getSkills().isEmpty()) {
            throw new RuntimeException("At least one technical skill is required to register maintenance staff.");
        }

        Set<String> roles = new HashSet<>();
        roles.add("ROLE_USER");
        roles.add("ROLE_MAINTENANCE");

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(roles)
                .skills(request.getSkills() != null ? request.getSkills() : new java.util.ArrayList<>())
                .reportCount(0)
                .isBanned(false)
                .isVerified(true)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);
    }

    public UserResponse getUserProfile(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .skills(user.getSkills())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .skills(user.getSkills())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UserResponse updateUserProfile(String email, UserUpdateRequest request) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }

        user = userRepository.save(user);

        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .skills(user.getSkills())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void banUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBanned(true);
        userRepository.save(user);
    }

    public void unbanUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBanned(false);
        userRepository.save(user);
    }
}
