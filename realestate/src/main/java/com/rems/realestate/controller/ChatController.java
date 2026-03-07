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

        // --- CHAT BOT AUTO-REPLY LOGIC ---
        // If the sender is not the owner, generate an automated response on behalf of
        // the owner
        Property property = propertyRepository.findById(request.getPropertyId()).orElse(null);
        if (property != null && !senderId.equals(property.getOwnerId())) {
            String botResponse = generateBotResponse(request.getContent(), property);

            Message autoReply = Message.builder()
                    .senderId(property.getOwnerId())
                    .receiverId(senderId)
                    .propertyId(property.getId())
                    .content(botResponse)
                    .timestamp(LocalDateTime.now().plusSeconds(1)) // 1 second delay
                    .read(false)
                    .build();

            messageRepository.save(autoReply);
        }

        return ResponseEntity.ok(savedMessage);
    }

    private String generateBotResponse(String userMessage, Property property) {
        String msg = userMessage.toLowerCase();

        if (msg.contains("is it available") || msg.contains("available")) {
            return "Yes! This property is currently available for " + property.getPurpose().name() + ".";
        }
        if (property.getPurpose().name().equals("RENT") && (msg.contains("tenant") || msg.contains("rent"))) {
            return "Thanks for your interest in renting! Please make sure to use the 'Apply to Rent' button to submit your application directly to the owner.";
        }
        if (property.getPurpose().name().equals("SALE")
                && (msg.contains("buy") || msg.contains("price") || msg.contains("offer"))) {
            return "This property is listed for ₹" + property.getPrice()
                    + ". You can submit an official request using the 'Buy Property' button.";
        }
        if (msg.contains("hello") || msg.contains("hi")) {
            return "Hello! I am the automated assistant for this listing. How can I help you regarding this "
                    + property.getType().name() + "?";
        }
        if (msg.contains("amenities") || msg.contains("features")) {
            if (property.getAmenities() != null && !property.getAmenities().isEmpty()) {
                return "This property includes: " + String.join(", ", property.getAmenities()) + ".";
            }
            return "This property doesn't have any specific amenities listed. Is there anything else you'd like to know?";
        }

        return "Thank you for reaching out! The owner has received your message in their inbox and will reply as soon as possible. (I am an automated assistant)";
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
}
