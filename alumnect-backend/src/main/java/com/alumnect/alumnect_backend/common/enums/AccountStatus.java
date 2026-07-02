package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái tài khoản của người dùng trong hệ thống.
 * Được lưu trong cột account_status của bảng users.
 */
public enum AccountStatus {
    PENDING,           // Mới đăng ký, chờ xác nhận email
    ACTIVE,            // Đã kích hoạt, có thể đăng nhập
    LOCKED,            // Bị khóa, không thể đăng nhập
    WAITING_APPROVAL   // Alumni đã xác nhận email, chờ Admin phê duyệt
}
