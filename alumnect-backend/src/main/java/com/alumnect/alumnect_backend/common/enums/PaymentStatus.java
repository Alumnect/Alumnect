package com.alumnect.alumnect_backend.common.enums;

/**
 * Enum trạng thái giao dịch thanh toán (Payment Status).
 * Quản lý vòng đời trạng thái thanh toán từ lúc tạo đơn PayOS tới khi nhận kết quả.
 */
public enum PaymentStatus {
    /** Đang chờ khách hàng thanh toán qua VietQR / cổng PayOS */
    PENDING,

    /** Giao dịch thanh toán thành công đã được Payment Gateway xác nhận */
    PAID,

    /** Giao dịch thanh toán thất bại */
    FAILED,

    /** Giao dịch hết hạn thanh toán (quá thời hạn hiệu lực của đơn) */
    EXPIRED,

    /** Giao dịch bị người dùng hoặc hệ thống chủ động hủy */
    CANCELLED
}
