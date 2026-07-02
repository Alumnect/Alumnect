package com.alumnect.alumnect_backend.service.auth;

import com.alumnect.alumnect_backend.dto.request.auth.RegisterRequest;

/**
 * Interface định nghĩa các dịch vụ xác thực và đăng ký tài khoản.
 */
public interface AuthService {

    /**
     * Đăng ký tài khoản người dùng mới (STUDENT hoặc ALUMNI).
     *
     * @param request DTO chứa thông tin đăng ký
     */
    void register(RegisterRequest request);

    /**
     * Xác thực email bằng mã OTP 6 số.
     * Cập nhật trạng thái tài khoản tương ứng với vai trò của người dùng.
     *
     * @param email Địa chỉ email của tài khoản cần xác thực
     * @param token Chuỗi mã OTP 6 số
     * @return Tên vai trò của người dùng (VD: "STUDENT", "ALUMNI") để tạo thông điệp trả về phù hợp
     */
    String verifyEmail(String email, String token);

    /**
     * Gửi lại mã OTP xác thực email mới cho người dùng.
     * Áp dụng giới hạn thời gian chờ 5 phút giữa các lần gửi.
     *
     * @param email Địa chỉ email yêu cầu gửi lại mã
     */
    void resendOtp(String email);
}
