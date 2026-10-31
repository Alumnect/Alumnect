package com.alumnect.alumnect_backend.service.moderation;

import com.alumnect.alumnect_backend.common.constant.WebSocketDestinations;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.config.ModerationAsyncConfig;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Listener kiểm duyệt ngầm bài viết và báo cáo (Asynchronous Event-driven Moderation).
 * Chỉ chạy sau khi transaction gửi sự kiện đã commit: nếu chạy sớm hơn, luồng nền đọc DB không thấy
 * bản ghi mới và bỏ qua kiểm duyệt. Listener chạy trong transaction riêng (REQUIRES_NEW) để ghi được dữ liệu.
 * Với mỗi nội dung vi phạm, hệ thống:
 * 1. Tự động ẩn bài viết nếu điểm rủi ro >= 0.85 và báo cho tác giả
 * 2. Cập nhật điểm và từ khóa vi phạm vào bản ghi Report
 * 3. Gửi thông báo WebSocket trực tiếp đến Dashboard của Admin sau khi dữ liệu đã lưu
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReportModerationListener {

    private final ContentModerationService contentModerationService;
    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    /** Kênh cảnh báo kiểm duyệt, chỉ tài khoản ADMIN được đăng ký. */
    public static final String ADMIN_MODERATION_TOPIC = WebSocketDestinations.TOPIC_ADMIN_MODERATION;

    /** Mã cảnh báo khi bài viết vừa bị tự động ẩn. */
    private static final String ALERT_AUTO_HIDDEN = "CRITICAL_AUTO_HIDDEN";

    /** Mã cảnh báo khi nội dung cần Admin xem xét. */
    private static final String ALERT_REVIEW_REQUIRED = "REVIEW_REQUIRED";

    /**
     * Chấm điểm bài viết bị người dùng báo cáo.
     * Luôn đánh giá nội dung hiện tại trong DB, không dùng bản sao trong sự kiện vì bài có thể vừa được sửa.
     *
     * @param event Sự kiện chứa ID báo cáo và bài viết
     */
    @Async(ModerationAsyncConfig.MODERATION_EXECUTOR)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleReportCreated(ReportCreatedEvent event) {
        log.info("Bắt đầu xử lý kiểm duyệt ngầm: reportId={}, postId={}", event.getReportId(), event.getPostId());

        Report report = reportRepository.findById(event.getReportId()).orElse(null);
        Post post = postRepository.findById(event.getPostId()).orElse(null);
        if (report == null || post == null) {
            log.warn("Không tìm thấy dữ liệu để kiểm duyệt: reportId={}, postId={}", event.getReportId(), event.getPostId());
            return;
        }

        ModerationResult result = contentModerationService.evaluateContent(post.getContent());
        String keywords = joinKeywords(result);
        applyResult(report, result, keywords);

        boolean hidden = result.isAutoHide() && hideIfAllowed(post, keywords);
        report.setAutoModerated(hidden);
        reportRepository.save(report);

        if (hidden) {
            alertAdminsAfterCommit(ALERT_AUTO_HIDDEN, report, result);
        } else if (result.isAutoHide() || result.isRequiresReview()) {
            alertAdminsAfterCommit(ALERT_REVIEW_REQUIRED, report, result);
        } else {
            log.debug("Báo cáo mức độ rủi ro thấp: reportId={}, score={}", report.getId(), result.getScore());
        }
    }

    /**
     * Quét ngầm bài viết vừa đăng hoặc vừa sửa (Post-First, Moderate-Later).
     * Vi phạm nghiêm trọng thì ẩn bài; vi phạm vừa thì giữ bài. Cả hai đều có báo cáo hệ thống gửi Admin.
     *
     * @param event Sự kiện chứa ID bài viết
     */
    @Async(ModerationAsyncConfig.MODERATION_EXECUTOR)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handlePostCreated(PostCreatedModerationEvent event) {
        log.info("Bắt đầu quét ngầm bài viết (Post-First): postId={}", event.getPostId());

        Post post = postRepository.findById(event.getPostId()).orElse(null);
        if (post == null) {
            log.warn("Không tìm thấy bài viết để quét ngầm: postId={}", event.getPostId());
            return;
        }
        if (post.getStatus() != PostStatus.ACTIVE) {
            return;
        }

        ModerationResult result = contentModerationService.evaluateContent(post.getContent());
        if (!result.isAutoHide() && !result.isRequiresReview()) {
            return;
        }

        String keywords = joinKeywords(result);
        boolean hidden = result.isAutoHide() && hideIfAllowed(post, keywords);
        if (!hidden && isClearedByAdmin(post, keywords)) {
            log.info("Bỏ qua bài viết đã được Admin xác nhận không vi phạm: postId={}", post.getId());
            return;
        }

        Report report = reportRepository
                .findFirstByPostIdAndReporterIsNullAndStatus(post.getId(), ReportStatus.PENDING)
                .orElseGet(() -> newSystemReport(post, result));
        applyResult(report, result, keywords);
        report.setAutoModerated(Boolean.TRUE.equals(report.getAutoModerated()) || hidden);
        reportRepository.save(report);

        alertAdminsAfterCommit(hidden ? ALERT_AUTO_HIDDEN : ALERT_REVIEW_REQUIRED, report, result);
    }

    /** Ẩn bài viết trừ khi Admin đã xác nhận đúng các từ khóa này không vi phạm; báo cho tác giả khi ẩn. */
    private boolean hideIfAllowed(Post post, String keywords) {
        if (post.getStatus() != PostStatus.ACTIVE || isClearedByAdmin(post, keywords)) {
            return false;
        }
        post.setStatus(PostStatus.HIDDEN);
        postRepository.save(post);
        notificationService.sendContentModeratedNotification(post);
        log.warn("Hệ thống đã tự động ẩn bài viết: postId={}, keywords={}", post.getId(), keywords);
        return true;
    }

    /** Admin đã bỏ qua báo cáo với cùng tập từ khóa thì không tự ẩn lại; bài sửa thành từ khác vẫn bị quét. */
    private boolean isClearedByAdmin(Post post, String keywords) {
        return keywords != null && reportRepository.existsByPostIdAndStatusAndDetectedKeywords(
                post.getId(), ReportStatus.DISMISSED, keywords);
    }

    private static Report newSystemReport(Post post, ModerationResult result) {
        return Report.builder()
                .post(post)
                .reporter(null)
                .reason(ReportReason.INAPPROPRIATE)
                .description("Hệ thống tự động phát hiện nội dung vi phạm: " + result.getFlaggedReason())
                .status(ReportStatus.PENDING)
                .createdAt(Instant.now())
                .build();
    }

    private static void applyResult(Report report, ModerationResult result, String keywords) {
        report.setAiScore(result.getScore());
        report.setAiFlaggedReason(result.getFlaggedReason());
        report.setDetectedKeywords(keywords);
    }

    private static String joinKeywords(ModerationResult result) {
        List<String> detected = result.getDetectedKeywords();
        return detected == null || detected.isEmpty() ? null : String.join(", ", detected);
    }

    /** Gửi cảnh báo sau khi transaction hiện tại commit để Admin tải lại danh sách là thấy ngay dữ liệu mới. */
    private void alertAdminsAfterCommit(String alertType, Report report, ModerationResult result) {
        Map<String, Object> payload = buildAlertPayload(alertType, report, result);
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            sendAlert(payload);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                sendAlert(payload);
            }
        });
    }

    private static Map<String, Object> buildAlertPayload(String alertType, Report report, ModerationResult result) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", alertType);
        payload.put("reportId", report.getId());
        payload.put("postId", report.getPost() != null ? report.getPost().getId() : null);
        payload.put("aiScore", result.getScore());
        payload.put("flaggedReason", result.getFlaggedReason());
        payload.put("detectedKeywords", result.getDetectedKeywords());
        payload.put("autoModerated", report.getAutoModerated());
        payload.put("createdAt", report.getCreatedAt() != null ? report.getCreatedAt().toString() : null);
        return payload;
    }

    private void sendAlert(Map<String, Object> payload) {
        try {
            messagingTemplate.convertAndSend(ADMIN_MODERATION_TOPIC, (Object) payload);
            log.info("Đã gửi cảnh báo kiểm duyệt: type={}, reportId={}", payload.get("type"), payload.get("reportId"));
        } catch (Exception ex) {
            log.warn("Không thể gửi thông báo WebSocket tới Admin: {}", ex.getMessage());
        }
    }
}
