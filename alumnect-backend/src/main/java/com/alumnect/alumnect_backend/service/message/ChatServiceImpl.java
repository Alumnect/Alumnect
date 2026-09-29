package com.alumnect.alumnect_backend.service.message;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.constant.WebSocketDestinations;
import com.alumnect.alumnect_backend.common.enums.ConversationType;
import com.alumnect.alumnect_backend.common.enums.MediaType;
import com.alumnect.alumnect_backend.common.enums.MessageType;
import com.alumnect.alumnect_backend.common.enums.ParticipantRole;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.message.MessageAttachmentRepository;
import com.alumnect.alumnect_backend.dao.message.MessageRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.message.AddMembersRequest;
import com.alumnect.alumnect_backend.dto.request.message.AttachmentRequest;
import com.alumnect.alumnect_backend.dto.request.message.CreateGroupRequest;
import com.alumnect.alumnect_backend.dto.request.message.SendMessageRequest;
import com.alumnect.alumnect_backend.dto.request.message.UpdateGroupRequest;
import com.alumnect.alumnect_backend.common.util.VietnameseStringUtils;
import com.alumnect.alumnect_backend.dto.response.message.ChatUserProjection;
import com.alumnect.alumnect_backend.dto.response.message.ChatUserResponse;
import com.alumnect.alumnect_backend.dto.response.message.ConversationResponse;
import com.alumnect.alumnect_backend.dto.response.message.MessageResponse;
import com.alumnect.alumnect_backend.dto.response.message.ParticipantResponse;
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
 * Lớp triển khai dịch vụ Nhắn tin: Trực tiếp 1-1, Nhắn tin nhóm và Tin nhắn từ người lạ.
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
    private final FollowRepository followRepository;
    private final MessageMapper messageMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversations(String currentUserEmail, String tab) {
        User currentUser = getUserByEmail(currentUserEmail);
        List<Conversation> conversations = conversationRepository.findConversationsByUserId(currentUser.getId());

        if (conversations.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> conversationIds = conversations.stream().map(Conversation::getId).toList();

        // 1. Nạp toàn bộ participants trong 1 query (JOIN FETCH user, lastReadMessage)
        List<ConversationParticipant> allParticipants = conversationParticipantRepository
                .findByConversationIdInWithUserAndLastRead(conversationIds);
        Map<Long, List<ConversationParticipant>> participantsByConv = allParticipants.stream()
                .collect(Collectors.groupingBy(cp -> cp.getConversation().getId()));

        // Thu thập đối phương (recipients) của từng hội thoại trực tiếp 1-1
        Map<Long, User> recipientByConv = new HashMap<>();
        Set<Long> recipientUserIds = new HashSet<>();
        for (Conversation conv : conversations) {
            List<ConversationParticipant> parts = participantsByConv.getOrDefault(conv.getId(), Collections.emptyList());
            if (conv.getType() == ConversationType.DIRECT) {
                for (ConversationParticipant p : parts) {
                    if (!p.getUser().getId().equals(currentUser.getId())) {
                        recipientByConv.put(conv.getId(), p.getUser());
                        recipientUserIds.add(p.getUser().getId());
                        break;
                    }
                }
            }
        }

        // 2. Nạp toàn bộ UserProfile của recipients trong 1 query
        Map<Long, UserProfile> profileMap = userProfileRepository.findAllById(recipientUserIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, p -> p));

        // 3. Nạp tin nhắn mới nhất kèm tệp đính kèm của toàn bộ cuộc trò chuyện trong batch queries
        List<Long> latestMessageIds = messageRepository.findLatestMessageIdsByConversationIds(conversationIds);
        Map<Long, Message> latestMessageByConv = new HashMap<>();
        if (!latestMessageIds.isEmpty()) {
            List<Message> latestMessages = messageRepository.findMessagesWithAttachmentsByIdIn(latestMessageIds);
            for (Message m : latestMessages) {
                latestMessageByConv.put(m.getConversation().getId(), m);
            }
        }

        // 4. Đếm số lượng tin nhắn chưa đọc của toàn bộ cuộc trò chuyện trong 1 query (GROUP BY)
        List<Object[]> unreadRows = messageRepository.countUnreadGroupedByConversation(conversationIds, currentUser.getId());
        Map<Long, Long> unreadMap = new HashMap<>();
        for (Object[] row : unreadRows) {
            Long convId = ((Number) row[0]).longValue();
            Long count = ((Number) row[1]).longValue();
            unreadMap.put(convId, count);
        }

        // 5. Lọc theo tab: "primary" (Hộp thư chính / đã chấp nhận) hoặc "requests" (Tin nhắn chờ từ người lạ)
        boolean isRequestsTab = "requests".equalsIgnoreCase(tab);

        List<ConversationResponse> resultList = new ArrayList<>();
        for (Conversation conversation : conversations) {
            List<ConversationParticipant> parts = participantsByConv.getOrDefault(conversation.getId(), Collections.emptyList());
            ConversationParticipant myPart = parts.stream()
                    .filter(p -> p.getUser().getId().equals(currentUser.getId()))
                    .findFirst()
                    .orElse(null);

            if (myPart == null) {
                continue;
            }

            // Lọc theo trạng thái isAccepted
            if (isRequestsTab && myPart.isAccepted()) {
                continue;
            }
            if (!isRequestsTab && !myPart.isAccepted()) {
                continue;
            }

            // Chỉ hiển thị cuộc trò chuyện có ít nhất 1 tin nhắn
            Message latestMsg = latestMessageByConv.get(conversation.getId());
            if (latestMsg == null) {
                continue;
            }

            String lastSnippet = "";
            if (latestMsg.getContent() != null && !latestMsg.getContent().isBlank()) {
                lastSnippet = latestMsg.getContent();
            } else if (!latestMsg.getAttachments().isEmpty()) {
                MediaType type = latestMsg.getAttachments().get(0).getMediaType();
                lastSnippet = switch (type) {
                    case IMAGE -> "[Hình ảnh]";
                    case VIDEO -> "[Video]";
                    default -> "[Tệp đính kèm]";
                };
            }

            long unreadCount = unreadMap.getOrDefault(conversation.getId(), 0L);

            if (conversation.getType() == ConversationType.GROUP) {
                resultList.add(ConversationResponse.builder()
                        .id(conversation.getId())
                        .type(ConversationType.GROUP)
                        .isGroup(true)
                        .title(conversation.getTitle() != null ? conversation.getTitle() : "Nhóm trò chuyện")
                        .avatarUrl(conversation.getAvatarUrl())
                        .recipientName(conversation.getTitle() != null ? conversation.getTitle() : "Nhóm trò chuyện")
                        .recipientAvatar(conversation.getAvatarUrl())
                        .createdAt(conversation.getCreatedAt())
                        .lastMessageAt(conversation.getLastMessageAt() != null ? conversation.getLastMessageAt() : conversation.getCreatedAt())
                        .memberCount(parts.size())
                        .isAccepted(myPart.isAccepted())
                        .adminId(conversation.getCreatedBy() != null ? conversation.getCreatedBy().getId() : null)
                        .lastMessage(lastSnippet)
                        .unreadCount(unreadCount)
                        .build());
            } else {
                User recipient = recipientByConv.get(conversation.getId());
                if (recipient == null) {
                    continue;
                }
                UserProfile recipientProfile = profileMap.get(recipient.getId());

                resultList.add(messageMapper.toConversationResponse(
                        conversation,
                        recipient,
                        recipientProfile,
                        lastSnippet,
                        unreadCount,
                        myPart.isAccepted()
                ));
            }
        }

        return resultList;
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getOrCreateDirectConversation(String currentUserEmail, Long targetUserId) {
        User currentUser = getUserByEmail(currentUserEmail);

        if (currentUser.getId().equals(targetUserId)) {
            throw new BadRequestException("Bạn không thể tạo cuộc trò chuyện với chính mình.");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với mã: " + targetUserId));

        UserProfile targetProfile = userProfileRepository.findById(targetUserId).orElse(null);

        // Khóa định danh duy nhất của cuộc hội thoại 1-1
        String directKey = Math.min(currentUser.getId(), targetUserId) + "_" + Math.max(currentUser.getId(), targetUserId);

        // Kiểm tra xem đã có cuộc hội thoại 1-1 giữa 2 người trong CSDL chưa
        Optional<Conversation> existingOpt = conversationRepository.findByDirectKey(directKey);
        if (existingOpt.isEmpty()) {
            existingOpt = conversationRepository.findDirectConversationBetween(currentUser.getId(), targetUserId);
        }

        if (existingOpt.isPresent()) {
            Conversation conversation = existingOpt.get();
            Optional<Message> latestMsgOpt = messageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId());
            String lastSnippet = latestMsgOpt.map(Message::getContent).orElse("");

            Optional<ConversationParticipant> myPartOpt = conversationParticipantRepository
                    .findByConversationIdAndUserId(conversation.getId(), currentUser.getId());
            boolean isAccepted = myPartOpt.map(ConversationParticipant::isAccepted).orElse(true);

            return messageMapper.toConversationResponse(conversation, targetUser, targetProfile, lastSnippet, 0, isAccepted);
        }

        // NẾU CHƯA CÓ CUỘC HỘI THOẠI TRONG CSDL:
        // Không lưu vào DB ngay để tránh lỗi tin nhắn rỗng!
        // Trả về đối tượng Draft (id = null) với thông tin của đối phương để frontend hiển thị.
        String recipientName = targetProfile != null && targetProfile.getFullName() != null
                ? targetProfile.getFullName()
                : targetUser.getEmail();
        String recipientAvatar = targetProfile != null ? targetProfile.getAvatarUrl() : null;
        String recipientMajor = targetProfile != null && targetProfile.getMajor() != null
                ? targetProfile.getMajor().getName()
                : null;

        return ConversationResponse.builder()
                .id(null)
                .type(ConversationType.DIRECT)
                .isGroup(false)
                .recipientId(targetUser.getId())
                .recipientName(recipientName)
                .recipientAvatar(recipientAvatar)
                .recipientMajor(recipientMajor)
                .title(recipientName)
                .avatarUrl(recipientAvatar)
                .createdAt(Instant.now())
                .lastMessageAt(Instant.now())
                .memberCount(2)
                .isAccepted(true)
                .lastMessage("")
                .unreadCount(0)
                .build();
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
            Long recipientId = request.getRecipientId();
            if (sender.getId().equals(recipientId)) {
                throw new BadRequestException("Bạn không thể gửi tin nhắn cho chính mình.");
            }

            User recipient = userRepository.findById(recipientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người nhận với mã: " + recipientId));

            String directKey = Math.min(sender.getId(), recipientId) + "_" + Math.max(sender.getId(), recipientId);
            Optional<Conversation> existingOpt = conversationRepository.findByDirectKey(directKey);

            if (existingOpt.isPresent()) {
                conversation = existingOpt.get();
            } else {
                // Kiểm tra quan hệ Follow để phân loại Người lạ / Tin nhắn chờ:
                // Nếu recipient chưa follow sender thì đây là tin nhắn từ người lạ -> recipient is_accepted = false
                boolean isFollowedByRecipient = followRepository.existsByFollowerIdAndFollowingId(recipientId, sender.getId());

                conversation = conversationRepository.save(Conversation.builder()
                        .type(ConversationType.DIRECT)
                        .directKey(directKey)
                        .createdAt(Instant.now())
                        .lastMessageAt(Instant.now())
                        .build());

                ConversationParticipant pSender = ConversationParticipant.builder()
                        .conversation(conversation)
                        .user(sender)
                        .role(ParticipantRole.MEMBER)
                        .isAccepted(true)
                        .joinedAt(Instant.now())
                        .build();

                ConversationParticipant pRecipient = ConversationParticipant.builder()
                        .conversation(conversation)
                        .user(recipient)
                        .role(ParticipantRole.MEMBER)
                        .isAccepted(isFollowedByRecipient) // false nếu là người lạ
                        .joinedAt(Instant.now())
                        .build();

                conversationParticipantRepository.saveAll(List.of(pSender, pRecipient));
                log.info("Tạo hội thoại 1-1 mới id={}, isStranger={}", conversation.getId(), !isFollowedByRecipient);
            }
        } else {
            throw new BadRequestException("Vui lòng cung cấp mã cuộc hội thoại hoặc mã người nhận.");
        }

        // Xác định loại tin nhắn (TEXT, IMAGE, FILE)
        MessageType msgType = MessageType.TEXT;
        if (!hasText && hasAttachments) {
            boolean allImages = request.getAttachments().stream()
                    .allMatch(a -> a.getMediaType() == MediaType.IMAGE);
            msgType = allImages ? MessageType.IMAGE : MessageType.FILE;
        }

        // Tạo và lưu tin nhắn
        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.getContent() != null ? request.getContent().trim() : null)
                .type(msgType)
                .isDeleted(false)
                .createdAt(Instant.now())
                .build();

        Message savedMessage = messageRepository.save(message);

        // Lưu tệp đính kèm nếu có
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

        // Đánh dấu người gửi đã đọc tin nhắn và tự động chấp nhận hội thoại nếu người này trước đó ở trạng thái tin nhắn chờ
        Optional<ConversationParticipant> senderPartOpt = conversationParticipantRepository
                .findByConversationIdAndUserId(conversation.getId(), sender.getId());
        senderPartOpt.ifPresent(p -> {
            p.setLastReadMessage(savedMessage);
            if (!p.isAccepted()) {
                p.setAccepted(true);
                log.info("User {} đã tự động chấp nhận cuộc trò chuyện {} khi phản hồi tin nhắn", sender.getId(), conversation.getId());
            }
            conversationParticipantRepository.save(p);
        });

        UserProfile senderProfile = userProfileRepository.findById(sender.getId()).orElse(null);
        MessageResponse response = messageMapper.toMessageResponse(savedMessage, senderProfile);

        // Bắn WebSocket Realtime tới tất cả thành viên khác trong cuộc trò chuyện (Direct hoặc Group)
        List<ConversationParticipant> participants = conversationParticipantRepository.findByConversationId(conversation.getId());
        for (ConversationParticipant participant : participants) {
            if (!participant.getUser().getId().equals(sender.getId())) {
                try {
                    messagingTemplate.convertAndSendToUser(
                            participant.getUser().getId().toString(),
                            WebSocketDestinations.USER_QUEUE_MESSAGES,
                            response
                    );
                    log.info("WebSocket sent to User ID: {} for conversation {}", participant.getUser().getId(), conversation.getId());
                } catch (Exception e) {
                    log.error("WebSocket push failed for User {}: {}", participant.getUser().getId(), e.getMessage());
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

    @Override
    @Transactional
    public void acceptConversation(String currentUserEmail, Long conversationId) {
        User currentUser = getUserByEmail(currentUserEmail);

        ConversationParticipant participant = conversationParticipantRepository
                .findByConversationIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Bạn không phải là thành viên của cuộc hội thoại này."));

        participant.setAccepted(true);
        conversationParticipantRepository.save(participant);
        log.info("User {} đã chấp nhận cuộc trò chuyện {}", currentUser.getId(), conversationId);
    }

    @Override
    @Transactional
    public void deleteConversation(String currentUserEmail, Long conversationId) {
        User currentUser = getUserByEmail(currentUserEmail);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc hội thoại."));

        if (!conversationParticipantRepository.existsByConversationIdAndUserId(conversationId, currentUser.getId())) {
            throw new ForbiddenException("Bạn không có quyền xóa cuộc hội thoại này.");
        }

        if (conversation.getType() == ConversationType.DIRECT) {
            // Đối với chat trực tiếp, xóa cuộc trò chuyện và toàn bộ tin nhắn liên quan
            conversationRepository.delete(conversation);
            log.info("User {} đã xóa cuộc trò chuyện trực tiếp {}", currentUser.getId(), conversationId);
        } else {
            // Đối với nhóm, nếu là người tạo nhóm thì xóa toàn bộ nhóm, nếu không thì rời khỏi nhóm
            if (conversation.getCreatedBy() != null && conversation.getCreatedBy().getId().equals(currentUser.getId())) {
                conversationRepository.delete(conversation);
                log.info("Admin {} đã giải tán nhóm {}", currentUser.getId(), conversationId);
            } else {
                conversationParticipantRepository.deleteByConversationIdAndUserId(conversationId, currentUser.getId());
                log.info("User {} đã rời khỏi nhóm {}", currentUser.getId(), conversationId);
            }
        }
    }

    @Override
    @Transactional
    public ConversationResponse createGroupConversation(String currentUserEmail, CreateGroupRequest request) {
        User currentUser = getUserByEmail(currentUserEmail);

        List<Long> memberIds = request.getMemberIds().stream()
                .filter(id -> !id.equals(currentUser.getId()))
                .distinct()
                .toList();

        if (memberIds.isEmpty()) {
            throw new BadRequestException("Nhóm phải có ít nhất 1 thành viên khác.");
        }

        List<User> members = userRepository.findAllById(memberIds);
        if (members.isEmpty()) {
            throw new BadRequestException("Không tìm thấy các thành viên được chọn.");
        }

        Conversation group = Conversation.builder()
                .type(ConversationType.GROUP)
                .title(request.getTitle().trim())
                .avatarUrl(request.getAvatarUrl())
                .createdBy(currentUser)
                .createdAt(Instant.now())
                .lastMessageAt(Instant.now())
                .build();

        Conversation savedGroup = conversationRepository.save(group);

        List<ConversationParticipant> participants = new ArrayList<>();
        // Người tạo là ADMIN
        participants.add(ConversationParticipant.builder()
                .conversation(savedGroup)
                .user(currentUser)
                .role(ParticipantRole.ADMIN)
                .isAccepted(true)
                .joinedAt(Instant.now())
                .build());

        // Các thành viên khác
        for (User member : members) {
            participants.add(ConversationParticipant.builder()
                    .conversation(savedGroup)
                    .user(member)
                    .role(ParticipantRole.MEMBER)
                    .isAccepted(true)
                    .joinedAt(Instant.now())
                    .build());
        }

        conversationParticipantRepository.saveAll(participants);

        // Tạo tin nhắn hệ thống chào mừng nhóm
        UserProfile creatorProfile = userProfileRepository.findById(currentUser.getId()).orElse(null);
        String creatorName = creatorProfile != null && creatorProfile.getFullName() != null
                ? creatorProfile.getFullName()
                : currentUser.getEmail();

        Message initMessage = messageRepository.save(Message.builder()
                .conversation(savedGroup)
                .sender(currentUser)
                .type(MessageType.SYSTEM)
                .content(creatorName + " đã tạo nhóm \"" + savedGroup.getTitle() + "\"")
                .createdAt(Instant.now())
                .build());

        savedGroup.setLastMessageAt(initMessage.getCreatedAt());
        conversationRepository.save(savedGroup);

        // Phát sóng WebSocket tới các thành viên
        MessageResponse msgResp = messageMapper.toMessageResponse(initMessage, creatorProfile);
        for (ConversationParticipant p : participants) {
            if (!p.getUser().getId().equals(currentUser.getId())) {
                try {
                    messagingTemplate.convertAndSendToUser(
                            p.getUser().getId().toString(),
                            WebSocketDestinations.USER_QUEUE_MESSAGES,
                            msgResp
                    );
                } catch (Exception e) {
                    log.error("WebSocket push failed for group member {}: {}", p.getUser().getId(), e.getMessage());
                }
            }
        }

        return ConversationResponse.builder()
                .id(savedGroup.getId())
                .type(ConversationType.GROUP)
                .isGroup(true)
                .title(savedGroup.getTitle())
                .avatarUrl(savedGroup.getAvatarUrl())
                .recipientName(savedGroup.getTitle())
                .recipientAvatar(savedGroup.getAvatarUrl())
                .createdAt(savedGroup.getCreatedAt())
                .lastMessageAt(savedGroup.getLastMessageAt())
                .memberCount(participants.size())
                .isAccepted(true)
                .adminId(currentUser.getId())
                .lastMessage(initMessage.getContent())
                .unreadCount(0)
                .build();
    }

    @Override
    @Transactional
    public ConversationResponse updateGroup(String currentUserEmail, Long conversationId, UpdateGroupRequest request) {
        User currentUser = getUserByEmail(currentUserEmail);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc hội thoại."));

        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Cuộc hội thoại này không phải là nhóm trò chuyện.");
        }

        if (!conversationParticipantRepository.existsByConversationIdAndUserId(conversationId, currentUser.getId())) {
            throw new ForbiddenException("Bạn không phải thành viên của nhóm này.");
        }

        boolean titleChanged = request.getTitle() != null && !request.getTitle().trim().isEmpty() && !request.getTitle().trim().equals(conversation.getTitle());
        boolean avatarChanged = request.getAvatarUrl() != null && !request.getAvatarUrl().equals(conversation.getAvatarUrl());

        if (titleChanged) {
            conversation.setTitle(request.getTitle().trim());
        }
        if (request.getAvatarUrl() != null) {
            conversation.setAvatarUrl(request.getAvatarUrl().trim().isEmpty() ? null : request.getAvatarUrl().trim());
        }

        Conversation saved = conversationRepository.save(conversation);

        UserProfile updaterProfile = userProfileRepository.findById(currentUser.getId()).orElse(null);
        String updaterName = updaterProfile != null && updaterProfile.getFullName() != null
                ? updaterProfile.getFullName()
                : currentUser.getEmail();

        String systemContent = null;
        if (titleChanged) {
            systemContent = updaterName + " đã đổi tên nhóm thành \"" + saved.getTitle() + "\"";
        } else if (avatarChanged) {
            systemContent = updaterName + " đã cập nhật ảnh đại diện nhóm";
        }

        if (systemContent != null) {
            Message sysMsg = messageRepository.save(Message.builder()
                    .conversation(saved)
                    .sender(currentUser)
                    .type(MessageType.SYSTEM)
                    .content(systemContent)
                    .createdAt(Instant.now())
                    .build());
            saved.setLastMessageAt(sysMsg.getCreatedAt());
            conversationRepository.save(saved);

            MessageResponse sysResp = messageMapper.toMessageResponse(sysMsg, updaterProfile);
            List<ConversationParticipant> participants = conversationParticipantRepository.findByConversationId(saved.getId());
            for (ConversationParticipant p : participants) {
                if (!p.getUser().getId().equals(currentUser.getId())) {
                    try {
                        messagingTemplate.convertAndSendToUser(
                                p.getUser().getId().toString(),
                                WebSocketDestinations.USER_QUEUE_MESSAGES,
                                sysResp
                        );
                    } catch (Exception e) {
                        log.error("WebSocket push failed for updateGroup: {}", e.getMessage());
                    }
                }
            }
        }

        long memberCount = conversationParticipantRepository.countByConversationId(conversationId);

        return ConversationResponse.builder()
                .id(saved.getId())
                .type(ConversationType.GROUP)
                .isGroup(true)
                .title(saved.getTitle())
                .avatarUrl(saved.getAvatarUrl())
                .recipientName(saved.getTitle())
                .recipientAvatar(saved.getAvatarUrl())
                .createdAt(saved.getCreatedAt())
                .lastMessageAt(saved.getLastMessageAt())
                .memberCount((int) memberCount)
                .isAccepted(true)
                .adminId(saved.getCreatedBy() != null ? saved.getCreatedBy().getId() : null)
                .build();
    }

    @Override
    @Transactional
    public ConversationResponse addMembers(String currentUserEmail, Long conversationId, AddMembersRequest request) {
        User currentUser = getUserByEmail(currentUserEmail);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc hội thoại."));

        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Chỉ có thể thêm thành viên vào nhóm trò chuyện.");
        }

        if (!conversationParticipantRepository.existsByConversationIdAndUserId(conversationId, currentUser.getId())) {
            throw new ForbiddenException("Bạn không có quyền thêm thành viên vào nhóm này.");
        }

        List<Long> memberIds = request.getMemberIds();
        List<User> newUsers = userRepository.findAllById(memberIds);

        List<ConversationParticipant> toSave = new ArrayList<>();
        for (User user : newUsers) {
            if (!conversationParticipantRepository.existsByConversationIdAndUserId(conversationId, user.getId())) {
                toSave.add(ConversationParticipant.builder()
                        .conversation(conversation)
                        .user(user)
                        .role(ParticipantRole.MEMBER)
                        .isAccepted(true)
                        .joinedAt(Instant.now())
                        .build());
            }
        }

        if (!toSave.isEmpty()) {
            conversationParticipantRepository.saveAll(toSave);

            // Ghi nhận tin nhắn hệ thống ghi rõ tên thành viên được thêm
            UserProfile adderProfile = userProfileRepository.findById(currentUser.getId()).orElse(null);
            String adderName = adderProfile != null && adderProfile.getFullName() != null
                    ? adderProfile.getFullName()
                    : currentUser.getEmail();

            List<Long> addedUserIds = toSave.stream().map(p -> p.getUser().getId()).toList();
            List<UserProfile> addedProfiles = userProfileRepository.findAllById(addedUserIds);
            Map<Long, String> profileNameMap = addedProfiles.stream()
                    .filter(p -> p.getFullName() != null && !p.getFullName().isBlank())
                    .collect(Collectors.toMap(UserProfile::getUserId, UserProfile::getFullName));

            String addedNames = toSave.stream()
                    .map(p -> profileNameMap.getOrDefault(p.getUser().getId(), p.getUser().getEmail()))
                    .collect(Collectors.joining(", "));

            String noticeContent = adderName + " đã thêm " + addedNames + " vào nhóm";

            Message notifyMsg = messageRepository.save(Message.builder()
                    .conversation(conversation)
                    .sender(currentUser)
                    .type(MessageType.SYSTEM)
                    .content(noticeContent)
                    .createdAt(Instant.now())
                    .build());

            conversation.setLastMessageAt(notifyMsg.getCreatedAt());
            conversationRepository.save(conversation);

            // Phát sóng WebSocket Realtime tới tất cả thành viên trong nhóm (cả người thêm, người mới và các thành viên cũ)
            MessageResponse notifyResp = messageMapper.toMessageResponse(notifyMsg, adderProfile);
            List<ConversationParticipant> allParticipants = conversationParticipantRepository.findByConversationId(conversation.getId());
            for (ConversationParticipant p : allParticipants) {
                try {
                    messagingTemplate.convertAndSendToUser(
                            p.getUser().getId().toString(),
                            WebSocketDestinations.USER_QUEUE_MESSAGES,
                            notifyResp
                    );
                    log.info("WebSocket sent addMembers notification to User ID: {}", p.getUser().getId());
                } catch (Exception e) {
                    log.error("WebSocket push failed for group member {}: {}", p.getUser().getId(), e.getMessage());
                }
            }
        }

        long memberCount = conversationParticipantRepository.countByConversationId(conversationId);

        return ConversationResponse.builder()
                .id(conversation.getId())
                .type(ConversationType.GROUP)
                .isGroup(true)
                .title(conversation.getTitle())
                .avatarUrl(conversation.getAvatarUrl())
                .recipientName(conversation.getTitle())
                .recipientAvatar(conversation.getAvatarUrl())
                .createdAt(conversation.getCreatedAt())
                .lastMessageAt(conversation.getLastMessageAt())
                .memberCount((int) memberCount)
                .isAccepted(true)
                .adminId(conversation.getCreatedBy() != null ? conversation.getCreatedBy().getId() : null)
                .build();
    }

    @Override
    @Transactional
    public void removeMember(String currentUserEmail, Long conversationId, Long targetUserId, Long newAdminId) {
        User currentUser = getUserByEmail(currentUserEmail);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc hội thoại."));

        if (conversation.getType() != ConversationType.GROUP) {
            throw new BadRequestException("Thao tác này chỉ áp dụng cho nhóm trò chuyện.");
        }

        ConversationParticipant myPart = conversationParticipantRepository
                .findByConversationIdAndUserId(conversationId, currentUser.getId())
                .orElseThrow(() -> new ForbiddenException("Bạn không phải thành viên của nhóm này."));

        boolean isSelf = currentUser.getId().equals(targetUserId);

        if (!isSelf && myPart.getRole() != ParticipantRole.ADMIN) {
            throw new ForbiddenException("Chỉ quản trị viên mới có quyền xóa thành viên khỏi nhóm.");
        }

        conversationParticipantRepository.deleteByConversationIdAndUserId(conversationId, targetUserId);

        long remaining = conversationParticipantRepository.countByConversationId(conversationId);
        if (remaining == 0) {
            conversationRepository.delete(conversation);
            log.info("Nhóm {} không còn thành viên, đã tự động giải tán.", conversationId);
        } else {
            // Nếu người rời là admin, chuyển quyền admin cho thành viên được chỉ định (newAdminId) hoặc thành viên còn lại
            String nextAdminName = null;
            if (isSelf && myPart.getRole() == ParticipantRole.ADMIN) {
                List<ConversationParticipant> remainingList = conversationParticipantRepository.findByConversationId(conversationId);
                if (!remainingList.isEmpty()) {
                    ConversationParticipant nextAdmin = null;
                    if (newAdminId != null) {
                        nextAdmin = remainingList.stream()
                                .filter(p -> p.getUser().getId().equals(newAdminId))
                                .findFirst()
                                .orElse(null);
                    }
                    if (nextAdmin == null) {
                        nextAdmin = remainingList.get(0);
                    }

                    nextAdmin.setRole(ParticipantRole.ADMIN);
                    conversationParticipantRepository.save(nextAdmin);

                    conversation.setCreatedBy(nextAdmin.getUser());
                    conversationRepository.save(conversation);

                    UserProfile nextAdminProfile = userProfileRepository.findById(nextAdmin.getUser().getId()).orElse(null);
                    nextAdminName = nextAdminProfile != null && nextAdminProfile.getFullName() != null
                            ? nextAdminProfile.getFullName()
                            : nextAdmin.getUser().getEmail();

                    log.info("Chuyển quyền admin nhóm {} cho User {}", conversationId, nextAdmin.getUser().getId());
                }
            }

            // Ghi nhận tin nhắn hệ thống và bắn WebSocket tới các thành viên còn lại
            UserProfile actorProfile = userProfileRepository.findById(currentUser.getId()).orElse(null);
            String actorName = actorProfile != null && actorProfile.getFullName() != null
                    ? actorProfile.getFullName()
                    : currentUser.getEmail();

            UserProfile targetProfile = userProfileRepository.findById(targetUserId).orElse(null);
            String targetName = targetProfile != null && targetProfile.getFullName() != null
                    ? targetProfile.getFullName()
                    : "thành viên";

            String removeNotice;
            if (isSelf) {
                if (nextAdminName != null) {
                    removeNotice = actorName + " đã chuyển quyền cho " + nextAdminName + " và rời nhóm";
                } else {
                    removeNotice = actorName + " đã rời nhóm";
                }
            } else {
                removeNotice = actorName + " đã xóa " + targetName + " khỏi nhóm";
            }
            Message removeMsg = messageRepository.save(Message.builder()
                    .conversation(conversation)
                    .sender(currentUser)
                    .type(MessageType.SYSTEM)
                    .content(removeNotice)
                    .createdAt(Instant.now())
                    .build());
            conversation.setLastMessageAt(removeMsg.getCreatedAt());
            conversationRepository.save(conversation);

            MessageResponse removeResp = messageMapper.toMessageResponse(removeMsg, actorProfile);
            List<ConversationParticipant> remainingParticipants = conversationParticipantRepository.findByConversationId(conversationId);
            for (ConversationParticipant p : remainingParticipants) {
                try {
                    messagingTemplate.convertAndSendToUser(
                            p.getUser().getId().toString(),
                            WebSocketDestinations.USER_QUEUE_MESSAGES,
                            removeResp
                    );
                } catch (Exception e) {
                    log.error("WebSocket push failed for removeMember: {}", e.getMessage());
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ParticipantResponse> getGroupMembers(String currentUserEmail, Long conversationId) {
        User currentUser = getUserByEmail(currentUserEmail);

        if (!conversationParticipantRepository.existsByConversationIdAndUserId(conversationId, currentUser.getId())) {
            throw new ForbiddenException("Bạn không có quyền xem thành viên của cuộc hội thoại này.");
        }

        List<ConversationParticipant> participants = conversationParticipantRepository.findByConversationIdWithUser(conversationId);
        Set<Long> userIds = participants.stream().map(p -> p.getUser().getId()).collect(Collectors.toSet());
        Map<Long, UserProfile> profileMap = userProfileRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, p -> p));

        return participants.stream()
                .map(cp -> messageMapper.toParticipantResponse(cp, profileMap.get(cp.getUser().getId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatUserResponse> searchUsersForChat(String currentUserEmail, String keyword) {
        User currentUser = getUserByEmail(currentUserEmail);
        String trimmed = keyword != null ? keyword.trim() : "";
        String unaccented = VietnameseStringUtils.removeAccents(trimmed.toLowerCase());
        String startPattern = unaccented + "%";
        String wordPattern = "% " + unaccented + "%";
        String emailPattern = trimmed.toLowerCase() + "%";

        List<ChatUserProjection> projections =
                userProfileRepository.searchUsersForChatNative(
                        currentUser.getId(),
                        trimmed.isEmpty() ? null : trimmed,
                        startPattern,
                        wordPattern,
                        emailPattern,
                        25
                );

        return projections.stream()
                .map(p -> ChatUserResponse.builder()
                        .userId(p.getUserId())
                        .email(p.getEmail())
                        .fullName(p.getFullName())
                        .avatarUrl(p.getAvatarUrl())
                        .headline(p.getHeadline())
                        .major(p.getMajor())
                        .isFollowing(Boolean.TRUE.equals(p.getIsFollowing()))
                        .build())
                .collect(Collectors.toList());
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));
    }
}
