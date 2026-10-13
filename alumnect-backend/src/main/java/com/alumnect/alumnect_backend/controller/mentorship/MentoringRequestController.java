package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.CreateMentoringRequestResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorResponseItemResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringRequestDetailResponse;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRequestService;
import java.util.List;
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
     * API Lấy danh sách yêu cầu Mentoring của sinh viên đang đăng nhập (phân trang, UC102).
     * Hỗ trợ cả 2 endpoint:
     * - GET /api/v1/mentoring/requests
     * - GET /api/v1/mentoring/requests/my
     *
     * @param page Số thứ tự trang (mặc định 0)
     * @param size Số lượng bản ghi mỗi trang (mặc định 10)
     * @return ResponseEntity chứa ApiResponse bọc PageResponse
     */
    @GetMapping({"", "/my"})
    @Operation(summary = "Lấy danh sách yêu cầu mentoring của tôi (UC102)", description = "Xem danh sách các yêu cầu mentoring đã tạo của sinh viên hiện tại kèm thống kê phản hồi")
    public ResponseEntity<ApiResponse<PageResponse<CreateMentoringRequestResponse>>> getMyRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        PageResponse<CreateMentoringRequestResponse> response = mentoringRequestService.getMyRequests(email, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu cầu thành công", response));
    }

    /**
     * API Lấy thông tin chi tiết một yêu cầu Mentoring kèm danh sách phản hồi từ các Mentor (UC102).
     * - Nếu GENERAL: Trả về các Mentor thực sự được phân phối.
     * - Nếu DIRECT: Trả về duy nhất Mentor đích.
     * Kiểm tra quyền sở hữu: Chỉ sinh viên tạo mới được xem.
     *
     * @param id ID của yêu cầu Mentoring
     * @return ResponseEntity chứa ApiResponse bọc chi tiết yêu cầu kèm phản hồi
     */
    @GetMapping("/{id:\\d+}")
    @Operation(summary = "Xem chi tiết yêu cầu mentoring và phản hồi của Mentor (UC102)", description = "Lấy thông tin chi tiết một yêu cầu mentoring kèm trạng thái phản hồi của từng Mentor liên quan")
    public ResponseEntity<ApiResponse<MentoringRequestDetailResponse>> getRequestDetail(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        MentoringRequestDetailResponse response = mentoringRequestService.getRequestDetailWithResponses(email, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết yêu cầu thành công", response));
    }

    /**
     * API Lấy danh sách phản hồi từ các Mentor đối với một yêu cầu cụ thể (UC102 sub-resource).
     *
     * @param id ID của yêu cầu Mentoring
     * @return ResponseEntity chứa ApiResponse bọc danh sách MentorResponseItemResponse
     */
    @GetMapping("/{id:\\d+}/responses")
    @Operation(summary = "Lấy danh sách phản hồi của Mentor đối với yêu cầu (UC102)", description = "Trả về danh sách Mentor liên quan và trạng thái phản hồi của từng Mentor")
    public ResponseEntity<ApiResponse<List<MentorResponseItemResponse>>> getRequestResponses(@PathVariable Long id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<MentorResponseItemResponse> response = mentoringRequestService.getRequestResponses(email, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách phản hồi thành công", response));
    }

    // ==============================================================================
    // UC103 — VIEW & RESPOND TO MENTORING REQUESTS (MENTOR INCOMING REQUESTS)
    // ==============================================================================

    /**
     * API Lấy danh sách yêu cầu Mentoring được gửi hoặc phân phối đến Mentor đang đăng nhập (UC103).
     * Endpoint: GET /api/v1/mentoring/requests/incoming
     * Hỗ trợ lọc theo trạng thái phản hồi (status: WAITING, ACCEPTED, DECLINED) và loại yêu cầu (requestType: GENERAL, DIRECT).
     *
     * @param status Trạng thái phản hồi cần lọc (tùy chọn)
     * @param requestType Loại yêu cầu cần lọc GENERAL hoặc DIRECT (tùy chọn)
     * @param page Số thứ tự trang (mặc định 0)
     * @param size Số lượng bản ghi mỗi trang (mặc định 10)
     * @return ResponseEntity chứa ApiResponse bọc PageResponse của MentorIncomingRequestResponse
     */
    @GetMapping("/incoming")
    @Operation(summary = "Lấy danh sách yêu cầu hướng dẫn gửi đến Mentor (UC103)", description = "Xem danh sách các yêu cầu Mentoring được phân phối hoặc gửi trực tiếp tới Mentor hiện tại kèm bộ lọc trạng thái")
    public ResponseEntity<ApiResponse<PageResponse<com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestResponse>>> getIncomingRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String requestType,
            @RequestParam(defaultValue = "ALL") String scope,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Mentor {} truy vấn incoming requests: status={}, requestType={}, scope={}, page={}, size={}",
                email, status, requestType, scope, page, size);

        PageResponse<com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestResponse> response =
                mentoringRequestService.getIncomingRequests(email, status, requestType, scope, page, size);

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách yêu cầu nhận được thành công", response));
    }

    /**
     * API Xem thông tin chi tiết một yêu cầu Mentoring gửi đến Mentor (UC103).
     * Endpoint: GET /api/v1/mentoring/requests/incoming/{requestId}
     * Kiểm tra chặt chẽ: Mentor chỉ xem được yêu cầu thực sự được phân phối/gửi đến mình.
     *
     * @param requestId ID của yêu cầu Mentoring
     * @return ResponseEntity chứa ApiResponse bọc MentorIncomingRequestDetailResponse
     */
    @GetMapping("/incoming/{requestId:\\d+}")
    @Operation(summary = "Xem chi tiết yêu cầu hướng dẫn gửi đến (UC103)", description = "Lấy thông tin chi tiết của một yêu cầu Mentoring dành riêng cho Mentor tiếp nhận")
    public ResponseEntity<ApiResponse<com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestDetailResponse>> getIncomingRequestDetail(
            @PathVariable Long requestId) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Mentor {} xem chi tiết incoming request ID={}", email, requestId);

        com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestDetailResponse response =
                mentoringRequestService.getIncomingRequestDetail(email, requestId);

        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết yêu cầu nhận được thành công", response));
    }

    /**
     * API Mentor chấp nhận (ACCEPT) yêu cầu Mentoring (UC103).
     * Endpoint: POST /api/v1/mentoring/requests/{requestId}/accept
     * Hỗ trợ alias: POST /api/v1/mentoring/requests/incoming/{requestId}/accept
     * Xác thực: Mentor ACTIVE, subscription hợp lệ, yêu cầu OPEN và chưa phản hồi.
     * Lưu ý nghiệp vụ: ACCEPTED chỉ đồng ý trao đổi, KHÔNG tự động tạo Deal hay trừ phí.
     *
     * @param requestId ID của yêu cầu Mentoring
     * @param requestDto DTO chứa lời nhắn phản hồi tùy chọn
     * @return ResponseEntity chứa ApiResponse bọc MentorIncomingRequestDetailResponse đã cập nhật
     */
    @PostMapping({"/{requestId:\\d+}/accept", "/incoming/{requestId:\\d+}/accept"})
    @Operation(summary = "Chấp nhận yêu cầu mentoring (UC103)", description = "Mentor đồng ý tiếp nhận trao đổi với sinh viên về yêu cầu cố vấn")
    public ResponseEntity<ApiResponse<com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestDetailResponse>> acceptIncomingRequest(
            @PathVariable Long requestId,
            @Valid @RequestBody(required = false) com.alumnect.alumnect_backend.dto.request.mentorship.RespondMentoringRequestRequest requestDto) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Mentor {} thực hiện ACCEPT yêu cầu ID={}", email, requestId);

        com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestDetailResponse response =
                mentoringRequestService.acceptIncomingRequest(email, requestId, requestDto);

        return ResponseEntity.ok(ApiResponse.success("Chấp nhận yêu cầu mentoring thành công", response));
    }

    /**
     * API Mentor từ chối (DECLINE) yêu cầu Mentoring (UC103).
     * Endpoint: POST /api/v1/mentoring/requests/{requestId}/decline
     * Hỗ trợ alias: POST /api/v1/mentoring/requests/incoming/{requestId}/decline
     * Xác thực: Mentor ACTIVE, subscription hợp lệ, yêu cầu OPEN và chưa phản hồi.
     *
     * @param requestId ID của yêu cầu Mentoring
     * @param requestDto DTO chứa lời nhắn / lý do từ chối tùy chọn
     * @return ResponseEntity chứa ApiResponse bọc MentorIncomingRequestDetailResponse đã cập nhật
     */
    @PostMapping({"/{requestId:\\d+}/decline", "/incoming/{requestId:\\d+}/decline"})
    @Operation(summary = "Từ chối yêu cầu mentoring (UC103)", description = "Mentor từ chối yêu cầu cố vấn từ sinh viên")
    public ResponseEntity<ApiResponse<com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestDetailResponse>> declineIncomingRequest(
            @PathVariable Long requestId,
            @Valid @RequestBody(required = false) com.alumnect.alumnect_backend.dto.request.mentorship.RespondMentoringRequestRequest requestDto) {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Mentor {} thực hiện DECLINE yêu cầu ID={}", email, requestId);

        com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestDetailResponse response =
                mentoringRequestService.declineIncomingRequest(email, requestId, requestDto);

        return ResponseEntity.ok(ApiResponse.success("Từ chối yêu cầu mentoring thành công", response));
    }
}
