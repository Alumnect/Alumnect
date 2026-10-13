package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.constant.WebSocketDestinations;
import com.alumnect.alumnect_backend.common.enums.ConversationType;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MessageType;
import com.alumnect.alumnect_backend.common.enums.ParticipantRole;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.message.MessageRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dto.response.message.MessageResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.message.ConversationParticipant;
import com.alumnect.alumnect_backend.entity.message.Message;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.message.MessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Cài đặt hạ tầng Chat for Task (Conversation MENTORING) cho chuỗi nghiệp vụ Mentoring.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringConversationServiceImpl implements MentoringConversationService {

    /** Lý do chỉ đọc khi Request đã chốt một Mentor khác (BR-DEAL-03) */
    public static final String READ_ONLY_OTHER_MENTOR = "Request đã chọn Mentor khác.";

    /** Lý do chỉ đọc khi Request đã bị hủy */
    public static final String READ_ONLY_REQUEST_CANCELLED = "Request đã bị hủy.";

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final UserProfileRepository userProfileRepository;
    private final MessageMapper messageMapper;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Lấy hoặc tạo mới Chat for Task. Tính idempotent được bảo đảm bởi khóa bi quan trên phản hồi (Request - Mentor)
     * ở tầng gọi và unique index uq_conversations_mentoring_context ở tầng cơ sở dữ liệu.
     *
     * @param request Request sở hữu cuộc hội thoại
     * @param mentor Tài khoản người dùng của Mentor
     * @return Chat for Task tương ứng
     */
    @Override
    @Transactional
    public Conversation getOrCreateConversation(MentoringRequest request, User mentor) {
        Optional<Conversation> existing = conversationRepository
                .findByMentoringRequestIdAndMentoringMentorId(request.getId(), mentor.getId());
        if (existing.isPresent()) {
            log.info("Tái sử dụng Chat for Task id={} của requestId={}, mentorUserId={}",
                    existing.get().getId(), request.getId(), mentor.getId());
            return existing.get();
        }

        User student = request.getStudent();
        Instant now = Instant.now();
        Conversation conversation = conversationRepository.save(Conversation.builder()
                .type(ConversationType.MENTORING)
                .title(request.getTitle())
                .createdBy(mentor)
                .createdAt(now)
                .lastMessageAt(now)
                .mentoringRequest(request)
                .mentoringStudent(student)
                .mentoringMentor(mentor)
                .build());

        participantRepository.saveAll(List.of(
                ConversationParticipant.builder()
                        .conversation(conversation)
                        .user(student)
                        .role(ParticipantRole.MEMBER)
                        .isAccepted(true)
                        .joinedAt(now)
                        .build(),
                ConversationParticipant.builder()
                        .conversation(conversation)
                        .user(mentor)
                        .role(ParticipantRole.MEMBER)
                        .isAccepted(true)
                        .joinedAt(now)
                        .build()
        ));

        log.info("Tạo mới Chat for Task id={} cho requestId={}, studentId={}, mentorUserId={}",
                conversation.getId(), request.getId(), student.getId(), mentor.getId());
        return conversation;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Conversation> findConversation(Long requestId, Long mentorUserId) {
        return conversationRepository.findByMentoringRequestIdAndMentoringMentorId(requestId, mentorUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public Conversation requireParticipantConversation(Long currentUserId, Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện (ID: " + conversationId + ")."));

        if (conversation.getType() != ConversationType.MENTORING || conversation.getMentoringRequest() == null) {
            throw new BadRequestException("Cuộc trò chuyện này không phải Chat for Task của một Mentoring Request.");
        }

        boolean isStudent = Objects.equals(conversation.getMentoringStudent().getId(), currentUserId);
        boolean isMentor = Objects.equals(conversation.getMentoringMentor().getId(), currentUserId);
        if (!isStudent && !isMentor) {
            log.warn("Truy cập trái phép Chat for Task id={} bởi userId={}", conversationId, currentUserId);
            throw new ForbiddenException("Bạn không phải thành viên của Chat for Task này.");
        }
        return conversation;
    }

    @Override
    public String resolveReadOnlyReason(Conversation conversation) {
        if (conversation == null || conversation.getType() != ConversationType.MENTORING) {
            return null;
        }
        MentoringRequest request = conversation.getMentoringRequest();
        if (request.getStatus() == MentoringRequestStatus.CANCELLED) {
            return READ_ONLY_REQUEST_CANCELLED;
        }
        User selectedMentor = request.getSelectedMentor();
        if (selectedMentor != null && !Objects.equals(selectedMentor.getId(), conversation.getMentoringMentor().getId())) {
            return READ_ONLY_OTHER_MENTOR;
        }
        return null;
    }

    @Override
    public void assertWritable(Conversation conversation) {
        String reason = resolveReadOnlyReason(conversation);
        if (reason != null) {
            throw new ConflictException("Chat for Task đang ở chế độ chỉ đọc: " + reason);
        }
    }

    @Override
    @Transactional
    public void postSystemMessage(Conversation conversation, User sender, String content) {
        if (conversation == null) {
            return;
        }
        Instant now = Instant.now();
        Message saved = messageRepository.save(Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(content)
                .type(MessageType.SYSTEM)
                .createdAt(now)
                .build());
        conversation.setLastMessageAt(now);
        conversationRepository.save(conversation);

        UserProfile senderProfile = userProfileRepository.findById(sender.getId()).orElse(null);
        MessageResponse response = messageMapper.toMessageResponse(saved, senderProfile);
        List<Long> recipientIds = participantRepository.findByConversationId(conversation.getId()).stream()
                .map(p -> p.getUser().getId())
                .toList();

        // Chỉ đẩy realtime sau khi dữ liệu đã commit để client refetch luôn thấy trạng thái nghiệp vụ mới nhất
        Runnable push = () -> recipientIds.forEach(userId -> {
            try {
                messagingTemplate.convertAndSendToUser(userId.toString(), WebSocketDestinations.USER_QUEUE_MESSAGES, response);
            } catch (Exception ex) {
                log.error("WebSocket push tin nhắn hệ thống thất bại cho userId={}: {}", userId, ex.getMessage());
            }
        });
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    push.run();
                }
            });
        } else {
            push.run();
        }
    }

    @Override
    public String displayName(User user) {
        if (user == null) {
            return "Người dùng";
        }
        UserProfile profile = userProfileRepository.findById(user.getId()).orElse(null);
        if (profile != null && profile.getFullName() != null && !profile.getFullName().isBlank()) {
            return profile.getFullName();
        }
        return user.getEmail();
    }
}
