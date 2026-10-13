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
}
