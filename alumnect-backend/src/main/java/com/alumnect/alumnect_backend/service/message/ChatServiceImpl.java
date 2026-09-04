package com.alumnect.alumnect_backend.service.message;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MediaType;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.message.MessageAttachmentRepository;
import com.alumnect.alumnect_backend.dao.message.MessageRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.message.AttachmentRequest;
import com.alumnect.alumnect_backend.dto.request.message.SendMessageRequest;
import com.alumnect.alumnect_backend.dto.response.message.ConversationResponse;
import com.alumnect.alumnect_backend.dto.response.message.MessageResponse;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.message.ConversationParticipant;
import com.alumnect.alumnect_backend.entity.message.Message;
import com.alumnect.alumnect_backend.entity.message.MessageAttachment;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.message.MessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Lớp triển khai dịch vụ Nhắn tin trực tiếp 1-1 (UC33 - Direct Messaging).
 * Xử lý lưu trữ lịch sử tin nhắn vào CSDL PostgreSQL và phát sóng thời gian thực qua WebSocket STOMP.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository conversationParticipantRepository;
    private final MessageRepository messageRepository;
    private final MessageAttachmentRepository messageAttachmentRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final MessageMapper messageMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(String currentUserEmail) {
        User currentUser = getUserByEmail(currentUserEmail);
        List<Conversation> conversations = conversationRepository.findConversationsByUserId(currentUser.getId());

        Map<Long, ConversationResponse> uniqueMap = new LinkedHashMap<>();
        for (Conversation conversation : conversations) {
            List<ConversationParticipant> participants = conversationParticipantRepository.findByConversationId(conversation.getId());

            ConversationParticipant currentParticipant = null;
            ConversationParticipant otherParticipant = null;

            for (ConversationParticipant p : participants) {
                if (p.getUser().getId().equals(currentUser.getId())) {
                    currentParticipant = p;
                } else {
                    otherParticipant = p;
                }
            }

            if (otherParticipant == null) {
                continue;
            }

            User recipient = otherParticipant.getUser();
            if (uniqueMap.containsKey(recipient.getId())) {
                continue;
            }

            UserProfile recipientProfile = userProfileRepository.findById(recipient.getId()).orElse(null);

            // Tìm tin nhắn mới nhất
            Optional<Message> latestMsgOpt = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId());
            String lastSnippet = "";
            if (latestMsgOpt.isPresent()) {
                Message msg = latestMsgOpt.get();
                if (msg.getContent() != null && !msg.getContent().isBlank()) {
                    lastSnippet = msg.getContent();
                } else if (!msg.getAttachments().isEmpty()) {
                    MediaType type = msg.getAttachments().get(0).getMediaType();
                    lastSnippet = switch (type) {
                        case IMAGE -> "[Hình ảnh]";
                        case VIDEO -> "[Video]";
                        default -> "[Tệp đính kèm]";
                    };
                }
            }

            // Đếm số tin nhắn chưa đọc
            long unreadCount = 0;
            if (currentParticipant != null) {
                if (currentParticipant.getLastReadMessage() != null) {
                    unreadCount = messageRepository.countByConversationIdAndIdGreaterThanAndSenderIdNot(
                            conversation.getId(),
                            currentParticipant.getLastReadMessage().getId(),
                            currentUser.getId()
                    );
                } else {
                    unreadCount = messageRepository.countByConversationIdAndSenderIdNot(
                            conversation.getId(),
                            currentUser.getId()
                    );
                }
            }

            uniqueMap.put(recipient.getId(), messageMapper.toConversationResponse(
                    conversation,
                    recipient,
                    recipientProfile,
                    lastSnippet,
                    unreadCount
            ));
        }

        return new ArrayList<>(uniqueMap.values());
    }

    @Override
    @Transactional
    public ConversationResponse getOrCreateDirectConversation(String currentUserEmail, Long targetUserId) {
        User currentUser = getUserByEmail(currentUserEmail);

        if (currentUser.getId().equals(targetUserId)) {
            throw new BadRequestException("Bạn không thể tạo cuộc trò chuyện với chính mình.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với mã: " + targetUserId));

        // Khóa định danh duy nhất của cuộc hội thoại 1-1
        String directKey = Math.min(currentUser.getId(), targetUserId) + "_" + Math.max(currentUser.getId(), targetUserId);

        // Kiểm tra xem đã có cuộc hội thoại 1-1 giữa 2 người chưa
        Optional<Conversation> existingOpt = conversationRepository.findByDirectKey(directKey);
        if (existingOpt.isEmpty()) {
            existingOpt = conversationRepository.findDirectConversationBetween(currentUser.getId(), targetUserId);
        }

        Conversation conversation;

        if (existingOpt.isPresent()) {
            conversation = existingOpt.get();
        } else {
            try {
                // Khởi tạo cuộc hội thoại mới với directKey
                conversation = conversationRepository.save(Conversation.builder()
                        .directKey(directKey)
                        .createdAt(Instant.now())
                        .lastMessageAt(Instant.now())
                        .build());

                // Tạo 2 bản ghi thành viên
                ConversationParticipant p1 = ConversationParticipant.builder()
                        .conversation(conversation)
                        .user(currentUser)
                        .joinedAt(Instant.now())
                        .build();

                ConversationParticipant p2 = ConversationParticipant.builder()
                        .conversation(conversation)
                        .user(targetUser)
                        .joinedAt(Instant.now())
                        .build();

                conversationParticipantRepository.saveAll(List.of(p1, p2));
                log.info("Khởi tạo cuộc hội thoại mới id={} directKey={} giữa user {} và user {}", 
                        conversation.getId(), directKey, currentUser.getId(), targetUserId);
            } catch (Exception e) {
                log.warn("Bắt race condition khi tạo conversation directKey={}: {}", directKey, e.getMessage());
                conversation = conversationRepository.findByDirectKey(directKey)
                        .orElseGet(() -> conversationRepository.findDirectConversationBetween(currentUser.getId(), targetUserId)
                                .orElseThrow(() -> new ResourceNotFoundException("Lỗi khởi tạo cuộc trò chuyện.")));
            }
        }

        UserProfile targetProfile = userProfileRepository.findById(targetUserId).orElse(null);
        Optional<Message> latestMsgOpt = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId());
        String lastSnippet = latestMsgOpt.map(Message::getContent).orElse("");

        return messageMapper.toConversationResponse(conversation, targetUser, targetProfile, lastSnippet, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MessageResponse> getMessages(String currentUserEmail, Long conversationId, Pageable pageable) {
        User currentUser = getUserByEmail(currentUserEmail);

        // Kiểm tra quyền: Người dùng phải là thành viên trong hội thoại
        if (!conversationParticipantRepository.existsByConversationIdAndUserId(conversationId, currentUser.getId())) {
            throw new ForbiddenException("Bạn không có quyền xem tin nhắn trong cuộc hội thoại này.");
        }

        Page<Message> messagePage = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageable);

        // Thu thập các sender IDs để nạp trước Profile
        Set<Long> senderIds = messagePage.getContent().stream()
                .map(m -> m.getSender().getId())
                .collect(Collectors.toSet());
        Map<Long, UserProfile> profileMap = userProfileRepository.findAllById(senderIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, p -> p));

        List<MessageResponse> responseList = messagePage.getContent().stream()
                .map(m -> messageMapper.toMessageResponse(m, profileMap.get(m.getSender().getId())))
                .collect(Collectors.toList());

        return PageResponse.<MessageResponse>builder()
                .content(responseList)
                .pageNumber(messagePage.getNumber())
                .pageSize(messagePage.getSize())
                .totalElements(messagePage.getTotalElements())
                .totalPages(messagePage.getTotalPages())
                .last(messagePage.isLast())
                .build();
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(String currentUserEmail, SendMessageRequest request) {
        User sender = getUserByEmail(currentUserEmail);

        // Kiểm tra nội dung tin nhắn không được rỗng cả text lẫn attachment
        boolean hasText = request.getContent() != null && !request.getContent().trim().isEmpty();
        boolean hasAttachments = request.getAttachments() != null && !request.getAttachments().isEmpty();

        if (!hasText && !hasAttachments) {
            throw new BadRequestException("Tin nhắn phải có nội dung văn bản hoặc ít nhất một tệp đính kèm.");
        }

        Conversation conversation;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc hội thoại với mã: " + request.getConversationId()));

            if (!conversationParticipantRepository.existsByConversationIdAndUserId(conversation.getId(), sender.getId())) {
                throw new ForbiddenException("Bạn không phải là thành viên của cuộc hội thoại này.");
            }
        } else if (request.getRecipientId() != null) {
            // Tìm hoặc tạo mới hội thoại 1-1 với người nhận
            ConversationResponse convResp = getOrCreateDirectConversation(currentUserEmail, request.getRecipientId());
            conversation = conversationRepository.findById(convResp.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lỗi khởi tạo cuộc hội thoại."));
        } else {
            throw new BadRequestException("Vui lòng cung cấp mã cuộc hội thoại hoặc mã người nhận.");
        }

        // Tạo và lưu tin nhắn
        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.getContent() != null ? request.getContent().trim() : null)
                .isDeleted(false)
                .createdAt(Instant.now())
                .build();

        Message savedMessage = messageRepository.save(message);

        // Lưu các tệp đính kèm nếu có
        List<MessageAttachment> savedAttachments = new ArrayList<>();
        if (hasAttachments) {
            for (AttachmentRequest attReq : request.getAttachments()) {
                MessageAttachment attachment = MessageAttachment.builder()
                        .message(savedMessage)
                        .mediaType(attReq.getMediaType() != null ? attReq.getMediaType() : MediaType.FILE)
                        .url(attReq.getUrl())
                        .fileName(attReq.getFileName())
                        .fileSize(attReq.getFileSize())
                        .createdAt(Instant.now())
                        .build();
                savedAttachments.add(attachment);
            }
            messageAttachmentRepository.saveAll(savedAttachments);
            savedMessage.setAttachments(savedAttachments);
        }

        // Cập nhật lastMessageAt cho cuộc trò chuyện
        conversation.setLastMessageAt(savedMessage.getCreatedAt());
        conversationRepository.save(conversation);

        // Người gửi tự động coi như đã đọc tin nhắn của chính mình
        Optional<ConversationParticipant> senderPartOpt = conversationParticipantRepository
                .findByConversationIdAndUserId(conversation.getId(), sender.getId());
        senderPartOpt.ifPresent(p -> {
            p.setLastReadMessage(savedMessage);
            conversationParticipantRepository.save(p);
        });

        UserProfile senderProfile = userProfileRepository.findById(sender.getId()).orElse(null);
        MessageResponse response = messageMapper.toMessageResponse(savedMessage, senderProfile);

        // Bắn WebSocket Realtime tới tất cả người nhận trong cuộc trò chuyện
        List<ConversationParticipant> participants = conversationParticipantRepository.findByConversationId(conversation.getId());
        for (ConversationParticipant participant : participants) {
            if (!participant.getUser().getId().equals(sender.getId())) {
                try {
                    messagingTemplate.convertAndSendToUser(
                            participant.getUser().getId().toString(),
                            "/queue/messages",
                            response
                    );
                    log.info("Đã gửi tin nhắn WebSocket tới User ID: {}", participant.getUser().getId());
                } catch (Exception e) {
                    log.error("Lỗi khi bắn WebSocket tới User {}: {}", participant.getUser().getId(), e.getMessage());
                }
            }
        }

        return response;
    }

    @Override
    @Transactional
    public void markAsRead(String currentUserEmail, Long conversationId) {
        User currentUser = getUserByEmail(currentUserEmail);

        ConversationParticipant participant = conversationParticipantRepository
                .findByConversationIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("Bạn không phải thành viên của cuộc hội thoại này."));

        Optional<Message> latestMsgOpt = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversationId);
        latestMsgOpt.ifPresent(msg -> {
            participant.setLastReadMessage(msg);
            conversationParticipantRepository.save(participant);
        });
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));
    }
}
