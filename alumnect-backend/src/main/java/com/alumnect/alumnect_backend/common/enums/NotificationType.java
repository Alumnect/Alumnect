package com.alumnect.alumnect_backend.common.enums;

/**
 * Phân loại các loại thông báo trong hệ thống AlumNect.
 */
public enum NotificationType {
    /**
     * Có người thích bài viết của người dùng.
     */
    POST_LIKE,

    /**
     * Có người bình luận bài viết của người dùng.
     */
    POST_COMMENT,

    /**
     * Có người bắt đầu theo dõi người dùng.
     */
    USER_FOLLOW,

    /**
     * Có người trả lời câu hỏi Q&A của người dùng.
     */
    FORUM_ANSWER,

    /**
     * Báo cáo vi phạm được xử lý (bài viết bị gỡ).
     */
    REPORT_RESOLVED,

    /**
     * Thông báo chào mừng khi tài khoản chuyển sang trạng thái ACTIVE.
     */
    WELCOME,

    /**
     * Thông báo hệ thống / Thông báo phát thanh từ Admin.
     */
    SYSTEM_BROADCAST
}
