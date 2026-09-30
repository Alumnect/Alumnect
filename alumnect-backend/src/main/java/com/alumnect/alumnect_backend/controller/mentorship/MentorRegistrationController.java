package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorRegistrationRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRegistrationResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRegistrationSaveResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentorRegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tiếp nhận và xử lý các yêu cầu liên quan đến Đăng ký trở thành Mentor (UC91).
 * Cung cấp API tải thông tin tổng hợp (auto-fill) và API lưu nháp/hoàn tất đăng ký.
 * Tiền tố toàn cục "/api/v1" được cấu hình tự động qua WebMvcConfig.
 */
@Slf4j
@RestController
@RequestMapping("/mentoring/registration")
@RequiredArgsConstructor
@Tag(name = "Mentor Registration", description = "Các API phục vụ quá trình Đăng ký trở thành Mentor (UC91)")
public class MentorRegistrationController {

    private final MentorRegistrationService mentorRegistrationService;

    /**
     * API Lấy toàn bộ thông tin đăng ký Mentor của Alumni đang đăng nhập.
     * Tự động tổng hợp và tái sử dụng dữ liệu từ UserProfile, Experience, UserSkill và MentorProfile.
     * Người dùng được xác thực qua Bearer JWT Token trong Security Context.
     *
     * @return ResponseEntity chứa ApiResponse bọc đối tượng MentorRegistrationResponse
     */
    @GetMapping
    @Operation(summary = "Lấy thông tin đăng ký Mentor", description = "Lấy toàn bộ thông tin đăng ký và dữ liệu tự động điền (Profile, Experience, Skills, Mentor Data) của Alumni")
    public ResponseEntity<ApiResponse<MentorRegistrationResponse>> getRegistration() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        MentorRegistrationResponse response = mentorRegistrationService.getRegistration(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin đăng ký Mentor thành công", response));
    }

    /**
     * API Lưu hoặc cập nhật thông tin đăng ký Mentor của Alumni (hỗ trợ cả Lưu nháp và Hoàn tất).
     * Người dùng được xác thực qua Bearer JWT Token trong Security Context.
     *
     * @param request DTO chứa các thông tin đăng ký do client gửi lên
     * @return ResponseEntity chứa ApiResponse bọc đối tượng MentorRegistrationSaveResponse
     */
    @PutMapping
    @Operation(summary = "Lưu hoặc cập nhật thông tin đăng ký Mentor", description = "Lưu nháp hoặc hoàn tất đăng ký thông tin Mentor của Alumni")
    public ResponseEntity<ApiResponse<MentorRegistrationSaveResponse>> saveRegistration(
            @Valid @RequestBody MentorRegistrationRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        MentorRegistrationSaveResponse response = mentorRegistrationService.saveRegistration(email, request);
        String message = response.isComplete() ? "Hoàn tất đăng ký thành công" : "Lưu nháp thành công";
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }
}
