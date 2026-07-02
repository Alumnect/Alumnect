package com.alumnect.alumnect_backend.common.enums;

/**
 * Loại mã OTP được tạo ra trong hệ thống.
 * Được lưu trong cột type của bảng verification_tokens.
 */
public enum VerificationType {
    EMAIL_VERIFICATION, // Mã OTP xác nhận email khi đăng ký
    PASSWORD_RESET      // Mã OTP đặt lại mật khẩu khi quên
}
