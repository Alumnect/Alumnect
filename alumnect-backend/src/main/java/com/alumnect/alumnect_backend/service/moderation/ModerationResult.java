package com.alumnect.alumnect_backend.service.moderation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Kết quả phân tích và đánh giá mức độ vi phạm nội dung (Moderation Evaluation Result).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerationResult {

    /** Điểm số rủi ro / độc hại từ 0.00 (hoàn toàn an toàn) đến 1.00 (cực kỳ độc hại/vi phạm nghiêm trọng). */
    private double score;

    /** Danh sách các từ cấm hoặc từ khóa nghi vấn phát hiện được. */
    private List<String> detectedKeywords;

    /** Lý do hoặc mã phân loại đánh dấu vi phạm. */
    private String flaggedReason;

    /** Có tự động ẩn nội dung ngay lập tức không (khi score >= 0.85). */
    private boolean autoHide;

    /** Có cần đưa vào hàng chờ Admin xem xét thủ công không (khi 0.40 <= score < 0.85). */
    private boolean requiresReview;
}
