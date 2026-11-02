package com.alumnect.alumnect_backend.common.enums;

/**
 * Enum trạng thái đăng ký / duy trì gói Mentor.
 * Phân định rõ trạng thái hiệu lực của subscription (PENDING_PAYMENT, ACTIVE, EXPIRED, CANCELLED).
 */
public enum MentorSubscriptionStatus {
    /** Đã chọn gói, đang chờ thanh toán qua PayOS (UC92 -> UC93) */
    PENDING_PAYMENT,

    /** Gói dịch vụ đã thanh toán thành công và đang trong thời hạn hiệu lực (UC93) */
    ACTIVE,

    /** Đã hoàn tất thanh toán thành công (tương thích ngược với migration cũ) */
    PAID,

    /** Giao dịch thanh toán bị hủy hoặc không thành công */
    CANCELLED,

    /** Đăng ký gói đã hết hạn thời gian sử dụng */
    EXPIRED
}
