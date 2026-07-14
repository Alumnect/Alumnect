package com.alumnect.alumnect_backend.service.mail;

/**
 * Interface định nghĩa dịch vụ gửi email trong hệ thống.
 */
public interface MailService {

    /**
     * Gửi email chứa mã OTP và link kích hoạt tài khoản cho người dùng.
     *
     * @param toEmail Địa chỉ email nhận
     * @param token Chuỗi mã OTP 6 số
     * @param fullName Họ tên đầy đủ của người nhận
     */
    void sendVerificationEmail(String toEmail, String token, String fullName);
}
