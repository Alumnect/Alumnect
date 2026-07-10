package com.alumnect.alumnect_backend.service.auth;

import com.alumnect.alumnect_backend.dto.request.auth.LoginRequest;
import com.alumnect.alumnect_backend.dto.request.auth.RegisterRequest;
import com.alumnect.alumnect_backend.dto.request.auth.RefreshRequest;
import com.alumnect.alumnect_backend.dto.request.auth.GoogleLoginRequest;
import com.alumnect.alumnect_backend.dto.request.auth.GoogleRegisterRequest;
import com.alumnect.alumnect_backend.dto.request.auth.LogoutRequest;
import com.alumnect.alumnect_backend.dto.response.auth.LoginResponse;

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

    /**
     * Đăng nhập hệ thống (Local Login).
     *
     * @param request DTO chứa thông tin email và mật khẩu
     * @param userAgent Thông tin trình duyệt/thiết bị của client
     * @param ipAddress Địa chỉ IP của client
     * @return DTO chứa cặp tokens và thông tin tài khoản cơ bản
     */
    LoginResponse login(LoginRequest request, String userAgent, String ipAddress);

    /**
     * Làm mới Access Token bằng Refresh Token.
     *
     * @param request DTO chứa mã refresh token
     * @param userAgent Thông tin trình duyệt/thiết bị của client
     * @param ipAddress Địa chỉ IP của client
     * @return DTO chứa cặp tokens mới
     */
    LoginResponse refresh(RefreshRequest request, String userAgent, String ipAddress);

    /**
     * Đăng nhập vào hệ thống sử dụng tài khoản Google.
     * Xác thực Google ID Token, kiểm tra tài khoản liên kết, và trả về cặp tokens.
     *
     * @param request DTO chứa Google ID token
     * @param userAgent Thông tin trình duyệt/thiết bị của client
     * @param ipAddress Địa chỉ IP của client
     * @return DTO chứa cặp tokens và thông tin tài khoản cơ bản
     */
    LoginResponse loginWithGoogle(GoogleLoginRequest request, String userAgent, String ipAddress);

    /**
     * Đăng ký tài khoản người dùng mới sử dụng tài khoản Google.
     * Xác thực token, lấy email từ Google, kiểm tra thông tin bổ sung và lưu vào DB.
     *
     * @param request DTO chứa Google ID token cùng các thông tin hồ sơ bổ sung
     * @param userAgent Thông tin trình duyệt/thiết bị của client
     * @param ipAddress Địa chỉ IP của client
     * @return DTO chứa cặp tokens và thông tin tài khoản cơ bản sau khi đăng ký
     */
    LoginResponse registerWithGoogle(GoogleRegisterRequest request, String userAgent, String ipAddress);

    /**
     * Đăng xuất khỏi hệ thống.
     * Thu hồi và xóa bỏ Refresh Token khỏi CSDL.
     *
     * @param request DTO chứa mã refresh token cần hủy
     */
    void logout(LogoutRequest request);

    /**
     * Đăng xuất người dùng khỏi tất cả các thiết bị bằng cách thu hồi toàn bộ refresh token.
     *
     * @param email Địa chỉ email của người dùng
     */
    void logoutAllDevices(String email);
}
