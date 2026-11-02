package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.*;
import com.alumnect.alumnect_backend.dto.response.mentorship.*;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskResolutionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý thương lượng, gia hạn và điều chỉnh Task chưa hoàn thành (UC109).
 */
@Slf4j
@RestController
@RequestMapping("/mentoring/tasks")
@RequiredArgsConstructor
@Tag(name = "Mentoring Task Resolutions", description = "Xử lý gia hạn deadline, điều chỉnh task và thỏa thuận dừng task (UC109)")
public class MentoringTaskResolutionController {

    private final MentoringTaskResolutionService resolutionService;
    private final UserRepository userRepository;

    // =========================================================================
    // 1. DEADLINE EXTENSION ENDPOINTS
    // =========================================================================

    @PostMapping("/{taskId}/deadline-extensions")
    @Operation(summary = "Tạo đề xuất gia hạn Deadline Task (UC109)",
               description = "Cho phép Student hoặc Mentor đề xuất hạn chót mới kèm lý do trong Chat for Task")
    public ResponseEntity<ApiResponse<MentoringTaskDeadlineExtensionResponse>> createDeadlineExtension(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateDeadlineExtensionRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskDeadlineExtensionResponse response = resolutionService.createDeadlineExtension(currentUserId, taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo đề xuất gia hạn Deadline thành công", response));
    }

    @PutMapping("/deadline-extensions/{extensionId}/respond")
    @Operation(summary = "Phản hồi chấp nhận hoặc từ chối đề xuất gia hạn Deadline (UC109)",
               description = "Bên nhận có quyền chấp nhận (cập nhật Deadline mới cho Task) hoặc từ chối")
    public ResponseEntity<ApiResponse<MentoringTaskDeadlineExtensionResponse>> respondDeadlineExtension(
            @PathVariable Long extensionId,
            @Valid @RequestBody RespondDeadlineExtensionRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskDeadlineExtensionResponse response = resolutionService.respondDeadlineExtension(currentUserId, extensionId, request);
        return ResponseEntity.ok(ApiResponse.success("Phản hồi đề xuất gia hạn thành công", response));
    }

    @PutMapping("/deadline-extensions/{extensionId}/cancel")
    @Operation(summary = "Mentor hủy đề xuất gia hạn Deadline đang chờ phản hồi")
    public ResponseEntity<ApiResponse<MentoringTaskDeadlineExtensionResponse>> cancelDeadlineExtension(@PathVariable Long extensionId) {
        return ResponseEntity.ok(ApiResponse.success("Đã hủy đề xuất gia hạn",
                resolutionService.cancelDeadlineExtension(getCurrentUserId(), extensionId)));
    }

    @PutMapping("/amendments/{amendmentId}/cancel")
    @Operation(summary = "Mentor hủy đề xuất điều chỉnh / Học viên từ chối thanh toán bổ sung")
    public ResponseEntity<ApiResponse<MentoringTaskAmendmentResponse>> cancelTaskAmendment(
            @PathVariable Long amendmentId,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.success("Đã đóng đề xuất điều chỉnh",
                resolutionService.cancelTaskAmendment(getCurrentUserId(), amendmentId, body != null ? body.get("reason") : null)));
    }

    @PutMapping("/settlement-proposals/{proposalId}/cancel")
    @Operation(summary = "Người tạo hủy đề xuất dừng Task đang chờ phản hồi")
    public ResponseEntity<ApiResponse<MentoringTaskSettlementProposalResponse>> cancelSettlementProposal(@PathVariable Long proposalId) {
        return ResponseEntity.ok(ApiResponse.success("Đã hủy đề xuất dừng Task",
                resolutionService.cancelSettlementProposal(getCurrentUserId(), proposalId)));
    }

    @GetMapping("/{taskId}/deadline-extensions")
    @Operation(summary = "Lấy lịch sử các đề xuất gia hạn Deadline của Task (UC109)")
    public ResponseEntity<ApiResponse<List<MentoringTaskDeadlineExtensionResponse>>> getDeadlineExtensions(
            @PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        List<MentoringTaskDeadlineExtensionResponse> response = resolutionService.getDeadlineExtensions(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đề xuất gia hạn thành công", response));
    }

    @GetMapping("/{taskId}/deadline-extensions/active")
    @Operation(summary = "Lấy đề xuất gia hạn Deadline đang chờ xử lý của Task (UC109)")
    public ResponseEntity<ApiResponse<MentoringTaskDeadlineExtensionResponse>> getActiveExtension(
            @PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskDeadlineExtensionResponse response = resolutionService.getActiveExtension(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy đề xuất gia hạn đang hoạt động thành công", response));
    }

    // =========================================================================
    // 2. TASK AMENDMENT ENDPOINTS
    // =========================================================================

    @PostMapping("/{taskId}/amendments")
    @Operation(summary = "Tạo Ticket điều chỉnh Task và bổ sung tiền (UC109, mục 5.8)",
               description = "Điều chỉnh phạm vi, kết quả, thời hạn và số tiền bổ sung")
    public ResponseEntity<ApiResponse<MentoringTaskAmendmentResponse>> createTaskAmendment(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateTaskAmendmentRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskAmendmentResponse response = resolutionService.createTaskAmendment(currentUserId, taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo Ticket điều chỉnh Task thành công", response));
    }

    @PutMapping("/amendments/{amendmentId}/respond")
    @Operation(summary = "Phản hồi Ticket điều chỉnh Task (UC109)")
    public ResponseEntity<ApiResponse<MentoringTaskAmendmentResponse>> respondTaskAmendment(
            @PathVariable Long amendmentId,
            @Valid @RequestBody RespondTaskAmendmentRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskAmendmentResponse response = resolutionService.respondTaskAmendment(currentUserId, amendmentId, request);
        return ResponseEntity.ok(ApiResponse.success("Phản hồi Ticket điều chỉnh Task thành công", response));
    }

    @GetMapping("/{taskId}/amendments")
    @Operation(summary = "Lấy danh sách các phiên bản điều chỉnh của Task (UC109)")
    public ResponseEntity<ApiResponse<List<MentoringTaskAmendmentResponse>>> getTaskAmendments(
            @PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        List<MentoringTaskAmendmentResponse> response = resolutionService.getTaskAmendments(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Ticket điều chỉnh thành công", response));
    }

    @GetMapping("/{taskId}/amendments/active")
    @Operation(summary = "Lấy Ticket điều chỉnh đang chờ xử lý của Task (UC109)")
    public ResponseEntity<ApiResponse<MentoringTaskAmendmentResponse>> getActiveAmendment(
            @PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskAmendmentResponse response = resolutionService.getActiveAmendment(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy Ticket điều chỉnh đang hoạt động thành công", response));
    }

    // =========================================================================
    // 3. SETTLEMENT PROPOSAL ENDPOINTS
    // =========================================================================

    @PostMapping("/{taskId}/settlement-proposals")
    @Operation(summary = "Tạo đề xuất dừng Task và phân chia tiền (UC109, mục 5.6)",
               description = "Thương lượng Mentor Amount và Student Refund")
    public ResponseEntity<ApiResponse<MentoringTaskSettlementProposalResponse>> createSettlementProposal(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateSettlementProposalRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskSettlementProposalResponse response = resolutionService.createSettlementProposal(currentUserId, taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo đề xuất dừng Task và phân chia tiền thành công", response));
    }

    @PutMapping("/settlement-proposals/{proposalId}/respond")
    @Operation(summary = "Phản hồi đề xuất dừng Task và phân chia tiền (UC109)")
    public ResponseEntity<ApiResponse<MentoringTaskSettlementProposalResponse>> respondSettlementProposal(
            @PathVariable Long proposalId,
            @Valid @RequestBody RespondSettlementProposalRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskSettlementProposalResponse response = resolutionService.respondSettlementProposal(currentUserId, proposalId, request);
        return ResponseEntity.ok(ApiResponse.success("Phản hồi đề xuất dừng Task thành công", response));
    }

    @GetMapping("/{taskId}/settlement-proposals")
    @Operation(summary = "Lấy lịch sử đề xuất phân chia tiền dừng Task (UC109)")
    public ResponseEntity<ApiResponse<List<MentoringTaskSettlementProposalResponse>>> getSettlementProposals(
            @PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        List<MentoringTaskSettlementProposalResponse> response = resolutionService.getSettlementProposals(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đề xuất dừng Task thành công", response));
    }

    @GetMapping("/{taskId}/settlement-proposals/active")
    @Operation(summary = "Lấy đề xuất dừng Task đang chờ xử lý (UC109)")
    public ResponseEntity<ApiResponse<MentoringTaskSettlementProposalResponse>> getActiveSettlementProposal(
            @PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskSettlementProposalResponse response = resolutionService.getActiveSettlementProposal(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy đề xuất dừng Task đang hoạt động thành công", response));
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng đang đăng nhập."));
        return user.getId();
    }
}
