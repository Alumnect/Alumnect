package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.CreateMentoringRequestResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorDetailResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentorDetailService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tiếp nhận và xử lý yêu cầu Xem chi tiết Mentor (UC99) và Gửi yêu cầu cố vấn trực tiếp (UC101).
 * Cung cấp API trả về đầy đủ thông tin công khai của Mentor và tiếp nhận Direct Mentoring Request.
 * Tiền tố toàn cục "/api/v1" được cấu hình tự động thông qua WebMvcConfig.
 */
@Slf4j
@RestController
@RequestMapping({"/mentors", "/mentoring/mentors"})
@RequiredArgsConstructor
@Tag(name = "Mentor Detail & Direct Request", description = "Các API phục vụ Xem chi tiết Mentor (UC99) và Gửi yêu cầu cố vấn trực tiếp (UC101)")
public class MentorDetailController {

    private final MentorDetailService mentorDetailService;
    private final MentoringRequestService mentoringRequestService;

    /**
     * API Xem chi tiết hồ sơ công khai của một Mentor theo định danh.
     * Hỗ trợ hai đường dẫn chuẩn:
     * - GET /api/v1/mentors/{mentorId}
     * - GET /api/v1/mentoring/mentors/{mentorId}
     * Ràng buộc regex {mentorId:\\d+} để phân biệt rõ ràng với các subpath chữ như /filter-options.
     *
     * @param mentorId Định danh số nguyên của Mentor (mentorProfileId hoặc userId)
     * @return ResponseEntity chứa ApiResponse bọc đối tượng MentorDetailResponse
     */
    @GetMapping({"/{mentorId:\\d+}", "/detail/{mentorId:\\d+}"})
    @Operation(
            summary = "Xem chi tiết hồ sơ Mentor (UC99)",
            description = "Truy xuất toàn bộ thông tin công khai, chuyên môn, kinh nghiệm, lĩnh vực hỗ trợ, điểm uy tín và trạng thái sẵn sàng nhận yêu cầu cố vấn của Mentor"
    )
    public ResponseEntity<ApiResponse<MentorDetailResponse>> getMentorDetail(
            @Parameter(description = "Định danh số của Mentor (ID hồ sơ mentor_profiles hoặc ID tài khoản users)", required = true)
            @PathVariable("mentorId") Long mentorId
    ) {
        log.info("Client yêu cầu xem chi tiết hồ sơ Mentor với mentorId={}", mentorId);

        MentorDetailResponse response = mentorDetailService.getMentorDetail(mentorId);

        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết Mentor thành công", response));
    }

    /**
     * API Gửi yêu cầu cố vấn trực tiếp tới Mentor đích (UC101 — Direct Mentoring Request).
     * Đường dẫn:
     * - POST /api/v1/mentors/{mentorId}/requests
     * - POST /api/v1/mentoring/mentors/{mentorId}/requests
     *
     * @param mentorId Định danh số của Mentor được chọn
     * @param request DTO chứa thông tin yêu cầu tạo
     * @return ResponseEntity chứa ApiResponse bọc đối tượng CreateMentoringRequestResponse
     */
    @PostMapping({"/{mentorId:\\d+}/requests", "/detail/{mentorId:\\d+}/requests"})
    @Operation(
            summary = "Gửi yêu cầu cố vấn trực tiếp tới Mentor (UC101)",
            description = "Cho phép sinh viên gửi yêu cầu cố vấn trực tiếp tới Mentor đích mà không qua cơ chế tự động matching"
    )
    public ResponseEntity<ApiResponse<CreateMentoringRequestResponse>> sendDirectMentoringRequest(
            @Parameter(description = "Định danh số của Mentor (ID hồ sơ mentor_profiles hoặc ID tài khoản users)", required = true)
            @PathVariable("mentorId") Long mentorId,
            @Valid @RequestBody CreateMentoringRequestRequest request
    ) {
        request.setMentorId(mentorId);
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Client gửi yêu cầu cố vấn trực tiếp tới mentorId={} từ user: {}", mentorId, email);

        CreateMentoringRequestResponse response = mentoringRequestService.createMentoringRequest(email, request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi yêu cầu cố vấn trực tiếp thành công", response));
    }
}
