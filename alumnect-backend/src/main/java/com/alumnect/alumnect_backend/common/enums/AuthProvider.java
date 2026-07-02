package com.alumnect.alumnect_backend.common.enums;

/**
 * Phương thức đăng nhập của người dùng.
 * Được lưu trong cột auth_provider của bảng users.
 */
public enum AuthProvider {
    LOCAL,   // Đăng ký/đăng nhập bằng email & mật khẩu thông thường
    GOOGLE   // Đăng nhập qua Google OAuth2
}
