package com.rems.realestate.service;

import com.rems.realestate.dto.TenantMaintenanceDto;
import com.rems.realestate.model.MaintenanceRequest;
import com.rems.realestate.model.Property;
import com.rems.realestate.repository.MaintenanceRequestRepository;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.UserRepository;
import com.rems.realestate.repository.MessageRepository;
import com.rems.realestate.model.User;
import com.rems.realestate.model.Message;
import com.rems.realestate.model.MaintenanceType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TenantMaintenanceService {

    @Autowired
    private MaintenanceRequestRepository maintenanceRequestRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageRepository messageRepository;

    public MaintenanceRequest createMaintenanceRequest(TenantMaintenanceDto dto) {
        Property property = propertyRepository.findById(dto.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        MaintenanceType type = dto.getType() != null ? dto.getType() : MaintenanceType.GENERAL;

        MaintenanceRequest request = MaintenanceRequest.builder()
                .propertyId(property.getId())
                .ownerId(property.getOwnerId())
                .tenantName(dto.getTenantName())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .type(type)
                .status("OPEN")
                .createdAt(LocalDateTime.now())
                .build();

        // Auto-assign staff based on skills: manually filter to avoid MongoDB Enum
        // query mapping issues
        List<User> qualifiedStaff = userRepository.findAll().stream()
                .filter(u -> u.getRoles() != null && u.getRoles().contains("ROLE_MAINTENANCE"))
                .filter(u -> u.getSkills() != null && u.getSkills().contains(type))
                .collect(java.util.stream.Collectors.toList());

        if (!qualifiedStaff.isEmpty()) {
            User assignedStaff = qualifiedStaff.get(0);
            request.setStaffId(assignedStaff.getId());
            request.setStatus("IN_PROGRESS");

            // Notify the owner
            Message msg = Message.builder()
                    .senderId("system_admin")
                    .receiverId(property.getOwnerId())
                    .propertyId(property.getId())
                    .content(String.format(
                            "System Notice: A new %s maintenance request '%s' was auto-assigned to %s (%s).",
                            type.toString(), request.getTitle(), assignedStaff.getName(),
                            assignedStaff.getPhoneNumber() != null ? assignedStaff.getPhoneNumber() : "No Phone"))
                    .timestamp(LocalDateTime.now())
                    .read(false)
                    .build();
            messageRepository.save(msg);
        }

        return maintenanceRequestRepository.save(request);
    }

    public List<MaintenanceRequest> getOwnerRequests(String ownerId) {
        return maintenanceRequestRepository.findByOwnerId(ownerId);
    }

    public MaintenanceRequest updateStatus(String requestId, String status, String currentUserId) {
        MaintenanceRequest request = maintenanceRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getOwnerId().equals(currentUserId)) {
            throw new RuntimeException("Not authorized to update this request");
        }

        if (!status.equals("OPEN") && !status.equals("IN_PROGRESS") && !status.equals("RESOLVED")) {
            throw new RuntimeException("Invalid status. Allowed: OPEN, IN_PROGRESS, RESOLVED");
        }

        request.setStatus(status);
        return maintenanceRequestRepository.save(request);
    }
}
