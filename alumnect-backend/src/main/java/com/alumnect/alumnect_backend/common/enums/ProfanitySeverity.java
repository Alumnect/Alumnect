package com.alumnect.alumnect_backend.common.enums;

/**
 * Mức độ nghiêm trọng của một từ khóa vi phạm, dùng để chấm điểm rủi ro nội dung (UC123).
 */
public enum ProfanitySeverity {
    /** Tín hiệu yếu: viết tắt hoặc từ đồng dạng khi bỏ dấu, tự nó không kích hoạt hành động kiểm duyệt. */
    WEAK,

    /** Xúc phạm hoặc thô tục mức trung bình, một mình đủ đưa nội dung vào hàng chờ Admin xem xét. */
    OFFENSIVE,

    /** Tục tĩu nặng hoặc đe dọa rõ nghĩa, là tín hiệu mạnh nhất của bộ lọc. */
    SEVERE;

    /**
     * Hạ mức nghiêm trọng xuống một bậc, dùng khi cụm từ cấm được gõ không dấu nên có thể trùng từ bình thường.
     *
     * @return Mức liền dưới, hoặc WEAK nếu đã ở mức thấp nhất
     */
    public ProfanitySeverity downgrade() {
        return this == SEVERE ? OFFENSIVE : WEAK;
    }
}
