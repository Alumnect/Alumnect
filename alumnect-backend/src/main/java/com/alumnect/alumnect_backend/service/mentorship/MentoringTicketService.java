package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.request.mentorship.SubmitSettlementTicketRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDisputeTicketResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringSettlementSnapshotResponse;

import java.util.List;

/**
 * Service quản lý các Ticket gửi Ban Quản Trị (Admin) trong Mentorship (UC111 & UC112).
 * Hỗ trợ gửi Settlement Ticket đã thỏa thuận (UC111) và giải quyết tranh chấp (UC112).
 */
public interface MentoringTicketService {

    /**
     * Lấy Settlement Snapshot để hiển thị thông tin thỏa thuận hai bên đã chốt trước khi gửi Ticket (UC111).
     *
     * @param currentUserId ID người dùng hiện tại
     * @param taskId ID nhiệm vụ Mentoring Task
     * @return Dữ liệu Settlement Snapshot
     */
    MentoringSettlementSnapshotResponse getSettlementSnapshot(Long currentUserId, Long taskId);

    /**
     * Gửi Settlement Ticket đã được Student và Mentor thống nhất cho Admin xử lý (UC111).
     *
     * @param currentUserId ID người gửi (Student hoặc Mentor)
     * @param taskId ID nhiệm vụ Mentoring Task
     * @param request Dữ liệu gửi Ticket
     * @return Thông tin Settlement Ticket vừa tạo
     */
    MentoringDisputeTicketResponse submitSettlementTicket(
            Long currentUserId, Long taskId, SubmitSettlementTicketRequest request);

    /**
     * Lấy Ticket đang mở / hoạt động (OPEN hoặc IN_REVIEW) của Task (nếu có).
     *
     * @param currentUserId ID người dùng xem
     * @param taskId ID nhiệm vụ Mentoring Task
     * @return Ticket đang hoạt động hoặc null nếu không có
     */
    MentoringDisputeTicketResponse getActiveTicket(Long currentUserId, Long taskId);

    /**
     * Lấy danh sách tất cả các Tickets gắn với Task theo thứ tự mới nhất trước.
     *
     * @param currentUserId ID người dùng xem
     * @param taskId ID nhiệm vụ Mentoring Task
     * @return Danh sách Tickets
     */
    List<MentoringDisputeTicketResponse> getTicketsByTaskId(Long currentUserId, Long taskId);

    /**
     * Tạo Dispute Ticket khi hai bên không thể tự thống nhất phương án (UC112).
     *
     * @param currentUserId ID người gửi (Student hoặc Mentor)
     * @param taskId ID nhiệm vụ Mentoring Task
     * @param request Dữ liệu khiếu nại và bằng chứng
     * @return Thông tin Dispute Ticket vừa tạo
     */
    MentoringDisputeTicketResponse createDisputeTicket(
            Long currentUserId, Long taskId, com.alumnect.alumnect_backend.dto.request.mentorship.CreateDisputeTicketRequest request);

    /**
     * Lấy danh sách bằng chứng tranh chấp của Ticket (UC112 & UC113).
     *
     * @param currentUserId ID người xem
     * @param ticketId ID vé khiếu nại
     * @return Danh sách bằng chứng
     */
    List<com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTicketEvidenceResponse> getTicketEvidences(
            Long currentUserId, Long ticketId);

    /**
     * Bổ sung bằng chứng tranh chấp cho Ticket đang hoạt động (UC113).
     *
     * @param currentUserId ID người gửi (Student hoặc Mentor)
     * @param ticketId ID vé khiếu nại
     * @param request Dữ liệu bằng chứng
     * @return Dữ liệu bằng chứng vừa thêm
     */
    com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTicketEvidenceResponse addTicketEvidence(
            Long currentUserId, Long ticketId, com.alumnect.alumnect_backend.dto.request.mentorship.TicketEvidenceRequest request);

    /**
     * Tra cứu danh sách Settlement / Dispute Ticket cho Quản trị viên (UC116).
     *
     * @param currentUserId ID Admin đang đăng nhập
     * @param keyword Từ khóa tìm kiếm theo mã vé, tiêu đề, task title hoặc email người tham gia
     * @param ticketType Loại vé (SETTLEMENT hoặc DISPUTE)
     * @param status Trạng thái vé (OPEN, IN_REVIEW, RESOLVED, REJECTED, CANCELLED)
     * @param handledById ID Admin đang phụ trách
     * @param pageable Phân trang
     * @return Danh sách phân trang các Ticket
     */
    com.alumnect.alumnect_backend.common.api.PageResponse<MentoringDisputeTicketResponse> getAdminTickets(
            Long currentUserId,
            String keyword,
            com.alumnect.alumnect_backend.common.enums.MentoringTicketType ticketType,
            com.alumnect.alumnect_backend.common.enums.MentoringTicketStatus status,
            Long handledById,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Xem thông tin chi tiết một Ticket cho Quản trị viên (UC116 / UC117 / UC118).
     *
     * @param currentUserId ID Admin đang đăng nhập
     * @param ticketId ID vé khiếu nại
     * @return Chi tiết Ticket kèm danh sách bằng chứng và ngữ cảnh
     */
    MentoringDisputeTicketResponse getAdminTicketDetail(Long currentUserId, Long ticketId);
}
