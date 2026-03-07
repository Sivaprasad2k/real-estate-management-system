package com.rems.realestate.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InboxResponse {
    private String propertyId;
    private String propertyTitle;
    private String otherUserId;
    private String otherUserName;
    private String lastMessage;
    private LocalDateTime timestamp;
    private boolean isRead;
}
