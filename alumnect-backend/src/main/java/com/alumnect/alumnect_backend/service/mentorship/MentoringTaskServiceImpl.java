package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.*;
import com.alumnect.alumnect_backend.dao.mentorship.*;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.PingAdminFinanceRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.*;
import com.alumnect.alumnect_backend.entity.mentorship.*;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringTaskMapper;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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
    private final MentoringPaymentLedgerRepository ledgerRepository;
    private final MentoringWorkLogRepository workLogRepository;
    private final MentoringTaskDeadlineExtensionRepository extensionRepository;
    private final MentoringTaskAmendmentRepository amendmentRepository;
    private final MentoringTaskMapper taskMapper;
    private final MentoringWorkLogService workLogService;
    private final MentoringTaskResolutionService resolutionService;
    private final MentoringTaskCompletionService completionService;
    private final MentoringTicketService ticketService;
    private final MentoringGroupService mentoringGroupService;
    private final RefundAccountResolver refundAccountResolver;
    private final MentoringRules mentoringRules;
    private final MentoringDisputeTicketRepository ticketRepository;
    private final MentoringTaskSettlementProposalRepository settlementProposalRepository;
    private final UserRepository userRepository;
    private final MentoringConversationService mentoringConversationService;
    private final NotificationService notificationService;

    @Autowired
    private MentoringTicketMessageRepository ticketMessageRepository;

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
        if (!task.getStudent().getId().equals(currentUserId) && !task.getMentor().getId().equals(currentUserId)
                && !mentoringGroupService.isActiveMember(task.getRequest(), currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền truy cập thông tin của Mentoring Task này.");
        }
    }

    private List<MentoringTaskStatus> resolveStatusesForStage(String stage) {
        return switch (stage) {
            case "PREPARATION" -> List.of(MentoringTaskStatus.PREPARATION);
            case "IN_PROGRESS" -> List.of(MentoringTaskStatus.IN_PROGRESS);
            // Task còn đang chạy: chuẩn bị, đang thực hiện hoặc chờ nghiệm thu
            case "ACTIVE" -> List.of(
                    MentoringTaskStatus.PREPARATION,
                    MentoringTaskStatus.IN_PROGRESS,
                    MentoringTaskStatus.SUBMITTED
            );
            case "ENDING" -> List.of(
                    MentoringTaskStatus.SUBMITTED,
                    MentoringTaskStatus.COMPLETED,
                    MentoringTaskStatus.CANCELLED,
                    MentoringTaskStatus.DISPUTED,
                    MentoringTaskStatus.RESOLVED
            );
            // Task đã khép lại hẳn: hoàn thành, đã hủy hoặc đã được phân xử
            case "CLOSED" -> List.of(
                    MentoringTaskStatus.COMPLETED,
                    MentoringTaskStatus.CANCELLED,
                    MentoringTaskStatus.RESOLVED
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
            case SUBMITTED, COMPLETED, CANCELLED, DISPUTED, RESOLVED -> "ENDING";
        };
    }

    private Integer calculateProgress(MentoringTaskStatus status, long totalLogs, long confirmedLogs, long pendingLogs) {
        if (status == null) return 0;
        return switch (status) {
            case COMPLETED, RESOLVED -> 100;
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
                .overdue(deadline != null && deadline.isBefore(now)
                        && (task.getStatus() == MentoringTaskStatus.PREPARATION || task.getStatus() == MentoringTaskStatus.IN_PROGRESS))
                .isOverdue(isOverdue)
                .escrowBalance(mentoringRules.escrowBalance(task.getId()))
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
        boolean isCoreParticipant = isStudent || isMentor;
        boolean isReadOnly = task.getStatus() == MentoringTaskStatus.COMPLETED
                || task.getStatus() == MentoringTaskStatus.CANCELLED
                || task.getStatus() == MentoringTaskStatus.DISPUTED;
        boolean canAddWorkLog = isMentor && !isReadOnly;
        boolean canEditWorkLog = isMentor && !isReadOnly && workLogs.stream().anyMatch(w -> Boolean.TRUE.equals(w.getCanEdit()));
        boolean canConfirmWorkLog = isStudent && !isReadOnly && workLogs.stream().anyMatch(w -> w.getStatus() == WorkLogStatus.PENDING_CONFIRMATION);

        // Mentor (người được thuê) có đầy đủ chức năng Task; Học viên chỉ thỏa thuận dừng Task và mở khiếu nại
        boolean canRequestExtension = isMentor && !isReadOnly;
        boolean canRequestAmendment = isMentor && !isReadOnly;
        boolean canProposeSettlement = (isStudent || isMentor) && !isReadOnly;
        boolean canSubmitCompletion = isMentor && (task.getStatus() == MentoringTaskStatus.IN_PROGRESS || task.getStatus() == MentoringTaskStatus.PREPARATION);
        boolean canConfirmCompletion = isStudent && task.getStatus() == MentoringTaskStatus.SUBMITTED;

        MentoringTaskDeadlineExtensionResponse activeExtension = isCoreParticipant ? resolutionService.getActiveExtension(currentUserId, task.getId()) : null;
        MentoringTaskAmendmentResponse activeAmendment = isCoreParticipant ? resolutionService.getActiveAmendment(currentUserId, task.getId()) : null;
        MentoringTaskSettlementProposalResponse activeSettlementProposal = isCoreParticipant ? resolutionService.getActiveSettlementProposal(currentUserId, task.getId()) : null;
        MentoringTaskCompletionResponse latestCompletion = completionService.getLatestCompletion(currentUserId, task.getId());
        MentoringDisputeTicketResponse activeTicket = isCoreParticipant ? ticketService.getActiveTicket(currentUserId, task.getId()) : null;

        // Khi cả hai đồng thuận phương án hòa giải, hệ thống tự động chi trả & hoàn tiền ngay lập tức, không cần bước gửi ticket thủ công
        boolean canSubmitSettlementTicket = false;

        boolean canCreateDisputeTicket = (isStudent || isMentor)
                && task.getStatus() != MentoringTaskStatus.COMPLETED
                && task.getStatus() != MentoringTaskStatus.CANCELLED
                && task.getStatus() != MentoringTaskStatus.RESOLVED
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
                .hasRefundAccount(isStudent ? refundAccountResolver.exists(currentUserId) : null)
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

    /** Trạng thái chi/hoàn tiền lấy từ bút toán sổ quỹ thật, không suy diễn. */
    private String ledgerProgressStatus(MentoringPaymentLedger ledger, String succeededStatus, String noLedgerStatus) {
        if (ledger == null) return noLedgerStatus;
        return switch (ledger.getStatus()) {
            case SUCCEEDED -> succeededStatus;
            case FAILED -> "FAILED";
            case PENDING -> "PROCESSING";
        };
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

    @Override
    @Transactional(readOnly = true)
    public MentoringTaskReportResponse getTaskReport(Long currentUserId, Long taskId) {
        log.info("Người dùng id={} yêu cầu xem báo cáo kết quả và tài chính của Task id={}", currentUserId, taskId);

        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));

        verifyParticipant(task, currentUserId);

        if (!task.getStudent().getId().equals(currentUserId) && !task.getMentor().getId().equals(currentUserId)) {
            throw new ForbiddenException("Thành viên nhóm không có quyền xem báo cáo tài chính của Task.");
        }

        MentoringDeal deal = task.getDeal();

        // 1. Task Duration
        Instant startAt = task.getCreatedAt();
        Instant endAt = task.getCompletedAt() != null ? task.getCompletedAt() : Instant.now();
        long durationDays = Duration.between(startAt, endAt).toDays();

        // 2. Deal Info
        Long dealId = deal != null ? deal.getId() : null;
        String workingMode = deal != null && deal.getWorkingMode() != null ? deal.getWorkingMode().name() : null;
        String participationType = deal != null && deal.getParticipationType() != null ? deal.getParticipationType().name() : null;
        String taskType = deal != null && deal.getTaskType() != null ? deal.getTaskType().name() : null;
        String expectedResult = deal != null ? deal.getExpectedResult() : null;

        // 3. Deadline & Extensions
        Instant originalDeadline = deal != null ? deal.getDeadline() : task.getDeadline();
        Instant finalDeadline = task.getDeadline();
        List<MentoringTaskDeadlineExtension> acceptedExts = extensionRepository.findByTaskIdAndStatus(task.getId(), MentoringExtensionStatus.CONFIRMED);
        int extensionCount = acceptedExts.size();
        long totalExtensionDays = 0;
        if (originalDeadline != null && finalDeadline != null && finalDeadline.isAfter(originalDeadline)) {
            totalExtensionDays = Duration.between(originalDeadline, finalDeadline).toDays();
        }

        // 4. Amendments & Adjustments
        List<MentoringTaskAmendment> acceptedAmendments = amendmentRepository.findByTaskIdAndStatus(task.getId(), MentoringAmendmentStatus.APPLIED);
        int amendmentCount = acceptedAmendments.size();
        BigDecimal totalAdditionalAmount = acceptedAmendments.stream()
                .map(a -> a.getAdditionalAmount() != null ? a.getAdditionalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal originalPrice = deal != null && deal.getAgreedPrice() != null ? deal.getAgreedPrice() : (task.getAgreedPrice() != null ? task.getAgreedPrice() : BigDecimal.ZERO);
        BigDecimal totalAgreedPrice = originalPrice.add(totalAdditionalAmount);

        // 5. Work Logs & Progress
        List<MentoringWorkLog> workLogs = workLogRepository.findByTaskIdOrderByLogDateDesc(task.getId());
        int totalWorkLogs = workLogs.size();
        int confirmedWorkLogs = (int) workLogs.stream().filter(w -> w.getStatus() == WorkLogStatus.CONFIRMED).count();
        double progressPercentage = totalWorkLogs > 0 ? ((double) confirmedWorkLogs / totalWorkLogs) * 100.0 : 0.0;

        // 6. Latest Completion (UC110)
        MentoringTaskCompletionResponse completionSummary = completionService.getLatestCompletion(currentUserId, task.getId());

        // 7. Active & Latest Tickets (UC111 / UC112)
        MentoringDisputeTicketResponse activeTicket = ticketService.getActiveTicket(currentUserId, task.getId());
        List<MentoringDisputeTicketResponse> allTickets = ticketService.getTicketsByTaskId(currentUserId, task.getId());
        MentoringDisputeTicketResponse latestTicket = !allTickets.isEmpty() ? allTickets.get(0) : null;

        boolean isDisputed = task.getStatus() == MentoringTaskStatus.DISPUTED
                || (activeTicket != null && activeTicket.getTicketType() == MentoringTicketType.DISPUTE);

        // 8. Financial Analysis
        // Chỉ tính các giao dịch PayOS đã PAID thật, không lấy giá Deal thay thế.
        BigDecimal studentTotalPaid = BigDecimal.ZERO;
        if (deal != null) {
            studentTotalPaid = paymentRepository.findByDealIdOrderByCreatedAtDesc(deal.getId()).stream()
                    .filter(p -> p.getPaymentStatus() == PaymentStatus.PAID)
                    .map(MentoringTaskPayment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        BigDecimal mentorEarnedAmount;
        BigDecimal mentorPlatformFee = BigDecimal.ZERO;
        BigDecimal mentorNetPayout;
        String mentorPayoutStatus;

        BigDecimal studentGrossRefundAmount = BigDecimal.ZERO;
        BigDecimal studentPlatformFee = BigDecimal.ZERO;
        BigDecimal studentRefundAmount = BigDecimal.ZERO;
        String studentRefundStatus = "NO_REFUND";
        BigDecimal platformFee = BigDecimal.ZERO;

        List<MentoringPaymentLedger> taskLedgers = ledgerRepository.findByTaskId(task.getId());
        MentoringPaymentLedger latestPayout = taskLedgers.stream()
                .filter(l -> l.getTransactionType() == MentoringLedgerTransactionType.PAYOUT)
                .max(Comparator.comparing(MentoringPaymentLedger::getCreatedAt))
                .orElse(null);
        MentoringPaymentLedger latestRefund = taskLedgers.stream()
                .filter(l -> l.getTransactionType() == MentoringLedgerTransactionType.REFUND)
                .max(Comparator.comparing(MentoringPaymentLedger::getCreatedAt))
                .orElse(null);
        boolean hasFailedLedger = taskLedgers.stream().anyMatch(l -> l.getStatus() == MentoringLedgerStatus.FAILED);

        // Lấy đề xuất thỏa thuận dừng Task nếu có (UC109)
        MentoringTaskSettlementProposal acceptedProposal =
                settlementProposalRepository.findFirstByTaskIdAndStatus(task.getId(), MentoringSettlementProposalStatus.ACCEPTED).orElse(null);
        if (acceptedProposal == null) {
            acceptedProposal = settlementProposalRepository.findFirstByTaskIdOrderByCreatedAtDesc(task.getId()).orElse(null);
        }

        MentoringDisputeTicket anyResolvedTicket =
                ticketRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                        .filter(t -> t.getStatus() == MentoringTicketStatus.RESOLVED || t.getMentorAmount() != null || t.getStudentRefund() != null)
                        .findFirst()
                        .orElse(null);

        if (latestTicket == null && anyResolvedTicket != null) {
            latestTicket = MentoringDisputeTicketResponse.builder()
                    .id(anyResolvedTicket.getId())
                    .ticketCode(anyResolvedTicket.getTicketCode())
                    .ticketType(anyResolvedTicket.getTicketType())
                    .status(anyResolvedTicket.getStatus())
                    .decision(anyResolvedTicket.getDecision())
                    .resolutionNote(anyResolvedTicket.getResolutionNote())
                    .mentorAmount(anyResolvedTicket.getMentorAmount())
                    .studentRefund(anyResolvedTicket.getStudentRefund())
                    .totalAmount(anyResolvedTicket.getTotalAmount())
                    .disputeReason(anyResolvedTicket.getDisputeReason())
                    .build();
        }

        String resolutionDecision = null;
        String resolutionNote = null;
        if (latestTicket != null && latestTicket.getStatus() == MentoringTicketStatus.RESOLVED) {
            resolutionDecision = latestTicket.getDecision() != null ? latestTicket.getDecision().name() : null;
            resolutionNote = latestTicket.getResolutionNote();
        }
        if (resolutionDecision == null && anyResolvedTicket != null && anyResolvedTicket.getDecision() != null) {
            resolutionDecision = anyResolvedTicket.getDecision().name();
        }
        if (resolutionDecision == null && acceptedProposal != null) {
            resolutionDecision = "PARTIAL_SPLIT";
        }
        if (resolutionNote == null && anyResolvedTicket != null) {
            resolutionNote = anyResolvedTicket.getResolutionNote();
        }
        if (resolutionNote == null && acceptedProposal != null) {
            resolutionNote = acceptedProposal.getReason();
        }

        if (isDisputed) {
            mentorEarnedAmount = latestTicket != null && latestTicket.getMentorAmount() != null ? latestTicket.getMentorAmount() : BigDecimal.ZERO;
            mentorPlatformFee = MentoringRules.calculateTransferFee(mentorEarnedAmount);
            mentorNetPayout = MentoringRules.calculateNetTransfer(mentorEarnedAmount);
            mentorPayoutStatus = "ON_HOLD";
            studentGrossRefundAmount = latestTicket != null && latestTicket.getStudentRefund() != null ? latestTicket.getStudentRefund() : BigDecimal.ZERO;
            studentPlatformFee = MentoringRules.calculateTransferFee(studentGrossRefundAmount);
            studentRefundAmount = MentoringRules.calculateNetTransfer(studentGrossRefundAmount);
            studentRefundStatus = "ON_HOLD";
        } else if (task.getStatus() == MentoringTaskStatus.RESOLVED || (latestTicket != null && latestTicket.getStatus() == MentoringTicketStatus.RESOLVED) || anyResolvedTicket != null) {
            BigDecimal grossMentor = null;
            if (latestTicket != null && latestTicket.getMentorAmount() != null && latestTicket.getMentorAmount().compareTo(BigDecimal.ZERO) > 0) {
                grossMentor = latestTicket.getMentorAmount();
            } else if (anyResolvedTicket != null && anyResolvedTicket.getMentorAmount() != null && anyResolvedTicket.getMentorAmount().compareTo(BigDecimal.ZERO) > 0) {
                grossMentor = anyResolvedTicket.getMentorAmount();
            } else if (acceptedProposal != null && acceptedProposal.getMentorAmount() != null && acceptedProposal.getMentorAmount().compareTo(BigDecimal.ZERO) > 0) {
                grossMentor = acceptedProposal.getMentorAmount();
            } else if (latestPayout != null && latestPayout.getAmount() != null && latestPayout.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                grossMentor = latestPayout.getAmount().add(MentoringRules.PLATFORM_TRANSFER_FEE);
            } else {
                grossMentor = BigDecimal.ZERO;
            }
            mentorEarnedAmount = grossMentor;
            mentorPlatformFee = MentoringRules.calculateTransferFee(mentorEarnedAmount);
            mentorNetPayout = MentoringRules.calculateNetTransfer(mentorEarnedAmount);
            if (mentorEarnedAmount.compareTo(BigDecimal.ZERO) > 0) {
                mentorPayoutStatus = ledgerProgressStatus(latestPayout, "PAID", "PROCESSING");
            } else {
                mentorPayoutStatus = "CANCELLED";
            }

            BigDecimal grossStudent = null;
            if (latestTicket != null && latestTicket.getStudentRefund() != null && latestTicket.getStudentRefund().compareTo(BigDecimal.ZERO) > 0) {
                grossStudent = latestTicket.getStudentRefund();
            } else if (anyResolvedTicket != null && anyResolvedTicket.getStudentRefund() != null && anyResolvedTicket.getStudentRefund().compareTo(BigDecimal.ZERO) > 0) {
                grossStudent = anyResolvedTicket.getStudentRefund();
            } else if (acceptedProposal != null && acceptedProposal.getStudentRefund() != null && acceptedProposal.getStudentRefund().compareTo(BigDecimal.ZERO) > 0) {
                grossStudent = acceptedProposal.getStudentRefund();
            } else if (latestRefund != null && latestRefund.getAmount() != null && latestRefund.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                grossStudent = latestRefund.getAmount().add(MentoringRules.PLATFORM_TRANSFER_FEE);
            } else {
                grossStudent = BigDecimal.ZERO;
            }
            studentGrossRefundAmount = grossStudent;
            studentPlatformFee = MentoringRules.calculateTransferFee(studentGrossRefundAmount);
            studentRefundAmount = MentoringRules.calculateNetTransfer(studentGrossRefundAmount);
            if (studentGrossRefundAmount.compareTo(BigDecimal.ZERO) > 0) {
                studentRefundStatus = ledgerProgressStatus(latestRefund, "REFUNDED", "PROCESSING");
            } else {
                studentRefundStatus = "NO_REFUND";
            }
        } else if (activeTicket != null && activeTicket.getTicketType() == MentoringTicketType.SETTLEMENT) {
            mentorEarnedAmount = activeTicket.getMentorAmount() != null ? activeTicket.getMentorAmount() : BigDecimal.ZERO;
            mentorPlatformFee = MentoringRules.calculateTransferFee(mentorEarnedAmount);
            mentorNetPayout = MentoringRules.calculateNetTransfer(mentorEarnedAmount);
            mentorPayoutStatus = mentorEarnedAmount.compareTo(BigDecimal.ZERO) > 0
                    ? ledgerProgressStatus(latestPayout, "PAID", "PROCESSING")
                    : "CANCELLED";
            studentGrossRefundAmount = activeTicket.getStudentRefund() != null ? activeTicket.getStudentRefund() : BigDecimal.ZERO;
            studentPlatformFee = MentoringRules.calculateTransferFee(studentGrossRefundAmount);
            studentRefundAmount = MentoringRules.calculateNetTransfer(studentGrossRefundAmount);
            studentRefundStatus = studentGrossRefundAmount.compareTo(BigDecimal.ZERO) > 0
                    ? ledgerProgressStatus(latestRefund, "REFUNDED", "PROCESSING")
                    : "NO_REFUND";
        } else if (task.getStatus() == MentoringTaskStatus.COMPLETED) {
            mentorEarnedAmount = totalAgreedPrice;
            mentorPlatformFee = MentoringRules.calculateTransferFee(mentorEarnedAmount);
            mentorNetPayout = MentoringRules.calculateNetTransfer(mentorEarnedAmount);
            mentorPayoutStatus = ledgerProgressStatus(latestPayout, "PAID", "PENDING_ESCROW");
            studentGrossRefundAmount = BigDecimal.ZERO;
            studentPlatformFee = BigDecimal.ZERO;
            studentRefundAmount = BigDecimal.ZERO;
            studentRefundStatus = "NO_REFUND";
        } else if (task.getStatus() == MentoringTaskStatus.CANCELLED) {
            mentorEarnedAmount = BigDecimal.ZERO;
            mentorPlatformFee = BigDecimal.ZERO;
            mentorNetPayout = BigDecimal.ZERO;
            mentorPayoutStatus = "CANCELLED";
            studentGrossRefundAmount = studentTotalPaid;
            studentPlatformFee = MentoringRules.calculateTransferFee(studentGrossRefundAmount);
            studentRefundAmount = MentoringRules.calculateNetTransfer(studentGrossRefundAmount);
            studentRefundStatus = studentGrossRefundAmount.compareTo(BigDecimal.ZERO) > 0
                    ? ledgerProgressStatus(latestRefund, "REFUNDED", "PROCESSING")
                    : "NO_REFUND";
        } else {
            mentorEarnedAmount = totalAgreedPrice;
            mentorPlatformFee = MentoringRules.calculateTransferFee(mentorEarnedAmount);
            mentorNetPayout = MentoringRules.calculateNetTransfer(mentorEarnedAmount);
            mentorPayoutStatus = "PENDING_ESCROW";
            studentGrossRefundAmount = BigDecimal.ZERO;
            studentPlatformFee = BigDecimal.ZERO;
            studentRefundAmount = BigDecimal.ZERO;
            studentRefundStatus = "NO_REFUND";
        }

        platformFee = mentorPlatformFee.add(studentPlatformFee);
        String invoiceCode = String.format("INV-TASK-%d-%s", task.getId(),
                DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now()));
        Instant invoiceIssuedAt = task.getCompletedAt() != null ? task.getCompletedAt() : Instant.now();

        String mentorPayoutNote = latestPayout != null ? latestPayout.getNote() : null;
        String studentRefundNote = latestRefund != null ? latestRefund.getNote() : null;

        boolean canPingAdminFinance = task.getStatus() == MentoringTaskStatus.RESOLVED
                || task.getStatus() == MentoringTaskStatus.DISPUTED
                || task.getStatus() == MentoringTaskStatus.COMPLETED
                || task.getStatus() == MentoringTaskStatus.CANCELLED
                || studentRefundAmount.compareTo(BigDecimal.ZERO) > 0
                || mentorEarnedAmount.compareTo(BigDecimal.ZERO) > 0
                || hasFailedLedger;

        String platformFeeNote = null;

        // 9. Participants
        MentoringParticipantResponse student = toParticipantResponse(task.getStudent(), "STUDENT");
        MentoringParticipantResponse mentor = toParticipantResponse(task.getMentor(), "MENTOR");

        return MentoringTaskReportResponse.builder()
                .taskId(task.getId())
                .taskTitle(task.getTaskTitle())
                .description(task.getTaskScope())
                .taskStatus(task.getStatus())
                .createdAt(task.getCreatedAt())
                .completedAt(task.getCompletedAt())
                .durationDays(durationDays)
                .dealId(dealId)
                .workingMode(workingMode)
                .participationType(participationType)
                .taskType(taskType)
                .expectedResult(expectedResult)
                .originalDeadline(originalDeadline)
                .finalDeadline(finalDeadline)
                .extensionCount(extensionCount)
                .totalExtensionDays(totalExtensionDays)
                .totalWorkLogs(totalWorkLogs)
                .confirmedWorkLogs(confirmedWorkLogs)
                .progressPercentage(progressPercentage)
                .completionSummary(completionSummary)
                .amendmentCount(amendmentCount)
                .totalAdditionalAmount(totalAdditionalAmount)
                .activeTicket(activeTicket)
                .latestTicket(latestTicket)
                .isDisputed(isDisputed)
                .resolutionDecision(resolutionDecision)
                .resolutionNote(resolutionNote)
                .canPingAdminFinance(canPingAdminFinance)
                .hasFailedLedger(hasFailedLedger)
                .invoiceCode(invoiceCode)
                .invoiceIssuedAt(invoiceIssuedAt)
                .originalPrice(originalPrice)
                .totalAgreedPrice(totalAgreedPrice)
                .studentTotalPaid(studentTotalPaid)
                .studentGrossRefundAmount(studentGrossRefundAmount)
                .studentPlatformFee(studentPlatformFee)
                .studentRefundAmount(studentRefundAmount)
                .studentRefundStatus(studentRefundStatus)
                .studentRefundNote(studentRefundNote)
                .mentorEarnedAmount(mentorEarnedAmount)
                .mentorPlatformFee(mentorPlatformFee)
                .platformFee(platformFee)
                .mentorNetPayout(mentorNetPayout)
                .mentorPayoutStatus(mentorPayoutStatus)
                .mentorPayoutNote(mentorPayoutNote)
                .platformFeeNote(platformFeeNote)
                .student(student)
                .mentor(mentor)
                .build();
    }

    @Override
    @Transactional
    public void pingAdminFinance(Long currentUserId, Long taskId, PingAdminFinanceRequest request) {
        log.info("Người dùng id={} yêu cầu ping Admin về sự cố dòng tiền cho Task id={}: {}", currentUserId, taskId, request.getReason());

        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));

        verifyParticipant(task, currentUserId);
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + currentUserId));

        boolean isStudent = Objects.equals(task.getStudent().getId(), currentUserId);
        String senderRole = isStudent ? "Học viên" : "Mentor";
        String displayName = currentUser.getProfile() != null && currentUser.getProfile().getFullName() != null
                ? currentUser.getProfile().getFullName() : currentUser.getEmail();

        // 1. Tạo Ticket tranh chấp dòng tiền
        String datePart = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now());
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String ticketCode = "FN-" + datePart + "-" + randomSuffix;

        String rawReason = request.getReason() != null ? request.getReason().trim() : "";
        String disputeReason = "Khiếu nại dòng tiền: " + rawReason;
        if (disputeReason.length() > 250) {
            disputeReason = disputeReason.substring(0, 247) + "...";
        }

        String title = "Khiếu nại dòng tiền Task #" + task.getId() + " - " + displayName;
        if (title.length() > 250) {
            title = title.substring(0, 247) + "...";
        }

        String desiredSolution = "Kiểm tra và giải quyết lại giao dịch hoàn tiền/thù lao cho Task #" + task.getId();
        if (desiredSolution.length() > 250) {
            desiredSolution = desiredSolution.substring(0, 247) + "...";
        }

        Conversation conv = task.getConversation() != null
                ? task.getConversation()
                : (task.getDeal() != null ? task.getDeal().getConversation() : null);

        // 1. Kiểm tra xem đã có Ticket khiếu nại dòng tiền đang mở (OPEN hoặc IN_REVIEW) của Task hay chưa
        MentoringDisputeTicket existingTicket = ticketRepository.findFirstByTaskIdOrderByCreatedAtDesc(task.getId())
                .filter(t -> (t.getStatus() == MentoringTicketStatus.OPEN || t.getStatus() == MentoringTicketStatus.IN_REVIEW)
                        && (t.getDisputeReason() != null && t.getDisputeReason().toLowerCase().contains("dòng tiền")))
                .orElse(null);

        MentoringDisputeTicket savedTicket;
        int currentPingCount = 1;
        Instant now = Instant.now();

        if (existingTicket != null) {
            // Rate limit chống spam: kiểm tra tin nhắn ping gần nhất trong ticket
            var latestMessage = ticketMessageRepository != null
                    ? ticketMessageRepository.findFirstByTicketIdOrderByCreatedAtDesc(existingTicket.getId()).orElse(null)
                    : null;
            Instant lastPing = latestMessage != null ? latestMessage.getCreatedAt() : existingTicket.getUpdatedAt();
            if (lastPing != null) {
                long secondsPassed = Duration.between(lastPing, now).getSeconds();
                if (secondsPassed < 60) {
                    throw new BadRequestException(
                            "Bạn vừa gửi phản ánh đối soát gần đây. Vui lòng đợi Ban Quản Trị xử lý hoặc thử lại sau " + (60 - secondsPassed) + " giây.");
                }
            }

            long prevCount = ticketMessageRepository != null ? ticketMessageRepository.countByTicketId(existingTicket.getId()) : 0;
            currentPingCount = (int) prevCount + 1;
            existingTicket.setDisputeReason(disputeReason);
            savedTicket = ticketRepository.save(existingTicket);

            // Ghi log vào bảng mentoring_ticket_messages có sẵn
            if (ticketMessageRepository != null) {
                MentoringTicketMessage pingMsg = MentoringTicketMessage.builder()
                        .ticket(savedTicket)
                        .sender(currentUser)
                        .senderRole(isStudent ? "STUDENT" : "MENTOR")
                        .messageType("FINANCE_PING")
                        .content("[Nhắc nhở lần " + currentPingCount + "] " + rawReason)
                        .createdAt(now)
                        .build();
                ticketMessageRepository.save(pingMsg);
            }
        } else {
            MentoringDisputeTicket ticket = MentoringDisputeTicket.builder()
                    .ticketCode(ticketCode)
                    .ticketType(MentoringTicketType.DISPUTE)
                    .task(task)
                    .conversation(conv)
                    .createdBy(currentUser)
                    .student(task.getStudent())
                    .mentor(task.getMentor())
                    .title(title)
                    .description("Phản ánh sự cố dòng tiền từ " + senderRole + ": " + rawReason)
                    .disputeReason(disputeReason)
                    .desiredSolution(desiredSolution)
                    .mentorAmount(BigDecimal.ZERO)
                    .studentRefund(BigDecimal.ZERO)
                    .totalAmount(task.getAgreedPrice() != null ? task.getAgreedPrice() : BigDecimal.ZERO)
                    .status(MentoringTicketStatus.OPEN)
                    .build();
            savedTicket = ticketRepository.save(ticket);

            // Ghi tin nhắn đầu tiên vào bảng mentoring_ticket_messages có sẵn
            if (ticketMessageRepository != null) {
                MentoringTicketMessage pingMsg = MentoringTicketMessage.builder()
                        .ticket(savedTicket)
                        .sender(currentUser)
                        .senderRole(isStudent ? "STUDENT" : "MENTOR")
                        .messageType("FINANCE_PING")
                        .content("[Khởi tạo phản ánh sự cố] " + rawReason)
                        .createdAt(now)
                        .build();
                ticketMessageRepository.save(pingMsg);
            }
        }

        // 2. Gửi tin nhắn hệ thống realtime vào Chat for Task
        try {
            if (conv != null) {
                String pingInfo = currentPingCount > 1 ? " (Nhắc lần " + currentPingCount + ")" : "";
                String msg = String.format("⚠️ [Hệ thống] %s đã gửi phản ánh sự cố dòng tiền%s (#%s) tới Ban Quản Trị:\n• Nội dung: %s\nBan Quản Trị đã nhận được thông báo đối soát trong Sổ quỹ Mentoring.",
                        senderRole, pingInfo, savedTicket.getTicketCode(), rawReason);
                mentoringConversationService.postSystemMessage(conv, currentUser, msg);
            }
        } catch (Exception ex) {
            log.error("Lỗi gửi tin nhắn hệ thống realtime thông báo ping Admin: {}", ex.getMessage());
        }

        // 3. Gửi thông báo đến toàn bộ các Admin đang hoạt động
        try {
            List<User> admins = userRepository.findByRoleNameAndAccountStatus("ADMIN", AccountStatus.ACTIVE);
            String reminderPrefix = currentPingCount > 1 ? "[Nhắc lần " + currentPingCount + "] " : "";
            for (User admin : admins) {
                notificationService.sendMentoringTaskEventNotification(
                        currentUser, admin, task,
                        "FINANCE_DISPUTE_PING", String.valueOf(task.getId()),
                        "⚠️ " + reminderPrefix + "Sự cố dòng tiền Task #" + task.getId(),
                        senderRole + " (" + displayName + ") báo cáo: " + rawReason + ". Bấm để đối soát Sổ quỹ."
                );
            }
        } catch (Exception ex) {
            log.error("Lỗi gửi thông báo cho Admin: {}", ex.getMessage());
        }
    }
}
