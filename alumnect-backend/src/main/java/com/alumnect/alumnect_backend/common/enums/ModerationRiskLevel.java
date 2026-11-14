package com.alumnect.alumnect_backend.common.enums;

import lombok.Getter;

/**
 * Mức rủi ro kiểm duyệt, là nguồn duy nhất của các ngưỡng điểm dùng khi hiển thị và lọc báo cáo (UC123).
 */
@Getter
public enum ModerationRiskLevel {
    /** Vi phạm nghiêm trọng, nội dung bị tự động ẩn. */
    HIGH(0.60, null),

    /** Cần Admin xem xét, nội dung vẫn hiển thị. */
    MEDIUM(0.20, 0.60),

    /** An toàn hoặc chỉ có tín hiệu yếu. */
    LOW(null, 0.20);

    /**
     * Điểm rủi ro cộng thêm cho mỗi lượt người dùng báo cáo bài viết (10%).
     * Không tính báo cáo do hệ thống tạo và báo cáo Admin đã bỏ qua.
     */
    public static final double USER_REPORT_RISK_BONUS = 0.10;

    /** Ngưỡng dưới (bao gồm), null nếu không giới hạn. */
    private final Double minScore;

    /** Ngưỡng trên (không bao gồm), null nếu không giới hạn. */
    private final Double maxScore;

    ModerationRiskLevel(Double minScore, Double maxScore) {
        this.minScore = minScore;
        this.maxScore = maxScore;
    }

    /**
     * Xác định mức rủi ro từ điểm số.
     *
     * @param score Điểm rủi ro, null được coi là thấp
     * @return Mức rủi ro tương ứng
     */
    public static ModerationRiskLevel fromScore(Double score) {
        if (score == null) {
            return LOW;
        }
        if (score >= HIGH.minScore) {
            return HIGH;
        }
        return score >= MEDIUM.minScore ? MEDIUM : LOW;
    }

    /**
     * Tính điểm rủi ro tổng hợp của bài viết bị báo cáo.
     * Mô tả chi tiết: lấy điểm chấm nội dung rồi cộng thêm {@link #USER_REPORT_RISK_BONUS} cho mỗi lượt
     * người dùng báo cáo, tối đa 1.00.
     *
     * @param contentScore    Điểm chấm nội dung (cột ai_score), null được coi là 0
     * @param userReportCount Số lượt người dùng báo cáo bài viết còn hiệu lực
     * @return Điểm rủi ro tổng hợp trong khoảng 0.00 đến 1.00
     */
    public static double combinedScore(Double contentScore, long userReportCount) {
        double base = contentScore == null ? 0.0 : contentScore;
        double score = Math.min(1.0, base + USER_REPORT_RISK_BONUS * Math.max(0L, userReportCount));
        // Làm tròn 4 chữ số để bỏ sai số dấu phẩy động (0.1 * 3 = 0.30000000000000004) khi so với ngưỡng
        return Math.round(score * 10_000) / 10_000.0;
    }

    /**
     * Đọc mức rủi ro từ tham số truy vấn.
     *
     * @param value Giá trị tham số, không phân biệt hoa thường
     * @return Mức rủi ro, hoặc null nếu trống, là ALL hoặc không hợp lệ (bỏ qua bộ lọc)
     */
    public static ModerationRiskLevel parse(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
