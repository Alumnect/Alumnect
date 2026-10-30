package com.alumnect.alumnect_backend.service.moderation;

import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.report.Report;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Listener xử lý sự kiện báo cáo bài viết vi phạm ngầm (Asynchronous Event-driven Moderation).
 * Đánh giá độ độc hại của bài viết và thực hiện:
 * 1. Tự động tạm ẩn bài viết nếu điểm độc hại >= 0.85
 * 2. Cập nhật điểm AI và từ khóa vi phạm vào bản ghi Report
 * 3. Gửi thông báo WebSocket trực tiếp đến Dashboard của Admin
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReportModerationListener {

    private final ContentModerationService contentModerationService;
    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public static final String ADMIN_MODERATION_TOPIC = "/topic/admin/moderation-alerts";

    @Async
    @EventListener
    @Transactional
    public void handleReportCreated(ReportCreatedEvent event) {
        log.info("Bắt đầu xử lý kiểm duyệt ngầm: reportId={}, postId={}", event.getReportId(), event.getPostId());

        Report report = reportRepository.findById(event.getReportId()).orElse(null);
        if (report == null) {
            log.warn("Không tìm thấy báo cáo reportId={}", event.getReportId());
            return;
        }

        // Bước 1: Đánh giá nội dung bài viết thông qua ContentModerationService
        ModerationResult result = contentModerationService.evaluateContent(event.getPostContent());

        report.setAiScore(result.getScore());
        report.setAiFlaggedReason(result.getFlaggedReason());
        if (result.getDetectedKeywords() != null && !result.getDetectedKeywords().isEmpty()) {
            report.setDetectedKeywords(String.join(", ", result.getDetectedKeywords()));
        }

        // Bước 2: Phân loại hành động theo ngưỡng điểm
        if (result.isAutoHide()) {
            // Tự động tạm ẩn bài viết do vi phạm nghiêm trọng
            Post post = postRepository.findById(event.getPostId()).orElse(null);
            if (post != null && post.getStatus() == PostStatus.ACTIVE) {
                post.setStatus(PostStatus.HIDDEN);
                postRepository.save(post);
                report.setAutoModerated(true);
                log.info("Hệ thống đã TỰ ĐỘNG ẨN bài viết do vi phạm nghiêm trọng: postId={}, score={}",
                        post.getId(), result.getScore());
            }

            // Gửi cảnh báo khẩn cấp (Emergency Alert) tới Admin qua WebSocket
            broadcastAdminAlert("CRITICAL_AUTO_HIDDEN", report, result);

        } else if (result.isRequiresReview()) {
            // Đưa vào danh sách ưu tiên cao cần Admin xem xét thủ công
            log.info("Báo cáo cần Admin xem xét thủ công: reportId={}, score={}", report.getId(), result.getScore());
            broadcastAdminAlert("REVIEW_REQUIRED", report, result);
        } else {
            log.debug("Báo cáo mức độ rủi ro thấp: reportId={}, score={}", report.getId(), result.getScore());
        }

        reportRepository.save(report);
    }

    /**
     * Quét ngầm bài viết vừa được xuất bản (Chiến lược Facebook: Post-First, Moderate-Later).
     * Nếu phát hiện vi phạm nghiêm trọng: tự động tạm ẩn bài viết và tạo báo cáo hệ thống gửi Admin.
     */
    @Async
    @EventListener
    @Transactional
    public void handlePostCreated(PostCreatedModerationEvent event) {
        log.info("Bắt đầu quét ngầm bài viết mới đăng tải (Post-First): postId={}", event.getPostId());

        Post post = postRepository.findById(event.getPostId()).orElse(null);
        if (post == null || post.getStatus() != PostStatus.ACTIVE) {
            return;
        }

        ModerationResult result = contentModerationService.evaluateContent(event.getContent());

        if (result.isAutoHide() || result.isRequiresReview()) {
            boolean shouldHide = result.isAutoHide();
            if (shouldHide) {
                post.setStatus(PostStatus.HIDDEN);
                postRepository.save(post);
                log.warn("ĐÃ TỰ ĐỘNG ẨN bài viết mới đăng do vi phạm nghiêm trọng: postId={}, score={}",
                        post.getId(), result.getScore());
            }

            // Tự động tạo bản ghi Report từ hệ thống (Auto-Flagged System Report)
            String keywordsStr = (result.getDetectedKeywords() != null && !result.getDetectedKeywords().isEmpty())
                    ? String.join(", ", result.getDetectedKeywords())
                    : null;

            Report autoReport = Report.builder()
                    .post(post)
                    .reporter(post.getAuthor()) // Người phát hiện là cơ chế kiểm duyệt tự động dựa trên bài của tác giả
                    .reason(com.alumnect.alumnect_backend.common.enums.ReportReason.INAPPROPRIATE)
                    .description("Hệ thống tự động phát hiện vi phạm (Facebook Moderation Pipeline): " + result.getFlaggedReason())
                    .status(com.alumnect.alumnect_backend.common.enums.ReportStatus.PENDING)
                    .aiScore(result.getScore())
                    .aiFlaggedReason(result.getFlaggedReason())
                    .autoModerated(shouldHide)
                    .detectedKeywords(keywordsStr)
                    .createdAt(Instant.now())
                    .build();

            reportRepository.save(autoReport);

            String alertType = shouldHide ? "CRITICAL_AUTO_HIDDEN" : "REVIEW_REQUIRED";
            broadcastAdminAlert(alertType, autoReport, result);
        }
    }

    private void broadcastAdminAlert(String alertType, Report report, ModerationResult result) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", alertType);
            payload.put("reportId", report.getId());
            payload.put("postId", report.getPost() != null ? report.getPost().getId() : null);
            payload.put("aiScore", result.getScore());
            payload.put("flaggedReason", result.getFlaggedReason());
            payload.put("detectedKeywords", result.getDetectedKeywords());
            payload.put("autoModerated", report.getAutoModerated());
            payload.put("createdAt", report.getCreatedAt().toString());

            messagingTemplate.convertAndSend(ADMIN_MODERATION_TOPIC, (Object) payload);
            log.info("Đã gửi WebSocket alert tới {}: type={}, reportId={}", ADMIN_MODERATION_TOPIC, alertType, report.getId());
        } catch (Exception ex) {
            log.warn("Không thể gửi thông báo WebSocket tới Admin: {}", ex.getMessage());
        }
    }
}
