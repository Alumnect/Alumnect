package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.SelectMentorPackageRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorPackageResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorSubscriptionResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentorSubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller xử lý các yêu cầu API liên quan đến Xem & Chọn gói Mentor (UC92).
 * Cung cấp thông tin các gói dịch vụ, tạo đăng ký chờ thanh toán và lấy thông tin gói hiện tại.
 */
@RestController
@RequestMapping("/mentoring/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Mentor Subscriptions", description = "Các API phục vụ Xem & Chọn gói Mentor (UC92)")
public class MentorSubscriptionController {

    private final MentorSubscriptionService mentorSubscriptionService;

    /**
     * API lấy danh sách các gói dịch vụ Mentor đang hoạt động (ACTIVE).
     *
     * @return Phản hồi chuẩn chứa danh sách các gói dịch vụ Mentor
     */
    @GetMapping("/packages")
    @Operation(summary = "Lấy danh sách các gói dịch vụ Mentor đang hoạt động", description = "Trả về danh sách các gói Mentor khả dụng (1 tháng, 3 tháng, 6 tháng) do Admin cấu hình")
    public ResponseEntity<ApiResponse<List<MentorPackageResponse>>> getActivePackages() {
        List<MentorPackageResponse> packages = mentorSubscriptionService.getActivePackages();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách gói dịch vụ Mentor thành công", packages));
    }

    /**
     * API lựa chọn một gói Mentor cho hồ sơ người dùng (UC92).
     *
     * @param request DTO chứa ID của gói dịch vụ được chọn
     * @return Phản hồi chuẩn chứa thông tin đăng ký gói chờ thanh toán
     */
    @PostMapping("/select-package")
    @Operation(summary = "Lựa chọn gói dịch vụ Mentor", description = "Lựa chọn gói dịch vụ Mentor và tạo thông tin chờ thanh toán cho UC93")
    public ResponseEntity<ApiResponse<MentorSubscriptionResponse>> selectPackage(
            @Valid @RequestBody SelectMentorPackageRequest request
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        MentorSubscriptionResponse response = mentorSubscriptionService.selectPackage(email, request);
        return ResponseEntity.ok(ApiResponse.success("Lựa chọn gói Mentor thành công. Thông tin thanh toán đã sẵn sàng.", response));
    }

    /**
     * API lấy thông tin gói đăng ký Mentor hiện tại hoặc chờ thanh toán của người dùng.
     *
     * @return Phản hồi chuẩn chứa thông tin đăng ký gói Mentor
     */
    @GetMapping("/my-subscription")
    @Operation(summary = "Lấy thông tin gói Mentor của tôi", description = "Trả về thông tin đăng ký gói Mentor mới nhất của người dùng đăng nhập")
    public ResponseEntity<ApiResponse<MentorSubscriptionResponse>> getMySubscription() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        MentorSubscriptionResponse response = mentorSubscriptionService.getMySubscription(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin đăng ký gói Mentor thành công", response));
    }
}
