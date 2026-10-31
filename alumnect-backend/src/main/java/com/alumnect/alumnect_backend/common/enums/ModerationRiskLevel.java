package com.alumnect.alumnect_backend.common.enums;

import lombok.Getter;

/**
 * Mức rủi ro kiểm duyệt, là nguồn duy nhất của các ngưỡng điểm dùng khi hiển thị và lọc báo cáo (UC123).
 */
@Getter
public enum ModerationRiskLevel {
    /** Vi phạm nghiêm trọng, nội dung bị tự động ẩn. */
    HIGH(0.85, null),

    /** Cần Admin xem xét, nội dung vẫn hiển thị. */
    MEDIUM(0.40, 0.85),

    /** An toàn hoặc chỉ có tín hiệu yếu. */
    LOW(null, 0.40);

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
