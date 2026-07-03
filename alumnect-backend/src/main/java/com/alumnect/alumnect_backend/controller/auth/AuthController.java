package com.alumnect.alumnect_backend.controller.auth;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.auth.RegisterRequest;
import com.alumnect.alumnect_backend.dto.request.auth.GoogleLoginRequest;
import com.alumnect.alumnect_backend.dto.request.auth.GoogleRegisterRequest;
import com.alumnect.alumnect_backend.service.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các yêu cầu liên quan đến xác thực và đăng ký tài khoản (STUDENT và ALUMNI).
 * Được map tự động với prefix global /api/v1/auth.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * API Đăng ký tài khoản mới.
     * Tiếp nhận dữ liệu, kiểm tra hợp lệ qua @Valid, lưu tài khoản tạm thời và gửi mã OTP.
     *
     * @param request DTO chứa thông tin đăng ký của người dùng
     * @return Response phản hồi đăng ký thành công kèm thông báo hướng dẫn kích hoạt
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.", null));
    }

    /**
     * API Xác thực email.
     * Xác nhận tài khoản dựa trên địa chỉ email và chuỗi OTP truyền qua Request Parameter.
     *
     * @param email Địa chỉ email của tài khoản cần xác nhận
     * @param token Chuỗi mã OTP 6 số nhận từ người dùng
     * @return Response phản hồi kích hoạt tài khoản thành công tùy theo vai trò (STUDENT/ALUMNI)
     */
    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@RequestParam("email") String email, @RequestParam("token") String token) {
        String role = authService.verifyEmail(email, token);
        String message = role.equals("ALUMNI")
                ? "Xác thực email thành công! Tài khoản của bạn đang chờ quản trị viên phê duyệt."
                : "Xác thực email thành công! Tài khoản của bạn đã được kích hoạt.";
        return ResponseEntity.ok(ApiResponse.success(message, null));
    }

    /**
     * API Gửi lại mã OTP xác thực email.
     * Áp dụng giới hạn thời gian chờ 5 phút giữa các lần gửi.
     *
     * @param email Địa chỉ email yêu cầu gửi lại mã
     * @return Response phản hồi gửi lại mã thành công
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(@RequestParam("email") String email) {
        authService.resendOtp(email);
        return ResponseEntity.ok(ApiResponse.success("Gửi lại mã OTP thành công! Vui lòng kiểm tra email của bạn.", null));
    }

    /**
     * API Đăng nhập hệ thống (Local Login).
     *
     * @param request DTO chứa thông tin đăng nhập (email + password)
     * @param userAgent Header User-Agent từ client
     * @param httpRequest Đối tượng request HTTP để lấy địa chỉ IP
     * @return Response chứa thông tin đăng nhập thành công kèm cặp Access/Refresh Token
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<com.alumnect.alumnect_backend.dto.response.auth.LoginResponse>> login(
            @Valid @RequestBody com.alumnect.alumnect_backend.dto.request.auth.LoginRequest request,
            @RequestHeader(value = "User-Agent", defaultValue = "") String userAgent,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        com.alumnect.alumnect_backend.dto.response.auth.LoginResponse response = authService.login(request, userAgent, ipAddress);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công!", response));
    }

    /**
     * API Làm mới Access Token (Refresh Token).
     *
     * @param request DTO chứa mã refresh token
     * @param userAgent Header User-Agent từ client
     * @param httpRequest Đối tượng request HTTP để lấy địa chỉ IP
     * @return Response chứa cặp Access/Refresh Token mới
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<com.alumnect.alumnect_backend.dto.response.auth.LoginResponse>> refresh(
            @Valid @RequestBody com.alumnect.alumnect_backend.dto.request.auth.RefreshRequest request,
            @RequestHeader(value = "User-Agent", defaultValue = "") String userAgent,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        com.alumnect.alumnect_backend.dto.response.auth.LoginResponse response = authService.refresh(request, userAgent, ipAddress);
        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công!", response));
    }

    /**
     * API Đăng nhập bằng Google OAuth2.
     * Xác thực token, kiểm tra tài khoản, trả về cặp tokens hoặc báo lỗi nếu chưa đăng ký.
     *
     * @param request DTO chứa Google ID token
     * @param userAgent Header User-Agent từ client
     * @param httpRequest Đối tượng request HTTP để lấy địa chỉ IP
     * @return Response chứa cặp Access/Refresh Token và thông tin tài khoản
     */
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<com.alumnect.alumnect_backend.dto.response.auth.LoginResponse>> loginWithGoogle(
            @Valid @RequestBody GoogleLoginRequest request,
            @RequestHeader(value = "User-Agent", defaultValue = "") String userAgent,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        com.alumnect.alumnect_backend.dto.response.auth.LoginResponse response = authService.loginWithGoogle(request, userAgent, ipAddress);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập bằng Google thành công!", response));
    }

    /**
     * API Đăng ký tài khoản mới bằng Google OAuth2.
     * Nhận Google ID token và thông tin hồ sơ bổ sung để đăng ký.
     *
     * @param request DTO chứa Google ID token cùng các thông tin hồ sơ bổ sung
     * @param userAgent Header User-Agent từ client
     * @param httpRequest Đối tượng request HTTP để lấy địa chỉ IP
     * @return Response chứa cặp Access/Refresh Token và thông tin tài khoản
     */
    @PostMapping("/google/register")
    public ResponseEntity<ApiResponse<com.alumnect.alumnect_backend.dto.response.auth.LoginResponse>> registerWithGoogle(
            @Valid @RequestBody GoogleRegisterRequest request,
            @RequestHeader(value = "User-Agent", defaultValue = "") String userAgent,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String ipAddress = httpRequest.getRemoteAddr();
        com.alumnect.alumnect_backend.dto.response.auth.LoginResponse response = authService.registerWithGoogle(request, userAgent, ipAddress);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tài khoản qua Google thành công!", response));
    }
}
