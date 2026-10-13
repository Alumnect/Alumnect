package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái của Deadline Extension Ticket (UC109).
 */
public enum MentoringExtensionStatus {
    /** Đang chờ bên còn lại phản hồi xác nhận hoặc từ chối */
    PENDING,

    /** Đã được bên còn lại chấp nhận (Deadline của Task được cập nhật) */
    CONFIRMED,

    /** Bị bên còn lại từ chối gia hạn */
    REJECTED,

    /** Đã bị thay thế bởi một đề xuất gia hạn mới hơn */
    SUPERSEDED
}
