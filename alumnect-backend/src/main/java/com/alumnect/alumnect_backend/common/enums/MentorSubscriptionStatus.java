package com.alumnect.alumnect_backend.common.enums;

/**
 * Enum trạng thái đăng ký / thanh toán gói Mentor.
 */
public enum MentorSubscriptionStatus {
    /** Đã chọn gói, đang chờ thanh toán qua PayOS (UC92 -> UC93) */
    PENDING_PAYMENT,

    /** Đã hoàn tất thanh toán thành công và gói đang kích hoạt (UC93) */
    PAID,

    /** Giao dịch thanh toán bị hủy hoặc không thành công */
    CANCELLED,

    /** Đăng ký gói đã hết hạn thời gian sử dụng */
    EXPIRED
}
