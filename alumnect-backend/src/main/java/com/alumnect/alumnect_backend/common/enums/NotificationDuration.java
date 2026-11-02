package com.alumnect.alumnect_backend.common.enums;

/**
 * Thời hạn hiệu lực của thông báo hệ thống.
 */
public enum NotificationDuration {
    /**
     * Có hiệu lực trong 1 ngày (24 giờ).
     */
    ONE_DAY,

    /**
     * Có hiệu lực trong 1 tuần (7 ngày).
     */
    ONE_WEEK,

    /**
     * Có hiệu lực trong 1 tháng (30 ngày).
     */
    ONE_MONTH,

    /**
     * Có hiệu lực trong 1 năm (365 ngày).
     */
    ONE_YEAR,

    /**
     * Hiệu lực vĩnh viễn (không bao giờ hết hạn).
     */
    FOREVER,

    /**
     * Thời hạn tùy chỉnh do Admin thiết lập mốc expiresAt cụ thể.
     */
    CUSTOM
}
