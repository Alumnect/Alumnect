package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestDistributionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskPaymentRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringConversationResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestDistribution;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringTaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

/**
 * Cài đặt truy vấn ngữ cảnh Chat for Task. Toàn bộ quyền thao tác được tính ở backend từ trạng thái
 * trong cơ sở dữ liệu (không dựa vào nội dung tin nhắn hệ thống); frontend chỉ dùng để hiển thị.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringChatContextServiceImpl implements MentoringChatContextService {

    private final MentoringConversationService conversationService;
    private final MentoringDealService dealService;
    private final MentoringRequestRepository requestRepository;
    private final MentoringRequestDistributionRepository distributionRepository;
    private final MentoringTaskPaymentRepository paymentRepository;
    private final ConversationRepository conversationRepository;
    private final UserProfileRepository userProfileRepository;
    private final MentoringTaskMapper taskMapper;

    @Override
    @Transactional(readOnly = true)
    public MentoringConversationResponse getConversationContext(Long currentUserId, Long conversationId) {
        Conversation conversation = conversationService.requireParticipantConversation(currentUserId, conversationId);
        return buildContext(conversation, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringConversationResponse> getConversationsByRequest(Long currentUserId, Long requestId) {
        MentoringRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));
        boolean isOwner = Objects.equals(request.getStudent().getId(), currentUserId);

        List<Conversation> conversations = conversationRepository.findByMentoringRequestIdOrderByCreatedAtAsc(requestId).stream()
                .filter(c -> isOwner || Objects.equals(c.getMentoringMentor().getId(), currentUserId))
                .toList();
        if (!isOwner && conversations.isEmpty()) {
            throw new ForbiddenException("Bạn không có quyền xem các Chat for Task của Request này.");
        }
        return conversations.stream().map(c -> buildContext(c, currentUserId)).toList();
    }

    private MentoringConversationResponse buildContext(Conversation conversation, Long currentUserId) {
        MentoringRequest request = conversation.getMentoringRequest();
        User student = conversation.getMentoringStudent();
        User mentor = conversation.getMentoringMentor();
        boolean isMentor = Objects.equals(mentor.getId(), currentUserId);

        UserProfile studentProfile = userProfileRepository.findById(student.getId()).orElse(null);
        UserProfile mentorProfile = userProfileRepository.findById(mentor.getId()).orElse(null);
        MentoringRequestDistribution distribution = distributionRepository
                .findByRequestIdAndMentorUserId(request.getId(), mentor.getId()).orElse(null);

        String readOnlyReason = conversationService.resolveReadOnlyReason(conversation);
        boolean writable = readOnlyReason == null;
        boolean requestOpen = request.getStatus() == MentoringRequestStatus.OPEN && request.getSelectedMentor() == null;
        boolean mentorAccepted = distribution != null && distribution.getStatus() == MentoringDistributionStatus.ACCEPTED;

        MentoringDealDetailResponse deal = dealService.getDealByConversation(currentUserId, conversation.getId());
        boolean dealLocked = deal != null && Boolean.TRUE.equals(deal.getDeal().getIsLocked());
        boolean canCreateDealTicket = isMentor && writable && requestOpen && mentorAccepted && !dealLocked;

        String acceptByRequestUnavailableReason = null;
        BigDecimal requestPrice = request.getBudgetMax() != null ? request.getBudgetMax() : request.getBudgetMin();
        if (requestPrice == null) {
            acceptByRequestUnavailableReason = "Request chưa có mức ngân sách đề xuất.";
        } else if (request.getExpectedDeadline() == null || !request.getExpectedDeadline().isAfter(Instant.now())) {
            acceptByRequestUnavailableReason = "Request không có thời hạn mong muốn hợp lệ trong tương lai.";
        }

        MentoringTaskPaymentStatusResponse latestPayment = deal == null ? null
                : paymentRepository.findByDealIdOrderByCreatedAtDesc(deal.getDeal().getId()).stream()
                        .findFirst()
                        .map(taskMapper::toStatusResponse)
                        .orElse(null);

        MentoringTask task = conversation.getMentoringTask();
        Long selectedMentorUserId = request.getSelectedMentor() != null ? request.getSelectedMentor().getId() : null;

        return MentoringConversationResponse.builder()
                .conversationId(conversation.getId())
                .myRole(isMentor ? "MENTOR" : "STUDENT")
                .requestId(request.getId())
                .requestTitle(request.getTitle())
                .requestDescription(request.getDescription())
                .requestType(request.getRequestType())
                .requestStatus(request.getStatus())
                .industryName(request.getIndustry() != null ? request.getIndustry().getName() : null)
                .budgetMin(request.getBudgetMin())
                .budgetMax(request.getBudgetMax())
                .expectedDeadline(request.getExpectedDeadline())
                .workingMode(request.getWorkingMode())
                .participationType(request.getParticipationType())
                .taskType(request.getTaskType())
                .studentId(student.getId())
                .studentName(studentProfile != null && studentProfile.getFullName() != null ? studentProfile.getFullName() : student.getEmail())
                .studentAvatar(studentProfile != null ? studentProfile.getAvatarUrl() : null)
                .mentorUserId(mentor.getId())
                .mentorProfileId(distribution != null ? distribution.getMentorProfile().getId() : null)
                .mentorName(mentorProfile != null && mentorProfile.getFullName() != null ? mentorProfile.getFullName() : mentor.getEmail())
                .mentorAvatar(mentorProfile != null ? mentorProfile.getAvatarUrl() : null)
                .responseStatus(distribution != null ? toBusinessStatus(distribution.getStatus()) : null)
                .respondedAt(distribution != null ? distribution.getRespondedAt() : null)
                .selectedMentorUserId(selectedMentorUserId)
                .confirmedDealId(request.getConfirmedDeal() != null ? request.getConfirmedDeal().getId() : null)
                .selectedMentor(Objects.equals(selectedMentorUserId, mentor.getId()))
                .readOnly(!writable)
                .readOnlyReason(readOnlyReason)
                .deal(deal)
                .latestPayment(latestPayment)
                .taskId(task != null ? task.getId() : null)
                .taskStatus(task != null ? task.getStatus() : null)
                .canSendMessage(writable)
                .canCreateDealTicket(canCreateDealTicket)
                .canAcceptDealByRequest(canCreateDealTicket && acceptByRequestUnavailableReason == null)
                .acceptByRequestUnavailableReason(acceptByRequestUnavailableReason)
                .build();
    }

    /** Ánh xạ trạng thái phân phối sang thuật ngữ nghiệp vụ: PENDING→WAITING, REJECTED→DECLINED */
    private String toBusinessStatus(MentoringDistributionStatus status) {
        if (status == null) {
            return "WAITING";
        }
        return switch (status) {
            case ACCEPTED -> "ACCEPTED";
            case REJECTED -> "DECLINED";
            case EXPIRED -> "EXPIRED";
            default -> "WAITING";
        };
    }
}
