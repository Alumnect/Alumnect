package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái xử lý của thông báo hệ thống (Admin notification/broadcast).
 */
public enum SystemNotificationStatus {
    /**
     * Bản nháp, chưa gửi.
     */
    DRAFT,

    /**
     * Đã lên lịch hẹn giờ gửi trong tương lai.
     */
    SCHEDULED,

    /**
     * Đang trong tiến trình phát sóng (Scheduler đang xử lý).
     */
    SENDING,

    /**
     * Đã gửi thành công và đang có hiệu lực.
     */
    SENT,

    /**
     * Đang có hiệu lực hiển thị.
     */
    ACTIVE,

    /**
     * Đã hết hạn hiệu lực.
     */
    EXPIRED,

    /**
     * Đã được Admin lưu trữ vào lịch sử (Archive).
     */
    ARCHIVED,

    /**
     * Đã bị hủy trước khi gửi (đối với thông báo hẹn giờ).
     */
    CANCELLED
}
