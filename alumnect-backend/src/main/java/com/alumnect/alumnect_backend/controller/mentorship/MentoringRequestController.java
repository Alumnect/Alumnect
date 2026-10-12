package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.CreateMentoringRequestResponse;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRequestService;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller tiếp nhận và xử lý các yêu cầu liên quan đến Yêu cầu Mentoring (UC100 - General & UC101 - Direct).
 * Tiền tố toàn cục "/api/v1" được cấu hình tự động thông qua WebMvcConfig.
 * Endpoint chính: /api/v1/mentoring/requests
 */
@Slf4j
@RestController
@RequestMapping("/mentoring/requests")
@RequiredArgsConstructor
@Tag(name = "Mentoring Request", description = "Các API tạo và quản lý Yêu cầu Mentoring (UC100 & UC101)")
public class MentoringRequestController {

    private final MentoringRequestService mentoringRequestService;

    /**
     * API Tạo mới yêu cầu Mentoring (UC100 hoặc UC101 tùy thuộc vào mentorId trong payload).
     * Yêu cầu xác thực Bearer JWT Token của sinh viên trong Security Context.
     * Hệ thống tự động kiểm tra điều khoản Mentoring (UC90), lưu yêu cầu và điều phối matching nội bộ hoặc gửi trực tiếp.
     *
     * @param request DTO chứa thông tin yêu cầu tạo
     * @return ResponseEntity chứa ApiResponse bọc đối tượng CreateMentoringRequestResponse
     */
    @PostMapping
    @Operation(summary = "Tạo yêu cầu mentoring", description = "Cho phép sinh viên tạo yêu cầu hỗ trợ (chung UC100 nếu mentorId=null hoặc trực tiếp UC101 nếu mentorId được chỉ định)")
    public ResponseEntity<ApiResponse<CreateMentoringRequestResponse>> createMentoringRequest(
            @Valid @RequestBody CreateMentoringRequestRequest request) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Nhận request tạo Mentoring Request từ user: {}, mentorId={}", email, request.getMentorId());

        CreateMentoringRequestResponse response = mentoringRequestService.createMentoringRequest(email, request);
        String successMessage = request.getMentorId() != null
                ? "Gửi yêu cầu cố vấn trực tiếp thành công"
                : "Tạo yêu cầu mentoring thành công";

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(successMessage, response));
    }

    /**
     * API Gửi yêu cầu cố vấn trực tiếp tới Mentor cụ thể (UC101 — Direct Mentoring Request).
     * Cho phép truyền mentorId trên path param hoặc trong request body.
     *
     * @param pathMentorId ID Mentor truyền qua path (tùy chọn)
     * @param request DTO chứa thông tin yêu cầu tạo
     * @return ResponseEntity chứa ApiResponse bọc đối tượng CreateMentoringRequestResponse
     */
    @PostMapping({"/direct", "/direct/{mentorId:\\d+}"})
    @Operation(summary = "Gửi yêu cầu cố vấn trực tiếp (UC101)", description = "Cho phép sinh viên gửi yêu cầu cố vấn trực tiếp tới Mentor đã chọn")
    public ResponseEntity<ApiResponse<CreateMentoringRequestResponse>> createDirectMentoringRequest(
            @PathVariable(value = "mentorId", required = false) Long pathMentorId,
            @Valid @RequestBody CreateMentoringRequestRequest request) {

        if (pathMentorId != null) {
            request.setMentorId(pathMentorId);
        }
        if (request.getMentorId() == null) {
            throw new BadRequestException("Thiếu định danh Mentor (mentorId) cho yêu cầu cố vấn trực tiếp");
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Nhận request gửi Mentoring Request trực tiếp tới mentorId={} từ user: {}", request.getMentorId(), email);

        CreateMentoringRequestResponse response = mentoringRequestService.createMentoringRequest(email, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi yêu cầu cố vấn trực tiếp thành công", response));
    }

    /**
     * API Lấy danh sách yêu cầu Mentoring của sinh viên đang đăng nhập (phân trang).
     *
     * @param page Số thứ tự trang (mặc định 0)
     * @param size Số lượng bản ghi mỗi trang (mặc định 10)
     * @return ResponseEntity chứa ApiResponse bọc PageResponse
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách yêu cầu mentoring của tôi", description = "Xem danh sách các yêu cầu mentoring đã tạo của sinh viên hiện tại")
    public ResponseEntity<ApiResponse<PageResponse<CreateMentoringRequestResponse>>> getMyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        PageResponse<CreateMentoringRequestResponse> response = mentoringRequestService.getMyRequests(email, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu cầu thành công", response));
    }

    /**
     * API Lấy thông tin chi tiết một yêu cầu Mentoring theo ID.
     *
     * @param id ID của yêu cầu Mentoring
     * @return ResponseEntity chứa ApiResponse bọc chi tiết yêu cầu
     */
    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết yêu cầu mentoring", description = "Lấy thông tin chi tiết một yêu cầu mentoring theo ID của sinh viên sở hữu")
    public ResponseEntity<ApiResponse<CreateMentoringRequestResponse>> getRequestDetail(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        CreateMentoringRequestResponse response = mentoringRequestService.getRequestDetail(email, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết yêu cầu thành công", response));
    }
}
