package com.alumnect.alumnect_backend.controller.admin;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketType;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDisputeTicketResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các yêu cầu Quản trị viên theo dõi và tiếp nhận Settlement/Dispute Ticket trong Mentorship (UC116 - UC120).
 * Bắt buộc quyền Quản trị viên (ROLE_ADMIN).
 * Tiền tố "/api/v1" được tự động bổ sung từ WebMvcConfig.
 */
@Slf4j
@RestController
@RequestMapping("/admin/mentoring/tickets")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Mentoring Ticket Management", description = "Các API dành cho Quản trị viên theo dõi, lọc và xử lý Ticket tranh chấp/hòa giải (UC116 - UC120)")
public class AdminMentoringTicketController {

    private final MentoringTicketService mentoringTicketService;
    private final UserRepository userRepository;

    /**
     * API Lấy danh sách Settlement & Dispute Ticket phân trang kèm bộ lọc đa tiêu chí cho Admin (UC116).
     *
     * @param keyword Từ khóa tìm kiếm (mã vé, tiêu đề, task, email student, email mentor)
     * @param type Loại vé (SETTLEMENT hoặc DISPUTE)
     * @param status Trạng thái xử lý (OPEN, IN_REVIEW, RESOLVED, REJECTED, CANCELLED)
     * @param handledById ID Admin đang phụ trách
     * @param pageable Phân trang và sắp xếp
     * @return Danh sách phân trang Ticket
     */
    @GetMapping
    @Operation(summary = "Xem danh sách Ticket tranh chấp & hòa giải cho Admin (UC116)",
               description = "Lấy danh sách các vé khiếu nại tranh chấp (Dispute) và thỏa thuận hoàn tiền (Settlement) cần Admin xử lý")
    public ResponseEntity<ApiResponse<PageResponse<MentoringDisputeTicketResponse>>> getAdminTickets(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) MentoringTicketType type,
            @RequestParam(required = false) MentoringTicketStatus status,
            @RequestParam(required = false) Long handledById,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long currentUserId = getCurrentUserId();
        log.info("Admin {} yêu cầu lấy danh sách Ticket: keyword='{}', type={}, status={}, handledBy={}",
                currentUserId, keyword, type, status, handledById);

        PageResponse<MentoringDisputeTicketResponse> response = mentoringTicketService.getAdminTickets(
                currentUserId, keyword, type, status, handledById, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Ticket thành công", response));
    }

    /**
     * API Xem thông tin chi tiết một Ticket cho Admin (UC116 / UC117 / UC118).
     *
     * @param ticketId ID vé khiếu nại
     * @return Thông tin chi tiết Ticket kèm bằng chứng và các bên tham gia
     */
    @GetMapping("/{ticketId}")
    @Operation(summary = "Xem chi tiết Ticket cho Admin (UC116, UC118)",
               description = "Lấy thông tin chi tiết vé khiếu nại hoặc thỏa thuận hòa giải gồm hồ sơ và chứng từ đính kèm")
    public ResponseEntity<ApiResponse<MentoringDisputeTicketResponse>> getAdminTicketDetail(
            @PathVariable Long ticketId) {
        Long currentUserId = getCurrentUserId();
        log.info("Admin {} yêu cầu xem chi tiết Ticket ID: {}", currentUserId, ticketId);

        MentoringDisputeTicketResponse response = mentoringTicketService.getAdminTicketDetail(currentUserId, ticketId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết Ticket thành công", response));
    }

    /**
     * API Tiếp nhận Ticket để xử lý cho Quản trị viên (UC117).
     * Gán Quản trị viên hiện tại làm người phụ trách (handled_by), ghi nhận accepted_at và đổi trạng thái sang IN_REVIEW.
     *
     * @param ticketId ID vé khiếu nại
     * @return Thông tin Ticket sau khi tiếp nhận
     */
    @PostMapping("/{ticketId}/accept")
    @Operation(summary = "Tiếp nhận Ticket để xử lý cho Admin (UC117)",
               description = "Cho phép Quản trị viên chính thức nhận quyền phụ trách xử lý Ticket tranh chấp/hòa giải")
    public ResponseEntity<ApiResponse<MentoringDisputeTicketResponse>> acceptTicket(
            @PathVariable Long ticketId) {
        Long currentUserId = getCurrentUserId();
        log.info("Admin {} yêu cầu tiếp nhận xử lý Ticket ID: {}", currentUserId, ticketId);

        MentoringDisputeTicketResponse response = mentoringTicketService.acceptTicket(currentUserId, ticketId);
        return ResponseEntity.ok(ApiResponse.success("Tiếp nhận xử lý Ticket thành công", response));
    }

    /**
     * API Tra cứu bằng chứng và bối cảnh toàn diện của Task cho Quản trị viên (UC118).
     *
     * @param ticketId ID vé khiếu nại
     * @return Bằng chứng tranh chấp do hai bên nộp kèm ngữ cảnh Task toàn diện (Deal, Timeline, Confirmed Logs, Deliverables, Escrow)
     */
    @GetMapping("/{ticketId}/context")
    @Operation(summary = "Xem bằng chứng và bối cảnh tranh chấp cho Admin (UC118)",
               description = "Lấy toàn bộ bằng chứng do hai bên tải lên kèm ngữ cảnh Task: Deal gốc, Timeline & Lịch sử gia hạn, Confirmed Work Logs, Deliverables và Quỹ tạm giữ")
    public ResponseEntity<ApiResponse<com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDisputeContextResponse>> getAdminDisputeContext(
            @PathVariable Long ticketId) {
        Long currentUserId = getCurrentUserId();
        log.info("Admin {} yêu cầu xem bằng chứng và ngữ cảnh Ticket ID: {}", currentUserId, ticketId);

        com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDisputeContextResponse response =
                mentoringTicketService.getAdminDisputeContext(currentUserId, ticketId);
        return ResponseEntity.ok(ApiResponse.success("Lấy bằng chứng và bối cảnh Ticket thành công", response));
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng đăng nhập."));
        return user.getId();
    }
}
