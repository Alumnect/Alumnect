package com.alumnect.alumnect_backend.controller.verification;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.verification.SubmitVerificationRequestDto;
import com.alumnect.alumnect_backend.dto.response.verification.VerificationStatusResponseDto;
import com.alumnect.alumnect_backend.service.verification.VerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý các API liên quan đến xác minh và nâng cấp tài khoản từ Sinh viên lên Cựu sinh viên (UC08).
 * Được tự động ánh xạ với tiền tố toàn cục /api/v1/verifications.
 */
@RestController
@RequestMapping("/verifications")
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    /**
     * API lấy trạng thái yêu cầu xác minh / nâng cấp Cựu sinh viên gần nhất của người dùng hiện tại.
     * Yêu cầu xác thực bằng JWT Token.
     *
     * @return ResponseEntity chứa thông tin trạng thái xác minh bọc trong {@link ApiResponse}
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<VerificationStatusResponseDto>> getMyVerificationStatus() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        VerificationStatusResponseDto status = verificationService.getMyVerificationStatus(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái xác minh cựu sinh viên thành công!", status));
    }

    /**
     * API gửi yêu cầu nâng cấp tài khoản từ Sinh viên (STUDENT) lên Cựu sinh viên (ALUMNI).
     * Yêu cầu người dùng đang đăng nhập với vai trò STUDENT và cung cấp minh chứng tốt nghiệp hợp lệ.
     *
     * @param request DTO chứa đường dẫn minh chứng tốt nghiệp, năm tốt nghiệp và chuyên ngành
     * @return ResponseEntity HTTP 201 Created chứa thông tin phiếu yêu cầu vừa gửi
     */
    @PostMapping("/upgrade-alumni")
    public ResponseEntity<ApiResponse<VerificationStatusResponseDto>> submitAlumniUpgradeRequest(
            @Valid @RequestBody SubmitVerificationRequestDto request
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        VerificationStatusResponseDto result = verificationService.submitAlumniUpgradeRequest(email, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.success(
                        "Gửi yêu cầu nâng cấp Cựu sinh viên thành công! Hồ sơ của bạn đang chờ Quản trị viên xét duyệt.",
                        result
                )
        );
    }
}
