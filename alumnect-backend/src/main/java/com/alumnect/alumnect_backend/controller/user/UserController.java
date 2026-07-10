package com.alumnect.alumnect_backend.controller.user;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.user.ChangePasswordRequest;
import com.alumnect.alumnect_backend.dto.response.user.UserProfileResponse;
import com.alumnect.alumnect_backend.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


/**
 * Controller xử lý các yêu cầu liên quan đến quản lý thông tin tài khoản người dùng.
 * Được map tự động với prefix global /api/v1/users.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * API Đổi mật khẩu tài khoản người dùng hiện tại.
     * Tiếp nhận dữ liệu, kiểm tra hợp lệ DTO, lấy email tài khoản đăng nhập từ token để tiến hành đổi.
     *
     * @param request DTO chứa mật khẩu cũ, mật khẩu mới và xác nhận
     * @return Response phản hồi đổi mật khẩu thành công
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.changePassword(email, request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công!", null));
    }

    /**
     * API Lấy thông tin hồ sơ cá nhân của người dùng hiện tại (Own Profile).
     * Yêu cầu xác thực JWT qua Token.
     *
     * @return Response phản hồi chứa DTO hồ sơ cá nhân
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getOwnProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserProfileResponse profile = userService.getOwnProfile(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ cá nhân thành công!", profile));
    }

    /**
     * API Lấy thông tin hồ sơ cá nhân của người dùng khác qua ID (Other Profile).
     * Endpoint này là công khai, không yêu cầu xác thực JWT.
     *
     * @param userId ID của người dùng cần xem hồ sơ
     * @return Response phản hồi chứa DTO hồ sơ cá nhân
     */
    @GetMapping("/profile/{userId}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserProfile(@PathVariable Long userId) {
        UserProfileResponse profile = userService.getUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ người dùng thành công!", profile));
    }
}

