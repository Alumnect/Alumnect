package com.alumnect.alumnect_backend.service.moderation;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Cài đặt dịch vụ kiểm duyệt nội dung theo các ngưỡng điểm chuẩn công nghiệp:
 * - Score >= 0.85: Độc hại cao / Vi phạm nghiêm trọng -> Tự động ẩn bài và cảnh báo khẩn.
 * - 0.40 <= Score < 0.85: Mơ hồ / Cần xem xét -> Đưa vào danh sách ưu tiên để Admin duyệt.
 * - Score < 0.40: An toàn hoặc độ tin cậy thấp.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContentModerationServiceImpl implements ContentModerationService {

    private final ProfanityFilterService profanityFilterService;

    // Ngưỡng điểm chuẩn
    public static final double HIGH_TOXICITY_THRESHOLD = 0.85;
    public static final double REVIEW_REQUIRED_THRESHOLD = 0.40;

    @Override
    public ModerationResult evaluateContent(String text) {
        if (text == null || text.isBlank()) {
            return ModerationResult.builder()
                    .score(0.0)
                    .detectedKeywords(List.of())
                    .flaggedReason("EMPTY_OR_SAFE_CONTENT")
                    .autoHide(false)
                    .requiresReview(false)
                    .build();
        }

        // Bước 1: Quét danh sách từ cấm đa ngôn ngữ (Tiếng Việt & Tiếng Anh)
        List<String> detected = profanityFilterService.findProfanities(text);

        double score;
        String reason;

        if (detected.isEmpty()) {
            score = 0.05;
            reason = "NO_PROFANITY_DETECTED";
        } else if (detected.size() >= 2) {
            // Chứa nhiều từ cấm -> Mức độ vi phạm nghiêm trọng
            score = Math.min(0.95, 0.85 + (detected.size() - 2) * 0.05);
            reason = "MULTIPLE_PROFANITIES_DETECTED (" + String.join(", ", detected) + ")";
        } else {
            // Chứa 1 từ cấm -> Ngưỡng nghi vấn cần Admin xem xét ngữ cảnh
            score = 0.65;
            reason = "PROFANITY_DETECTED (" + detected.get(0) + ")";
        }

        boolean autoHide = score >= HIGH_TOXICITY_THRESHOLD;
        boolean requiresReview = score >= REVIEW_REQUIRED_THRESHOLD && score < HIGH_TOXICITY_THRESHOLD;

        log.debug("Đã đánh giá nội dung: score={}, autoHide={}, requiresReview={}, keywords={}",
                score, autoHide, requiresReview, detected);

        return ModerationResult.builder()
                .score(score)
                .detectedKeywords(detected)
                .flaggedReason(reason)
                .autoHide(autoHide)
                .requiresReview(requiresReview)
                .build();
    }
}
