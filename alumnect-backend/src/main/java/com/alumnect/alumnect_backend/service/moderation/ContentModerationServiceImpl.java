package com.alumnect.alumnect_backend.service.moderation;

import com.alumnect.alumnect_backend.common.enums.ProfanitySeverity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Cài đặt dịch vụ kiểm duyệt nội dung theo các ngưỡng điểm:
 * - Score >= 0.85: Vi phạm nghiêm trọng -> Tự động ẩn bài và cảnh báo khẩn.
 * - 0.40 <= Score < 0.85: Cần xem xét -> Giữ bài và đưa vào hàng chờ Admin.
 * - Score < 0.40: An toàn hoặc chỉ có tín hiệu yếu -> Không hành động.
 * Đây là bộ lọc dựa trên từ điển và luật, không dùng mô hình học máy.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContentModerationServiceImpl implements ContentModerationService {

    private final ProfanityFilterService profanityFilterService;

    /** Ngưỡng tự động ẩn nội dung. */
    public static final double HIGH_TOXICITY_THRESHOLD = 0.85;

    /** Ngưỡng đưa nội dung vào hàng chờ Admin. */
    public static final double REVIEW_REQUIRED_THRESHOLD = 0.40;

    private static final double SAFE_SCORE = 0.05;
    private static final double WEAK_BASE_SCORE = 0.20;
    private static final double WEAK_STEP = 0.05;
    private static final double WEAK_MAX_SCORE = 0.35;
    private static final double SEVERE_BASE_SCORE = 0.65;
    private static final double OFFENSIVE_BASE_SCORE = 0.50;
    private static final double EXTRA_TERM_STEP = 0.20;
    private static final double REPEAT_BONUS = 0.20;
    private static final double EVASION_BONUS = 0.10;
    private static final double MAX_SCORE = 0.99;

    /** Từ lặp từ mức này trở lên được coi là cố ý nhấn mạnh hoặc spam từ cấm. */
    private static final int REPEAT_THRESHOLD = 3;

    @Override
    public ModerationResult evaluateContent(String text) {
        if (text == null || text.isBlank()) {
            return buildResult(0.0, List.of(), "EMPTY_CONTENT");
        }

        List<ProfanityMatch> matches = profanityFilterService.analyze(text);
        if (matches.isEmpty()) {
            return buildResult(SAFE_SCORE, List.of(), "NO_PROFANITY_DETECTED");
        }

        Set<String> severe = new LinkedHashSet<>();
        Set<String> offensive = new LinkedHashSet<>();
        Set<String> weak = new LinkedHashSet<>();
        int actionableHits = 0;
        boolean evasion = false;

        for (ProfanityMatch match : matches) {
            if (match.severity() == ProfanitySeverity.SEVERE) {
                severe.add(match.term());
            } else if (match.severity() == ProfanitySeverity.OFFENSIVE) {
                offensive.add(match.term());
            } else {
                weak.add(match.term());
                continue;
            }
            actionableHits++;
            evasion |= match.obfuscated();
        }

        Set<String> keywords = new LinkedHashSet<>(severe);
        keywords.addAll(offensive);
        keywords.addAll(weak);

        int distinct = severe.size() + offensive.size();
        if (distinct == 0) {
            double score = Math.min(WEAK_MAX_SCORE, WEAK_BASE_SCORE + (weak.size() - 1) * WEAK_STEP);
            return buildResult(score, keywords, "WEAK_SIGNAL_ONLY");
        }

        double score = !severe.isEmpty() ? SEVERE_BASE_SCORE : OFFENSIVE_BASE_SCORE;
        score += (distinct - 1) * EXTRA_TERM_STEP;
        if (actionableHits >= REPEAT_THRESHOLD && actionableHits > distinct) {
            score += REPEAT_BONUS;
        }
        if (evasion) {
            score += EVASION_BONUS;
        }

        String reason = evasion ? "EVASION_DETECTED"
                : distinct >= 2 ? "MULTIPLE_VIOLATIONS"
                : !severe.isEmpty() ? "SEVERE_PROFANITY" : "OFFENSIVE_LANGUAGE";
        return buildResult(Math.min(MAX_SCORE, score), keywords, reason);
    }

    @Override
    public String sanitizeContent(String text) {
        return profanityFilterService.maskProfanity(text);
    }

    private ModerationResult buildResult(double score, Collection<String> keywords, String reason) {
        List<String> detected = new ArrayList<>(keywords);

        boolean autoHide = score >= HIGH_TOXICITY_THRESHOLD;
        boolean requiresReview = score >= REVIEW_REQUIRED_THRESHOLD && !autoHide;
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
