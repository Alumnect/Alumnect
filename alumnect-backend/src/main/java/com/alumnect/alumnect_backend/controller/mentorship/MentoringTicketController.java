package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.SubmitSettlementTicketRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDisputeTicketResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringSettlementSnapshotResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTicketService;
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
 * Controller xử lý gửi Settlement Ticket đã thỏa thuận và các Ticket gửi Admin (UC111 & UC112).
 */
@Slf4j
@RestController
@RequestMapping("/mentoring/tasks")
@RequiredArgsConstructor
@Tag(name = "Mentoring Dispute & Settlement Tickets", description = "Quản lý Settlement Tickets và Dispute Tickets gửi Admin (UC111 & UC112)")
public class MentoringTicketController {

    private final MentoringTicketService ticketService;
    private final UserRepository userRepository;

    @GetMapping("/{taskId}/settlement-snapshot")
    @Operation(summary = "Xem ảnh chụp phương án thỏa thuận dừng Task (UC111 - Step 14)",
               description = "Hiển thị thông tin phân chia tiền đã đồng thuận giữa Student và Mentor trước khi tạo Ticket")
    public ResponseEntity<ApiResponse<MentoringSettlementSnapshotResponse>> getSettlementSnapshot(
            @PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        MentoringSettlementSnapshotResponse response = ticketService.getSettlementSnapshot(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin Settlement Snapshot thành công", response));
    }

    @PostMapping("/{taskId}/settlement-tickets")
    @Operation(summary = "Gửi Settlement Ticket đã thỏa thuận lên Admin (UC111)",
               description = "Cho phép Student hoặc Mentor gửi phương án phân chia tiền đã thống nhất lên Admin để giải ngân và hoàn tiền")
    public ResponseEntity<ApiResponse<MentoringDisputeTicketResponse>> submitSettlementTicket(
            @PathVariable Long taskId,
            @Valid @RequestBody SubmitSettlementTicketRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringDisputeTicketResponse response = ticketService.submitSettlementTicket(currentUserId, taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi Settlement Ticket đã thỏa thuận lên Ban Quản Trị thành công", response));
    }

    @GetMapping("/{taskId}/tickets/active")
    @Operation(summary = "Lấy Ticket đang mở / hoạt động của Task (UC111 & UC112)",
               description = "Trả về Settlement hoặc Dispute Ticket đang ở trạng thái OPEN hoặc IN_REVIEW của Task")
    public ResponseEntity<ApiResponse<MentoringDisputeTicketResponse>> getActiveTicket(
            @PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        MentoringDisputeTicketResponse response = ticketService.getActiveTicket(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin Ticket đang hoạt động thành công", response));
    }

    @GetMapping("/{taskId}/tickets")
    @Operation(summary = "Lấy danh sách các Tickets của Task (UC111 & UC112)",
               description = "Trả về lịch sử toàn bộ các Ticket gắn với Task")
    public ResponseEntity<ApiResponse<List<MentoringDisputeTicketResponse>>> getTicketsByTaskId(
            @PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        List<MentoringDisputeTicketResponse> response = ticketService.getTicketsByTaskId(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Tickets thành công", response));
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng đăng nhập."));
        return user.getId();
    }
}
