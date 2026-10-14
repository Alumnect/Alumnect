package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringSettlementProposalStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.common.enums.WorkLogStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskPaymentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.*;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskPayment;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringTaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

/**
 * Triển khai dịch vụ quản lý và truy vấn Mentoring Task (UC105 & UC106).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringTaskServiceImpl implements MentoringTaskService {

    private final MentoringTaskRepository taskRepository;
    private final MentoringTaskPaymentRepository paymentRepository;
    private final MentoringWorkLogRepository workLogRepository;
    private final MentoringTaskMapper taskMapper;
    private final MentoringWorkLogService workLogService;
    private final MentoringTaskResolutionService resolutionService;
    private final MentoringTaskCompletionService completionService;
    private final MentoringTicketService ticketService;

    @Override
    @Transactional(readOnly = true)
    public MentoringTaskDetailResponse getTaskDetail(Long currentUserId, Long taskId) {
        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));

        verifyParticipant(task, currentUserId);

        return buildTaskDetailResponse(task, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringTaskResponse getTaskSummary(Long currentUserId, Long taskId) {
        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));

        verifyParticipant(task, currentUserId);

        MentoringTaskResponse response = taskMapper.toTaskResponse(task);
        enrichTaskSummary(task, response);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringTaskDetailResponse getTaskByDealId(Long currentUserId, Long dealId) {
        MentoringTask task = taskRepository.findByDealId(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Chưa có Mentoring Task nào được kích hoạt cho Deal ID: " + dealId));

        verifyParticipant(task, currentUserId);

        return buildTaskDetailResponse(task, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MentoringTaskResponse> getMyTasks(Long currentUserId, String stage, MentoringTaskStatus status, Pageable pageable) {
        Page<MentoringTask> pageResult;

        if (status != null) {
            pageResult = taskRepository.findByParticipantAndStatus(currentUserId, status, pageable);
        } else if (stage != null && !stage.isBlank() && !"ALL".equalsIgnoreCase(stage.trim())) {
            String normalizedStage = stage.trim().toUpperCase();
            List<MentoringTaskStatus> stageStatuses = resolveStatusesForStage(normalizedStage);
            if (!stageStatuses.isEmpty()) {
                pageResult = taskRepository.findByParticipantAndStatusIn(currentUserId, stageStatuses, pageable);
            } else {
                pageResult = taskRepository.findByParticipant(currentUserId, pageable);
            }
        } else {
            pageResult = taskRepository.findByParticipant(currentUserId, pageable);
        }

        List<MentoringTaskResponse> content = pageResult.getContent().stream()
                .map(task -> {
                    MentoringTaskResponse res = taskMapper.toTaskResponse(task);
                    enrichTaskSummary(task, res);
                    return res;
                })
                .toList();

        return PageResponse.<MentoringTaskResponse>builder()
                .content(content)
                .pageNumber(pageResult.getNumber())
                .pageSize(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();
    }

    private void verifyParticipant(MentoringTask task, Long currentUserId) {
        if (!task.getStudent().getId().equals(currentUserId) && !task.getMentor().getId().equals(currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập thông tin của Mentoring Task này.");
        }
    }

    private List<MentoringTaskStatus> resolveStatusesForStage(String stage) {
        return switch (stage) {
            case "PREPARATION" -> List.of(MentoringTaskStatus.PREPARATION);
            case "IN_PROGRESS" -> List.of(MentoringTaskStatus.IN_PROGRESS);
            case "ENDING" -> List.of(
                    MentoringTaskStatus.SUBMITTED,
                    MentoringTaskStatus.COMPLETED,
                    MentoringTaskStatus.CANCELLED,
                    MentoringTaskStatus.DISPUTED
            );
            default -> Collections.emptyList();
        };
    }

    private String resolveUiStage(MentoringTaskStatus status) {
        if (status == null) {
            return "PREPARATION";
        }
        return switch (status) {
            case PREPARATION -> "PREPARATION";
            case IN_PROGRESS -> "IN_PROGRESS";
            case SUBMITTED, COMPLETED, CANCELLED, DISPUTED -> "ENDING";
        };
    }

    private Integer calculateProgress(MentoringTaskStatus status, long totalLogs, long confirmedLogs, long pendingLogs) {
        if (status == null) return 0;
        return switch (status) {
            case COMPLETED -> 100;
            case CANCELLED -> 0;
            case DISPUTED -> 50;
            case SUBMITTED -> 85;
            case PREPARATION -> 15;
            case IN_PROGRESS -> {
                int base = 30;
                int dynamic = (int) (confirmedLogs * 15 + pendingLogs * 5);
                yield Math.min(80, base + dynamic);
            }
        };
    }

    private void enrichTaskSummary(MentoringTask task, MentoringTaskResponse res) {
        long totalLogs = workLogRepository.countByTaskId(task.getId());
        long confirmedLogs = workLogRepository.countByTaskIdAndStatus(task.getId(), WorkLogStatus.CONFIRMED);
        long pendingLogs = workLogRepository.countByTaskIdAndStatus(task.getId(), WorkLogStatus.PENDING_CONFIRMATION);

        String uiStage = resolveUiStage(task.getStatus());
        int progress = calculateProgress(task.getStatus(), totalLogs, confirmedLogs, pendingLogs);

        res.setUiStage(uiStage);
        res.setProgressPercentage(progress);
        res.setTotalWorkLogs(totalLogs);
        res.setPendingWorkLogs(pendingLogs);
        res.setConfirmedWorkLogs(confirmedLogs);

        if (task.getDeal() != null && Boolean.TRUE.equals(task.getDeal().getIsPaid())) {
            res.setPaymentStatus("PAID");
        } else {
            res.setPaymentStatus("PENDING");
        }
    }

    private MentoringTaskDetailResponse buildTaskDetailResponse(MentoringTask task, Long currentUserId) {
        Instant now = Instant.now();
        Instant deadline = task.getDeadline();
        long daysRemaining = deadline != null ? Duration.between(now, deadline).toDays() : 0L;
        boolean isOverdue = deadline != null && now.isAfter(deadline) && task.getStatus() != MentoringTaskStatus.COMPLETED;

        long totalLogs = workLogRepository.countByTaskId(task.getId());
        long confirmedLogs = workLogRepository.countByTaskIdAndStatus(task.getId(), WorkLogStatus.CONFIRMED);
        long pendingLogs = workLogRepository.countByTaskIdAndStatus(task.getId(), WorkLogStatus.PENDING_CONFIRMATION);

        String uiStage = resolveUiStage(task.getStatus());
        int progress = calculateProgress(task.getStatus(), totalLogs, confirmedLogs, pendingLogs);

        // 1. Overview
        MentoringTaskOverviewResponse overview = MentoringTaskOverviewResponse.builder()
                .id(task.getId())
                .taskTitle(task.getTaskTitle())
                .taskScope(task.getTaskScope())
                .agreedPrice(task.getAgreedPrice())
                .status(task.getStatus())
                .uiStage(uiStage)
                .progressPercentage(progress)
                .workingMode(task.getWorkingMode())
                .participationType(task.getParticipationType())
                .taskType(task.getTaskType())
                .startedAt(task.getStartedAt())
                .deadline(task.getDeadline())
                .completedAt(task.getCompletedAt())
                .daysRemaining(daysRemaining)
                .isOverdue(isOverdue)
                .totalWorkLogs(totalLogs)
                .confirmedWorkLogs(confirmedLogs)
                .pendingWorkLogs(pendingLogs)
                .build();

        // 2. Deal Information
        MentoringDeal deal = task.getDeal();
        MentoringDealSummaryResponse dealSummary = null;
        if (deal != null) {
            dealSummary = MentoringDealSummaryResponse.builder()
                    .id(deal.getId())
                    .agreedPrice(deal.getAgreedPrice())
                    .taskScope(deal.getTaskScope())
                    .deadline(deal.getDeadline())
                    .workingMode(deal.getWorkingMode())
                    .participationType(deal.getParticipationType())
                    .taskType(deal.getTaskType())
                    .expectedResult(deal.getExpectedResult())
                    .version(deal.getVersion())
                    .isPaid(deal.getIsPaid())
                    .paidAt(deal.getPaidAt())
                    .build();
        }

        // 3. Participants
        MentoringParticipantResponse student = toParticipantResponse(task.getStudent(), "STUDENT");
        MentoringParticipantResponse mentor = toParticipantResponse(task.getMentor(), "MENTOR");

        // 4. Payment Information
        MentoringPaymentSummaryResponse paymentSummary = null;
        if (deal != null) {
            Optional<MentoringTaskPayment> paymentOpt = paymentRepository.findFirstByDealIdAndPaymentStatus(deal.getId(), PaymentStatus.PAID);
            if (paymentOpt.isEmpty()) {
                paymentOpt = paymentRepository.findFirstByDealIdAndPaymentStatusOrderByCreatedAtDesc(deal.getId(), PaymentStatus.PENDING);
            }
            if (paymentOpt.isPresent()) {
                MentoringTaskPayment p = paymentOpt.get();
                paymentSummary = MentoringPaymentSummaryResponse.builder()
                        .paymentId(p.getId())
                        .orderCode(p.getOrderCode())
                        .amount(p.getAmount())
                        .paymentStatus(p.getPaymentStatus())
                        .paymentMethod(p.getPaymentMethod())
                        .paidAt(p.getPaidAt())
                        .accountNumber(p.getAccountNumber())
                        .accountName(p.getAccountName())
                        .build();
            }
        }

        // 5. Work Logs
        List<MentoringWorkLogResponse> workLogs = workLogService.getWorkLogsByTaskId(currentUserId, task.getId());

        // 6. Task History Timeline
        List<MentoringTaskHistoryEventResponse> history = buildTaskHistory(task, workLogs);

        // 7. Available Actions / Permissions
        boolean isStudent = task.getStudent().getId().equals(currentUserId);
        boolean isMentor = task.getMentor().getId().equals(currentUserId);
        boolean isReadOnly = task.getStatus() == MentoringTaskStatus.COMPLETED
                || task.getStatus() == MentoringTaskStatus.CANCELLED
                || task.getStatus() == MentoringTaskStatus.DISPUTED;
        boolean canAddWorkLog = isMentor && !isReadOnly;
        boolean canEditWorkLog = isMentor && !isReadOnly && workLogs.stream().anyMatch(w -> Boolean.TRUE.equals(w.getCanEdit()));
        boolean canConfirmWorkLog = isStudent && !isReadOnly && workLogs.stream().anyMatch(w -> w.getStatus() == WorkLogStatus.PENDING_CONFIRMATION);

        boolean canRequestExtension = (isStudent || isMentor) && !isReadOnly;
        boolean canRequestAmendment = (isStudent || isMentor) && !isReadOnly;
        boolean canProposeSettlement = (isStudent || isMentor) && !isReadOnly;
        boolean canSubmitCompletion = isMentor && (task.getStatus() == MentoringTaskStatus.IN_PROGRESS || task.getStatus() == MentoringTaskStatus.PREPARATION);
        boolean canConfirmCompletion = isStudent && task.getStatus() == MentoringTaskStatus.SUBMITTED;

        MentoringTaskDeadlineExtensionResponse activeExtension = resolutionService.getActiveExtension(currentUserId, task.getId());
        MentoringTaskAmendmentResponse activeAmendment = resolutionService.getActiveAmendment(currentUserId, task.getId());
        MentoringTaskSettlementProposalResponse activeSettlementProposal = resolutionService.getActiveSettlementProposal(currentUserId, task.getId());
        MentoringTaskCompletionResponse latestCompletion = completionService.getLatestCompletion(currentUserId, task.getId());
        MentoringDisputeTicketResponse activeTicket = ticketService.getActiveTicket(currentUserId, task.getId());

        boolean canSubmitSettlementTicket = (isStudent || isMentor)
                && activeSettlementProposal != null
                && activeSettlementProposal.getStatus() == MentoringSettlementProposalStatus.ACCEPTED
                && activeTicket == null;

        boolean canCreateDisputeTicket = (isStudent || isMentor)
                && task.getStatus() != MentoringTaskStatus.COMPLETED
                && activeTicket == null;

        boolean canSubmitDisputeEvidence = (isStudent || isMentor)
                && activeTicket != null
                && (activeTicket.getStatus() == MentoringTicketStatus.OPEN
                    || activeTicket.getStatus() == MentoringTicketStatus.IN_REVIEW);

        MentoringTaskActionPermissionsResponse permissions = MentoringTaskActionPermissionsResponse.builder()
                .canAddWorkLog(canAddWorkLog)
                .canEditWorkLog(canEditWorkLog)
                .canConfirmWorkLog(canConfirmWorkLog)
                .isReadOnly(isReadOnly)
                .isStudent(isStudent)
                .isMentor(isMentor)
                .isDisputed(task.getStatus() == MentoringTaskStatus.DISPUTED)
                .canRequestExtension(canRequestExtension)
                .canRequestAmendment(canRequestAmendment)
                .canProposeSettlement(canProposeSettlement)
                .canSubmitCompletion(canSubmitCompletion)
                .canConfirmCompletion(canConfirmCompletion)
                .canSubmitSettlementTicket(canSubmitSettlementTicket)
                .canCreateDisputeTicket(canCreateDisputeTicket)
                .canSubmitDisputeEvidence(canSubmitDisputeEvidence)
                .build();

        return MentoringTaskDetailResponse.builder()
                .overview(overview)
                .deal(dealSummary)
                .student(student)
                .mentor(mentor)
                .conversationId(task.getConversation() != null ? task.getConversation().getId() : null)
                .requestId(task.getRequest() != null ? task.getRequest().getId() : null)
                .requestTitle(task.getRequest() != null ? task.getRequest().getTitle() : null)
                .payment(paymentSummary)
                .workLogs(workLogs)
                .history(history)
                .permissions(permissions)
                .activeExtension(activeExtension)
                .activeAmendment(activeAmendment)
                .activeSettlementProposal(activeSettlementProposal)
                .latestCompletion(latestCompletion)
                .activeTicket(activeTicket)
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

    private List<MentoringTaskHistoryEventResponse> buildTaskHistory(MentoringTask task, List<MentoringWorkLogResponse> workLogs) {
        List<MentoringTaskHistoryEventResponse> events = new ArrayList<>();

        // Sự kiện: Kích hoạt Task sau thanh toán
        events.add(MentoringTaskHistoryEventResponse.builder()
                .id("evt-act-" + task.getId())
                .timestamp(task.getStartedAt() != null ? task.getStartedAt() : task.getCreatedAt())
                .eventType("TASK_ACTIVATED")
                .title("Kích hoạt nhiệm vụ Mentoring")
                .description("Học viên hoàn tất thanh toán " + task.getAgreedPrice() + " VNĐ. Nhiệm vụ chính thức bắt đầu.")
                .actorName(task.getStudent().getProfile() != null ? task.getStudent().getProfile().getFullName() : "Học viên")
                .actorRole("STUDENT")
                .build());

        // Các sự kiện Work Log
        for (MentoringWorkLogResponse log : workLogs) {
            String shortDesc = log.getDescription() != null && log.getDescription().length() > 60
                    ? log.getDescription().substring(0, 57) + "..."
                    : log.getDescription();

            events.add(MentoringTaskHistoryEventResponse.builder()
                    .id("evt-log-create-" + log.getId())
                    .timestamp(log.getCreatedAt())
                    .eventType("WORK_LOG_SUBMITTED")
                    .title("Gửi nhật ký ngày " + log.getLogDate())
                    .description("Mentor gửi báo cáo: " + shortDesc)
                    .actorName(log.getMentorName() != null ? log.getMentorName() : "Mentor")
                    .actorRole("MENTOR")
                    .build());

            if (log.getUpdatedAt() != null && log.getCreatedAt() != null
                    && Duration.between(log.getCreatedAt(), log.getUpdatedAt()).abs().toSeconds() > 2) {
                events.add(MentoringTaskHistoryEventResponse.builder()
                        .id("evt-log-upd-" + log.getId())
                        .timestamp(log.getUpdatedAt())
                        .eventType("WORK_LOG_UPDATED")
                        .title("Cập nhật nhật ký ngày " + log.getLogDate())
                        .description("Mentor đã chỉnh sửa nội dung/minh chứng báo cáo.")
                        .actorName(log.getMentorName() != null ? log.getMentorName() : "Mentor")
                        .actorRole("MENTOR")
                        .build());
            }

            if (log.getStatus() == WorkLogStatus.CONFIRMED && log.getConfirmedAt() != null) {
                events.add(MentoringTaskHistoryEventResponse.builder()
                        .id("evt-log-conf-" + log.getId())
                        .timestamp(log.getConfirmedAt())
                        .eventType("WORK_LOG_CONFIRMED")
                        .title("Xác nhận nghiệm thu nhật ký ngày " + log.getLogDate())
                        .description("Học viên đã nghiệm thu phần công việc này.")
                        .actorName(task.getStudent().getProfile() != null ? task.getStudent().getProfile().getFullName() : "Học viên")
                        .actorRole("STUDENT")
                        .build());
            } else if (log.getStatus() == WorkLogStatus.REJECTED && log.getStudentFeedback() != null) {
                events.add(MentoringTaskHistoryEventResponse.builder()
                        .id("evt-log-clarif-" + log.getId())
                        .timestamp(log.getUpdatedAt() != null ? log.getUpdatedAt() : log.getCreatedAt())
                        .eventType("WORK_LOG_CLARIFICATION_REQUESTED")
                        .title("Yêu cầu điều chỉnh nhật ký ngày " + log.getLogDate())
                        .description("Học viên yêu cầu làm rõ: " + (log.getStudentFeedback().length() > 60 ? log.getStudentFeedback().substring(0, 57) + "..." : log.getStudentFeedback()))
                        .actorName(task.getStudent().getProfile() != null ? task.getStudent().getProfile().getFullName() : "Học viên")
                        .actorRole("STUDENT")
                        .build());
            }

            if (log.getRevisionNumber() != null && log.getRevisionNumber() > 1) {
                events.add(MentoringTaskHistoryEventResponse.builder()
                        .id("evt-log-resub-" + log.getId() + "-rev" + log.getRevisionNumber())
                        .timestamp(log.getUpdatedAt() != null ? log.getUpdatedAt() : log.getCreatedAt())
                        .eventType("WORK_LOG_RESUBMITTED")
                        .title("Cập nhật lại nhật ký ngày " + log.getLogDate() + " (v" + log.getRevisionNumber() + ")")
                        .description("Mentor đã cập nhật nội dung giải trình và tài liệu theo yêu cầu của học viên.")
                        .actorName(log.getMentorName() != null ? log.getMentorName() : "Mentor")
                        .actorRole("MENTOR")
                        .build());
            }
        }

        if (task.getStatus() == MentoringTaskStatus.COMPLETED) {
            events.add(MentoringTaskHistoryEventResponse.builder()
                    .id("evt-complete-" + task.getId())
                    .timestamp(task.getCompletedAt() != null ? task.getCompletedAt() : task.getUpdatedAt())
                    .eventType("TASK_COMPLETED")
                    .title("Nhiệm vụ hoàn thành")
                    .description("Toàn bộ nội dung công việc đã hoàn thành và nghiệm thu thành công.")
                    .actorName("Hệ thống")
                    .actorRole("SYSTEM")
                    .build());
        } else if (task.getStatus() == MentoringTaskStatus.CANCELLED) {
            events.add(MentoringTaskHistoryEventResponse.builder()
                    .id("evt-cancel-" + task.getId())
                    .timestamp(task.getUpdatedAt())
                    .eventType("TASK_CANCELLED")
                    .title("Nhiệm vụ đã bị hủy")
                    .description("Nhiệm vụ Mentoring đã dừng lại.")
                    .actorName("Hệ thống")
                    .actorRole("SYSTEM")
                    .build());
        } else if (task.getStatus() == MentoringTaskStatus.DISPUTED) {
            events.add(MentoringTaskHistoryEventResponse.builder()
                    .id("evt-dispute-" + task.getId())
                    .timestamp(task.getUpdatedAt())
                    .eventType("TASK_DISPUTED")
                    .title("Nhiệm vụ có khiếu nại")
                    .description("Nhiệm vụ đang tạm khóa để xử lý tranh chấp.")
                    .actorName("Hệ thống")
                    .actorRole("SYSTEM")
                    .build());
        }

        // Sắp xếp sự kiện mới nhất lên đầu (thứ tự thời gian giảm dần)
        events.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        return events;
    }
}
