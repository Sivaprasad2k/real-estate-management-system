package com.rems.realestate.controller;

import com.rems.realestate.dto.MessageRequest;
import com.rems.realestate.model.Message;
import com.rems.realestate.repository.MessageRepository;
import com.rems.realestate.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.rems.realestate.dto.InboxResponse;
import com.rems.realestate.repository.PropertyRepository;
import com.rems.realestate.repository.UserRepository;
import com.rems.realestate.model.Property;
import com.rems.realestate.model.User;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UserRepository userRepository;

    private static final java.util.Map<String, LocalDateTime> activeTypingStatus = new java.util.concurrent.ConcurrentHashMap<>();

    @PreAuthorize("isAuthenticated()")
    @PostMapping
    public ResponseEntity<Message> sendMessage(@Valid @RequestBody MessageRequest request,
            Authentication authentication) {
        String senderId = ((UserDetailsImpl) authentication.getPrincipal()).getId();

        Message message = Message.builder()
                .senderId(senderId)
                .receiverId(request.getReceiverId())
                .propertyId(request.getPropertyId())
                .content(request.getContent())
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();

        Message savedMessage = messageRepository.save(message);
        return ResponseEntity.ok(savedMessage);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{propertyId}/{otherUserId}")
    public ResponseEntity<List<Message>> getChatHistory(
            @PathVariable String propertyId,
            @PathVariable String otherUserId,
            Authentication authentication) {

        String currentUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();

        // Get messages sent BY current user TO the other user for this property
        List<Message> sent = messageRepository.findBySenderIdAndReceiverIdAndPropertyIdOrderByTimestampAsc(
                currentUserId, otherUserId, propertyId);

        // Get messages received BY current user FROM the other user for this property
        List<Message> received = messageRepository.findByReceiverIdAndSenderIdAndPropertyIdOrderByTimestampAsc(
                currentUserId, otherUserId, propertyId);

        // Combine and sort by timestamp
        List<Message> chatHistory = Stream.concat(sent.stream(), received.stream())
                .sorted(Comparator.comparing(Message::getTimestamp))
                .collect(Collectors.toList());

        // Mark received messages as read
        for (Message msg : received) {
            if (!msg.isRead()) {
                msg.setRead(true);
                messageRepository.save(msg);
            }
        }

        return ResponseEntity.ok(chatHistory);
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/inbox")
    public ResponseEntity<List<InboxResponse>> getInbox(Authentication authentication) {
        String currentUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();

        List<Message> userMessages = messageRepository.findBySenderIdOrReceiverIdOrderByTimestampDesc(currentUserId,
                currentUserId);

        List<InboxResponse> inbox = new ArrayList<>();
        Set<String> seenConversations = new HashSet<>();

        for (Message msg : userMessages) {
            String otherUserId = msg.getSenderId().equals(currentUserId) ? msg.getReceiverId() : msg.getSenderId();
            String conversationKey = msg.getPropertyId() + "_" + otherUserId;

            if (!seenConversations.contains(conversationKey)) {
                seenConversations.add(conversationKey);

                Property property = propertyRepository.findById(msg.getPropertyId()).orElse(null);
                User otherUser = userRepository.findById(otherUserId).orElse(null);

                if (property != null && otherUser != null) {
                    inbox.add(InboxResponse.builder()
                            .propertyId(property.getId())
                            .propertyTitle(property.getTitle())
                            .otherUserId(otherUser.getId())
                            .otherUserName(otherUser.getName())
                            .lastMessage(msg.getContent())
                            .timestamp(msg.getTimestamp())
                            .isRead(msg.isRead() || msg.getSenderId().equals(currentUserId))
                            .build());
                }
            }
        }

        return ResponseEntity.ok(inbox);
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/conversation/{propertyId}/{otherUserId}")
    public ResponseEntity<?> deleteConversation(@PathVariable String propertyId, @PathVariable String otherUserId,
            Authentication authentication) {
        String currentUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();

        List<Message> sent = messageRepository.findBySenderIdAndReceiverIdAndPropertyIdOrderByTimestampAsc(
                currentUserId, otherUserId, propertyId);
        List<Message> received = messageRepository.findByReceiverIdAndSenderIdAndPropertyIdOrderByTimestampAsc(
                currentUserId, otherUserId, propertyId);

        messageRepository.deleteAll(sent);
        messageRepository.deleteAll(received);

        return ResponseEntity.ok().build();
    }

    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable String messageId, Authentication authentication) {
        String currentUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!message.getSenderId().equals(currentUserId)) {
            return ResponseEntity.status(403).body("Not authorized to delete this message");
        }

        messageRepository.delete(message);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("isAuthenticated()")
    @PostMapping("/typing")
    public ResponseEntity<?> setTypingStatus(@RequestBody java.util.Map<String, Object> body, Authentication authentication) {
        String senderId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        String propertyId = (String) body.get("propertyId");
        String receiverId = (String) body.get("receiverId");
        Boolean isTyping = (Boolean) body.get("isTyping");

        if (propertyId != null && receiverId != null) {
            String key = propertyId + "_" + senderId + "_" + receiverId;
            if (Boolean.TRUE.equals(isTyping)) {
                activeTypingStatus.put(key, LocalDateTime.now());
            } else {
                activeTypingStatus.remove(key);
            }
        }
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/typing/{propertyId}/{otherUserId}")
    public ResponseEntity<?> getTypingStatus(
            @PathVariable String propertyId,
            @PathVariable String otherUserId,
            Authentication authentication) {
        String currentUserId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        String key = propertyId + "_" + otherUserId + "_" + currentUserId;
        LocalDateTime lastTypingTime = activeTypingStatus.get(key);
        boolean isTyping = lastTypingTime != null && lastTypingTime.isAfter(LocalDateTime.now().minusSeconds(3));
        return ResponseEntity.ok(java.util.Map.of("isTyping", isTyping));
    }
}
