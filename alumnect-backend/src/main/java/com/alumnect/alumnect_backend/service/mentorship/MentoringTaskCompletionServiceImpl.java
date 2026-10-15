package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringCompletionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskCompletionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondTaskCompletionRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.SubmitTaskCompletionRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringParticipantResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskCompletionResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskCompletion;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Triển khai dịch vụ nộp và nghiệm thu hoàn thành Mentoring Task (UC110).
 * Quản lý vòng đời nghiệm thu sản phẩm cuối cùng, chuyển giao trạng thái Task
 * và tự động kích hoạt quyết toán thù lao cho Mentor sau khi Student xác nhận.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringTaskCompletionServiceImpl implements MentoringTaskCompletionService {
    private final MentoringGroupService mentoringGroupService;

    private final MentoringTaskRepository taskRepository;
    private final MentoringTaskCompletionRepository completionRepository;
    private final UserRepository userRepository;
    private final MentoringConversationService mentoringConversationService;
    private final MentoringDisbursementService disbursementService;
    private final MentorReputationService mentorReputationService;
    private final MentoringTaskProposalCleaner proposalCleaner;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public MentoringTaskCompletionResponse submitCompletion(
            Long currentUserId, Long taskId, SubmitTaskCompletionRequest request) {

        log.info("Mentor (userId={}) yêu cầu nộp kết quả hoàn thành cho Task id={}", currentUserId, taskId);

        MentoringTask task = requireTask(taskId);
        User currentUser = requireUser(currentUserId);

        // 1. Kiểm tra vai trò: Phải là Mentor của Task
        if (!Objects.equals(task.getMentor().getId(), currentUserId)) {
            throw new ForbiddenException("Chỉ Cố vấn (Mentor) phụ trách nhiệm vụ này mới có quyền nộp kết quả nghiệm thu.");
        }

        // 2. Kiểm tra trạng thái Task: Không được nộp khi đã hoàn thành, đã hủy hoặc đang tranh chấp
        if (task.getStatus() == MentoringTaskStatus.COMPLETED) {
            throw new ConflictException("Nhiệm vụ này đã được nghiệm thu và hoàn thành trước đó.");
        }
        if (task.getStatus() == MentoringTaskStatus.CANCELLED) {
            throw new ConflictException("Nhiệm vụ đã bị hủy bỏ, không thể nộp kết quả.");
        }
        if (task.getStatus() == MentoringTaskStatus.DISPUTED) {
            throw new ConflictException("Nhiệm vụ đang có tranh chấp khiếu nại, không thể nộp kết quả nghiệm thu.");
        }

        // 3. Nếu đã có lần nộp PENDING trước đó, đánh dấu SUPERSEDED để thay thế bằng lần nộp mới
        completionRepository.findFirstByTaskIdAndStatusOrderByCreatedAtDesc(task.getId(), MentoringCompletionStatus.PENDING)
                .ifPresent(prev -> {
                    prev.setStatus(MentoringCompletionStatus.SUPERSEDED);
                    completionRepository.save(prev);
                });

        // 4. Tạo bản ghi nghiệm thu mới
        String attachmentUrlsStr = request.getAttachmentUrls() != null && !request.getAttachmentUrls().isEmpty()
                ? String.join(",", request.getAttachmentUrls())
                : null;

        MentoringTaskCompletion completion = MentoringTaskCompletion.builder()
                .task(task)
                .conversation(task.getConversation())
                .submittedBy(currentUser)
                .finalSummary(request.getFinalSummary().trim())
                .deliverables(request.getDeliverables() != null ? request.getDeliverables().trim() : null)
                .attachmentUrls(attachmentUrlsStr)
                .status(MentoringCompletionStatus.PENDING)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        MentoringTaskCompletion savedCompletion = completionRepository.save(completion);

        // 5. Cập nhật trạng thái Task sang SUBMITTED (Chờ nghiệm thu)
        task.setStatus(MentoringTaskStatus.SUBMITTED);
        taskRepository.save(task);

        // 6. Gửi tin nhắn hệ thống vào Chat for Task
        if (task.getConversation() != null) {
            StringBuilder msg = new StringBuilder();
            msg.append("🚀 [Cố vấn] đã nộp kết quả hoàn thành Task (Chờ nghiệm thu):\n");
            msg.append("📝 Kết quả: ").append(savedCompletion.getFinalSummary());
            if (savedCompletion.getDeliverables() != null && !savedCompletion.getDeliverables().isBlank()) {
                msg.append("\n📦 Sản phẩm bàn giao: ").append(savedCompletion.getDeliverables());
            }
            mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg.toString());
        }

        notificationService.sendMentoringTaskEventNotification(
                currentUser,
                task.getStudent(),
                task,
                "COMPLETION_REVIEW",
                String.valueOf(savedCompletion.getId()),
                "Task đang chờ bạn nghiệm thu",
                "Mentor đã nộp kết quả hoàn thành. Vui lòng xem và xác nhận Task.");

        log.info("Nộp kết quả hoàn thành Task id={} thành công, completionId={}", taskId, savedCompletion.getId());
        return toCompletionResponse(savedCompletion, currentUserId);
    }

    @Override
    @Transactional
    public MentoringTaskCompletionResponse respondCompletion(
            Long currentUserId, Long taskId, Long completionId, RespondTaskCompletionRequest request) {

        log.info("Student (userId={}) phản hồi nghiệm thu kết quả Task id={}, completionId={}, accept={}",
                currentUserId, taskId, completionId, request.getAccept());

        MentoringTask task = requireTask(taskId);
        User currentUser = requireUser(currentUserId);

        // 1. Kiểm tra vai trò: Phải là Student của Task
        if (!Objects.equals(task.getStudent().getId(), currentUserId)) {
            throw new ForbiddenException("Chỉ Học viên (Student) của nhiệm vụ này mới có quyền nghiệm thu và xác nhận hoàn thành.");
        }

        // 2. Kiểm tra bản ghi completion
        MentoringTaskCompletion completion = completionRepository.findById(completionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biên bản nghiệm thu với ID: " + completionId));

        if (!Objects.equals(completion.getTask().getId(), taskId)) {
            throw new BadRequestException("Biên bản nghiệm thu không thuộc về nhiệm vụ Task được chỉ định.");
        }

        if (completion.getStatus() != MentoringCompletionStatus.PENDING) {
            throw new ConflictException("Biên bản nghiệm thu này không ở trạng thái chờ phản hồi (PENDING).");
        }

        Instant now = Instant.now();
        completion.setRespondedBy(currentUser);
        completion.setRespondedAt(now);

        if (Boolean.TRUE.equals(request.getAccept())) {
            // =========================================================================
            // CHẤP NHẬN NGHIỆM THU: TASK CHUYỂN SANG COMPLETED VÀ TỰ ĐỘNG TẠO PAYOUT
            // =========================================================================
            completion.setStatus(MentoringCompletionStatus.CONFIRMED);
            completion.setFeedbackNote(request.getFeedbackNote() != null ? request.getFeedbackNote().trim() : null);

            task.setStatus(MentoringTaskStatus.COMPLETED);
            task.setCompletedAt(now);
            taskRepository.save(task);
            mentorReputationService.recordTaskCompleted(task.getMentor());
            proposalCleaner.closeOpenProposals(task.getId(), "Task đã hoàn thành");
            completionRepository.save(completion);

            // Tự động kích hoạt tạo quyết toán thù lao cho Mentor (mục 5.9 UC110)
            try {
                disbursementService.disbursePayout(
                        currentUserId,
                        task.getId(),
                        "Tự động quyết toán thù lao hoàn thành Task #" + task.getId()
                );
                log.info("Đã tạo lệnh Payout tự động thành công cho Task id={}", task.getId());
            } catch (Exception ex) {
                // Task hoàn thành không đồng nghĩa payout đã thành công; trạng thái quyết toán theo dõi riêng (UC110)
                log.warn("Tự động tạo lệnh Payout thù lao cho Task id={} ghi nhận cảnh báo: {}",
                        task.getId(), ex.getMessage());
            }

            // Gửi tin nhắn hệ thống thông báo nghiệm thu hoàn tất
            if (task.getConversation() != null) {
                String noteSuffix = (completion.getFeedbackNote() != null && !completion.getFeedbackNote().isBlank())
                        ? "\n💬 Đánh giá: " + completion.getFeedbackNote()
                        : "";
                String msg = "🎉 [Học viên] đã XÁC NHẬN hoàn thành Task! Nhiệm vụ chính thức nghiệm thu thành công và hệ thống đã kích hoạt lệnh quyết toán thù lao cho Cố vấn." + noteSuffix;
                mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);
            }

            notificationService.sendMentoringTaskEventNotification(
                    currentUser,
                    task.getMentor(),
                    task,
                    "COMPLETED",
                    String.valueOf(completion.getId()),
                    "Task đã hoàn thành",
                    "Học viên đã xác nhận nghiệm thu. Task đã hoàn thành và chuyển sang quyết toán.");

        } else {
            // =========================================================================
            // TỪ CHỐI / YÊU CẦU ĐIỀU CHỈNH: TASK QUAY VỀ IN_PROGRESS ĐỂ MENTOR BỔ SUNG
            // =========================================================================
            completion.setStatus(MentoringCompletionStatus.REJECTED);
            String feedback = (request.getFeedbackNote() != null && !request.getFeedbackNote().isBlank())
                    ? request.getFeedbackNote().trim()
                    : "Chưa đạt yêu cầu nghiệm thu bàn giao";
            completion.setFeedbackNote(feedback);

            task.setStatus(MentoringTaskStatus.IN_PROGRESS);
            taskRepository.save(task);
            completionRepository.save(completion);

            // Gửi tin nhắn hệ thống thông báo yêu cầu bổ sung
            if (task.getConversation() != null) {
                String msg = String.format("⚠️ [Học viên] chưa đồng ý nghiệm thu và yêu cầu chỉnh sửa/bổ sung.\nLý do / Yêu cầu: %s", feedback);
                mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);
            }

            notificationService.sendMentoringTaskEventNotification(
                    currentUser,
                    task.getMentor(),
                    task,
                    "COMPLETION_REVISION",
                    String.valueOf(completion.getId()),
                    "Cần bổ sung kết quả Task",
                    "Học viên chưa xác nhận nghiệm thu và đã gửi yêu cầu chỉnh sửa.");
        }

        return toCompletionResponse(completion, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringTaskCompletionResponse getLatestCompletion(Long currentUserId, Long taskId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        return completionRepository.findFirstByTaskIdOrderByCreatedAtDesc(task.getId())
                .map(c -> toCompletionResponse(c, currentUserId))
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringTaskCompletionResponse> getCompletionHistory(Long currentUserId, Long taskId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        return completionRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                .map(c -> toCompletionResponse(c, currentUserId))
                .toList();
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private MentoringTask requireTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhiệm vụ Mentoring Task với ID: " + taskId));
    }

    private MentoringTask requireParticipantTask(Long taskId, Long currentUserId) {
        MentoringTask task = requireTask(taskId);
        boolean isStudent = Objects.equals(task.getStudent().getId(), currentUserId);
        boolean isMentor = Objects.equals(task.getMentor().getId(), currentUserId);
        if (!isStudent && !isMentor && !mentoringGroupService.isActiveMember(task.getRequest(), currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập thông tin nghiệm thu của nhiệm vụ này.");
        }
        return task;
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
    }

    private MentoringTaskCompletionResponse toCompletionResponse(MentoringTaskCompletion c, Long currentUserId) {
        MentoringTask task = c.getTask();
        boolean isStudent = Objects.equals(task.getStudent().getId(), currentUserId);
        boolean canConfirm = isStudent && c.getStatus() == MentoringCompletionStatus.PENDING;

        List<String> attachmentUrls = (c.getAttachmentUrls() != null && !c.getAttachmentUrls().isBlank())
                ? Arrays.asList(c.getAttachmentUrls().split(","))
                : Collections.emptyList();

        return MentoringTaskCompletionResponse.builder()
                .id(c.getId())
                .taskId(task.getId())
                .conversationId(c.getConversation() != null ? c.getConversation().getId() : null)
                .submittedBy(toParticipantResponse(c.getSubmittedBy(), "MENTOR"))
                .finalSummary(c.getFinalSummary())
                .deliverables(c.getDeliverables())
                .attachmentUrls(attachmentUrls)
                .status(c.getStatus())
                .respondedBy(toParticipantResponse(c.getRespondedBy(), "STUDENT"))
                .respondedAt(c.getRespondedAt())
                .feedbackNote(c.getFeedbackNote())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .canConfirm(canConfirm)
                .build();
    }

    private MentoringParticipantResponse toParticipantResponse(User user, String fallbackRole) {
        if (user == null) return null;
        UserProfile p = user.getProfile();
        String fullName = p != null && p.getFullName() != null ? p.getFullName() : user.getEmail();
        String avatarUrl = p != null ? p.getAvatarUrl() : null;
        String bio = p != null ? p.getBiography() : null;
        String headline = p != null && p.getHeadline() != null && !p.getHeadline().isBlank()
                ? p.getHeadline()
                : (p != null && p.getMajor() != null ? p.getMajor().getName() : fallbackRole);

        return MentoringParticipantResponse.builder()
                .id(user.getId())
                .fullName(fullName)
                .avatarUrl(avatarUrl)
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().getName() : fallbackRole)
                .headline(headline)
                .bio(bio)
                .build();
    }
}
