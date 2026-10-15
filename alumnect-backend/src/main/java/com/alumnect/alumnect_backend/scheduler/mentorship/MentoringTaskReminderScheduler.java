package com.alumnect.alumnect_backend.scheduler.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringAmendmentStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringCompletionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringExtensionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringSettlementProposalStatus;
import com.alumnect.alumnect_backend.common.enums.WorkLogStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskAmendmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskCompletionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskDeadlineExtensionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskSettlementProposalRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRepository;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class MentoringTaskReminderScheduler {

    private final MentoringTaskDeadlineExtensionRepository extensionRepository;
    private final MentoringTaskAmendmentRepository amendmentRepository;
    private final MentoringTaskSettlementProposalRepository settlementRepository;
    private final MentoringTaskCompletionRepository completionRepository;
    private final MentoringWorkLogRepository workLogRepository;
    private final NotificationService notificationService;
    private final com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository ledgerRepository;

    /**
     * Mỗi yêu cầu còn chờ sau 24 giờ chỉ nhận một lần nhắc. NotificationService
     * chống trùng bằng loại sự kiện và ID bản ghi trên bảng notifications hiện có.
     */
    @Scheduled(cron = "0 15 * * * *")
    @Transactional
    public void remindPendingTaskConfirmations() {
        Instant threshold = Instant.now().minus(24, ChronoUnit.HOURS);

        extensionRepository.findByStatusAndCreatedAtBefore(MentoringExtensionStatus.PENDING, threshold)
                .forEach(item -> notificationService.sendMentoringTaskEventNotification(
                        item.getCreatedBy(), item.getRecipient(), item.getTask(),
                        "EXTENSION_REMINDER", String.valueOf(item.getId()),
                        "Nhắc xác nhận gia hạn Task",
                        "Đề xuất gia hạn đã chờ hơn 24 giờ. Vui lòng xem và phản hồi."));

        amendmentRepository.findByStatusAndCreatedAtBefore(MentoringAmendmentStatus.PENDING, threshold)
                .forEach(item -> notificationService.sendMentoringTaskEventNotification(
                        item.getCreatedBy(), item.getRecipient(), item.getTask(),
                        "AMENDMENT_REMINDER", String.valueOf(item.getId()),
                        "Nhắc xác nhận điều chỉnh Task",
                        "Đề xuất điều chỉnh đã chờ hơn 24 giờ. Vui lòng xem và phản hồi."));

        settlementRepository.findByStatusAndCreatedAtBefore(MentoringSettlementProposalStatus.PENDING, threshold)
                .forEach(item -> notificationService.sendMentoringTaskEventNotification(
                        item.getCreatedBy(), item.getRecipient(), item.getTask(),
                        "SETTLEMENT_REMINDER", String.valueOf(item.getId()),
                        "Nhắc xác nhận thỏa thuận Task",
                        "Đề xuất thỏa thuận đã chờ hơn 24 giờ. Vui lòng xem và phản hồi."));

        completionRepository.findByStatusAndCreatedAtBefore(MentoringCompletionStatus.PENDING, threshold)
                .forEach(item -> notificationService.sendMentoringTaskEventNotification(
                        item.getSubmittedBy(), item.getTask().getStudent(), item.getTask(),
                        "COMPLETION_REMINDER", String.valueOf(item.getId()),
                        "Nhắc nghiệm thu Task",
                        "Kết quả hoàn thành đã chờ hơn 24 giờ. Vui lòng xem và xác nhận."));

        workLogRepository.findByStatusAndCreatedAtBefore(WorkLogStatus.PENDING_CONFIRMATION, threshold)
                .forEach(item -> notificationService.sendMentoringTaskEventNotification(
                        item.getMentor(), item.getTask().getStudent(), item.getTask(),
                        "WORK_LOG_REMINDER", String.valueOf(item.getId()),
                        "Nhắc xác nhận Work Log",
                        "Work Log đã chờ hơn 24 giờ. Vui lòng xem và xác nhận kết quả công việc."));

        // Nhắc lại mỗi 3 ngày (khóa chống trùng theo chu kỳ 3 ngày)
        long cycle = Instant.now().getEpochSecond() / (3 * 86400);

        amendmentRepository.findByStatusAndCreatedAtBefore(MentoringAmendmentStatus.AWAITING_TOPUP, threshold)
                .forEach(item -> notificationService.sendMentoringTaskEventNotification(
                        item.getCreatedBy(), item.getTask().getStudent(), item.getTask(),
                        "TOPUP_REMINDER", item.getId() + ":" + cycle,
                        "Nhắc thanh toán bổ sung",
                        "Đề xuất điều chỉnh đã được chấp nhận và đang chờ bạn thanh toán bổ sung. Bạn có thể thanh toán hoặc từ chối trong cuộc trò chuyện."));

        ledgerRepository.findByTransactionTypeAndStatus(
                        com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType.REFUND,
                        com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus.PENDING).stream()
                .filter(l -> "BANK_ACCOUNT_REQUIRED".equals(l.getProviderStatus()))
                .forEach(l -> notificationService.sendMentoringAccountNotification(null, l.getStudent(),
                        "MENTORING_REFUND", l.getId() + ":ACCOUNT_REMINDER:" + cycle,
                        "Bạn có khoản hoàn tiền đang chờ",
                        "Vui lòng khai báo tài khoản ngân hàng ở mục Hoàn tiền để nhận lại tiền."));

        log.debug("Đã kiểm tra các yêu cầu Mentoring Task chờ xác nhận quá 24 giờ");
    }
}
