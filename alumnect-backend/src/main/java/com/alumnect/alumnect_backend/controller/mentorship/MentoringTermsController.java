package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsAcceptResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTermsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tiếp nhận và xử lý các yêu cầu liên quan đến Điều khoản Hướng dẫn & Hỗ trợ (UC90).
 * Cung cấp API kiểm tra trạng thái điều khoản (Terms Gate) và API ghi nhận chấp nhận điều khoản.
 * Tiền tố toàn cục "/api/v1" được cấu hình tự động thông qua WebMvcConfig.
 */
@Slf4j
@RestController
@RequestMapping("/mentoring/terms")
@RequiredArgsConstructor
@Tag(name = "Mentoring Terms", description = "Các API kiểm tra và chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (UC90)")
public class MentoringTermsController {

    private final MentoringTermsService mentoringTermsService;

    /**
     * API Kiểm tra trạng thái chấp nhận Điều khoản Hướng dẫn & Hỗ trợ hiện tại của người dùng.
     * Người dùng được xác thực qua Bearer JWT Token trong Security Context.
     *
     * @return ResponseEntity chứa ApiResponse bọc đối tượng MentoringTermsStatusResponse
     */
    @GetMapping("/status")
    @Operation(summary = "Kiểm tra trạng thái điều khoản", description = "Lấy trạng thái chấp nhận phiên bản điều khoản hiện tại của người dùng đang đăng nhập")
    public ResponseEntity<ApiResponse<MentoringTermsStatusResponse>> getTermsStatus() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        MentoringTermsStatusResponse response = mentoringTermsService.getCurrentTermsStatus(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái điều khoản thành công", response));
    }

    /**
     * API Ghi nhận người dùng chấp nhận Điều khoản Hướng dẫn & Hỗ trợ cho phiên bản hiện tại.
     * Người dùng được xác thực qua Bearer JWT Token trong Security Context.
     * Không nhận userId từ client; tự động dùng phiên bản điều khoản hiện tại của hệ thống.
     * API có tính chất idempotent: gọi nhiều lần vẫn trả về kết quả thành công và không sinh dữ liệu trùng lặp.
     *
     * @return ResponseEntity chứa ApiResponse bọc đối tượng MentoringTermsAcceptResponse
     */
    @PostMapping("/accept")
    @Operation(summary = "Chấp nhận điều khoản hướng dẫn & hỗ trợ", description = "Ghi nhận chấp nhận phiên bản điều khoản hiện tại vào cơ sở dữ liệu")
    public ResponseEntity<ApiResponse<MentoringTermsAcceptResponse>> acceptTerms() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        MentoringTermsAcceptResponse response = mentoringTermsService.acceptCurrentTerms(email);
        return ResponseEntity.ok(ApiResponse.success("Chấp nhận điều khoản thành công", response));
    }
}
