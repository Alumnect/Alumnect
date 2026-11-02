package com.alumnect.alumnect_backend.common.enums;

/**
 * Phân loại đối tượng nhận thông báo hệ thống.
 */
public enum RecipientType {
    /**
     * Gửi cho một người dùng cụ thể.
     */
    SPECIFIC_USER,

    /**
     * Gửi theo nhóm vai trò (STUDENT, ALUMNI, ADMIN).
     */
    USER_ROLE,

    /**
     * Gửi cho toàn bộ người dùng trong hệ thống.
     */
    ALL_USERS
}
