package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.ConfirmDealRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.ProposeDealRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateDealRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringDealService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các yêu cầu API liên quan đến Thỏa thuận & xác nhận Mentoring Deal (UC104).
 */
@RestController
@RequestMapping("/mentoring/deals")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Mentoring Deals", description = "Các API phục vụ Thỏa thuận & xác nhận Mentoring Deal giữa Student và Mentor (UC104)")
public class MentoringDealController {

    private final MentoringDealService dealService;
    private final UserRepository userRepository;

    /**
     * API Mentor phát hành phiên bản Deal Ticket mới trong Chat for Task (v1 hoặc v+1).
     * REQUEST_ACCEPTANCE lấy điều khoản từ Request; RENEGOTIATION dùng điều khoản Mentor nhập.
     *
     * @param request DTO chứa conversationId, proposalSource và điều khoản (khi deal lại)
     * @return Phản hồi chuẩn chứa thông tin Deal vừa được khởi tạo
     */
    @PostMapping
    @Operation(summary = "Mentor gửi Deal Ticket trong Chat for Task", description = "Chấp nhận Deal theo Request hoặc Deal lại; Deal luôn gắn Request + Conversation (UC104)")
    public ResponseEntity<ApiResponse<MentoringDealResponse>> proposeDeal(
            @Valid @RequestBody ProposeDealRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        MentoringDealResponse response = dealService.proposeDeal(currentUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Khởi tạo đề xuất thỏa thuận Mentoring Deal thành công.", response));
    }

    /**
     * API Mentor deal lại trên Deal đã có (Task Scope, Price, Deadline, Working Mode...).
     * Sinh phiên bản Deal Ticket mới; phiên bản cũ không còn được xác nhận / thanh toán.
     *
     * @param id ID của thỏa thuận Deal
     * @param request DTO chứa các điều khoản mới cập nhật
     * @return Phản hồi chuẩn chứa thông tin Deal sau khi cập nhật
     */
    @PutMapping("/{id}")
    @Operation(summary = "Điều chỉnh điều khoản Mentoring Deal", description = "Cho phép điều chỉnh các điều khoản Task Scope, Price, Deadline... và sinh phiên bản Snapshot mới")
    public ResponseEntity<ApiResponse<MentoringDealResponse>> updateDealTerms(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDealRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        MentoringDealResponse response = dealService.updateDealTerms(currentUserId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Điều chỉnh điều khoản thỏa thuận thành công. Snapshot mới đã được cập nhật.", response));
    }

    /**
     * API xác nhận đúng phiên bản Deal Ticket đang xem. Khi hai bên cùng xác nhận một phiên bản, hệ thống khóa Deal
     * (DEAL_CONFIRMED), chọn Mentor cho Request và chuyển các Chat for Task khác sang chỉ đọc. Không tạo Task.
     *
     * @param id ID của thỏa thuận Deal
     * @param request DTO chứa phiên bản đang xác nhận (bị từ chối nếu không phải phiên bản mới nhất)
     * @return Phản hồi chuẩn chứa thông tin Deal với trạng thái xác nhận mới nhất
     */
    @PostMapping("/{id}/confirm")
    @Operation(summary = "Xác nhận Mentoring Deal Snapshot", description = "Xác nhận phiên bản Deal Ticket mới nhất; khi hai bên cùng xác nhận: khóa Deal và chọn Mentor cho Request")
    public ResponseEntity<ApiResponse<MentoringDealResponse>> confirmDeal(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmDealRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        MentoringDealResponse response = dealService.confirmDeal(currentUserId, id, request.getVersion());
        return ResponseEntity.ok(ApiResponse.success("Xác nhận thỏa thuận Mentoring Deal thành công.", response));
    }

    /**
     * API xem thông tin chi tiết của một Deal bao gồm điều khoản hiện tại,
     * Snapshot mới nhất và toàn bộ lịch sử các phiên bản Snapshot.
     *
     * @param id ID của thỏa thuận Deal
     * @return Phản hồi chuẩn chứa chi tiết toàn diện của Deal
     */
    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết Mentoring Deal & Snapshot", description = "Lấy thông tin chi tiết Deal, Snapshot mới nhất và lịch sử các phiên bản")
    public ResponseEntity<ApiResponse<MentoringDealDetailResponse>> getDealDetail(
            @PathVariable Long id
    ) {
        Long currentUserId = getCurrentUserId();
        MentoringDealDetailResponse response = dealService.getDealDetail(currentUserId, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết thỏa thuận Mentoring Deal thành công.", response));
    }

    /**
     * API lấy danh sách các thỏa thuận Deal của người dùng hiện tại (với tư cách Student hoặc Mentor).
     *
     * @param status Bộ lọc trạng thái tùy chọn
     * @param page Số trang (mặc định 0)
     * @param size Kích thước trang (mặc định 10)
     * @return Phản hồi chuẩn dạng phân trang chứa danh sách Deal
     */
    @GetMapping
    @Operation(summary = "Lấy danh sách Mentoring Deals của tôi", description = "Trả về danh sách phân trang các thỏa thuận Deal mà người dùng tham gia")
    public ResponseEntity<ApiResponse<PageResponse<MentoringDealResponse>>> getMyDeals(
            @RequestParam(required = false) MentoringDealStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long currentUserId = getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        PageResponse<MentoringDealResponse> response = dealService.getMyDeals(currentUserId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách thỏa thuận Deal thành công.", response));
    }

    /**
     * API lấy luồng Deal của một Chat for Task (chỉ thành viên cuộc hội thoại được xem).
     *
     * @param conversationId ID cuộc trò chuyện
     * @return Phản hồi chuẩn chứa chi tiết Deal hoặc dữ liệu rỗng nếu chưa có thỏa thuận
     */
    @GetMapping("/by-conversation/{conversationId}")
    @Operation(summary = "Lấy Deal theo Chat for Task", description = "Trả về luồng Deal gắn với Chat for Task (null nếu Mentor chưa gửi Deal Ticket)")
    public ResponseEntity<ApiResponse<MentoringDealDetailResponse>> getDealByConversation(
            @PathVariable Long conversationId
    ) {
        Long currentUserId = getCurrentUserId();
        MentoringDealDetailResponse response = dealService.getDealByConversation(currentUserId, conversationId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thỏa thuận Deal theo cuộc trò chuyện thành công.", response));
    }

    /**
     * API hủy bỏ một thỏa thuận Deal trước khi bị khóa chốt.
     *
     * @param id ID của thỏa thuận Deal
     * @param reason Lý do hủy bỏ tùy chọn
     * @return Phản hồi chuẩn chứa thông tin Deal đã hủy
     */
    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy bỏ Mentoring Deal", description = "Hủy bỏ thỏa thuận Deal khi chưa bị khóa chốt (chưa DEAL_CONFIRMED)")
    public ResponseEntity<ApiResponse<MentoringDealResponse>> cancelDeal(
            @PathVariable Long id,
            @RequestParam(required = false) String reason
    ) {
        Long currentUserId = getCurrentUserId();
        MentoringDealResponse response = dealService.cancelDeal(currentUserId, id, reason);
        return ResponseEntity.ok(ApiResponse.success("Hủy bỏ thỏa thuận Mentoring Deal thành công.", response));
    }

    /**
     * API Học viên từ chối phiên bản Deal Ticket hiện tại (UC104). Không xóa Request, không tạo Task/Payment.
     *
     * @param id ID của thỏa thuận Deal
     * @param reason Lý do từ chối tùy chọn
     * @param version Phiên bản đang xem (tùy chọn, kiểm tra khớp phiên bản mới nhất)
     * @return Phản hồi chuẩn chứa thông tin Deal đã từ chối
     */
    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối Deal Ticket", description = "Học viên từ chối phiên bản Deal Ticket đang chờ phản hồi (UC104)")
    public ResponseEntity<ApiResponse<MentoringDealResponse>> rejectDeal(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @RequestParam(required = false) Integer version
    ) {
        Long currentUserId = getCurrentUserId();
        MentoringDealResponse response = dealService.rejectDeal(currentUserId, id, reason, version);
        return ResponseEntity.ok(ApiResponse.success("Từ chối thỏa thuận Deal Ticket thành công.", response));
    }

    /**
     * API yêu cầu điều chỉnh Deal Ticket (UC104).
     *
     * @param id ID của thỏa thuận Deal
     * @param note Ghi chú yêu cầu điều chỉnh tùy chọn
     * @param version Phiên bản đang xem (tùy chọn, kiểm tra khớp phiên bản mới nhất)
     * @return Phản hồi chuẩn chứa thông tin Deal đã chuyển sang SUPERSEDED
     */
    @PostMapping("/{id}/request-adjustment")
    @Operation(summary = "Yêu cầu điều chỉnh Deal Ticket", description = "Student yêu cầu Mentor điều chỉnh lại điều khoản Deal Ticket (UC104)")
    public ResponseEntity<ApiResponse<MentoringDealResponse>> requestAdjustment(
            @PathVariable Long id,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) Integer version
    ) {
        Long currentUserId = getCurrentUserId();
        MentoringDealResponse response = dealService.requestAdjustment(currentUserId, id, note, version);
        return ResponseEntity.ok(ApiResponse.success("Gửi yêu cầu điều chỉnh thỏa thuận Deal thành công.", response));
    }

    /**
     * Lấy ID người dùng đang đăng nhập từ Security Context.
     */
    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng đang đăng nhập."));
        return user.getId();
    }
}
