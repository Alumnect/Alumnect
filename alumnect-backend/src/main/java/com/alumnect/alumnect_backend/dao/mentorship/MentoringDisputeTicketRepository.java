package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTicketStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketType;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository truy xuất dữ liệu Settlement & Dispute Tickets (UC111 & UC112).
 */
@Repository
public interface MentoringDisputeTicketRepository extends JpaRepository<MentoringDisputeTicket, Long>, JpaSpecificationExecutor<MentoringDisputeTicket> {

    /** Tìm Ticket theo mã hiển thị duy nhất (ticketCode) */
    Optional<MentoringDisputeTicket> findByTicketCode(String ticketCode);

    /** Tìm danh sách Ticket của một Task theo thời gian tạo mới nhất */
    List<MentoringDisputeTicket> findByTaskIdOrderByCreatedAtDesc(Long taskId);

    /** Lấy Ticket mới nhất của một Task */
    Optional<MentoringDisputeTicket> findFirstByTaskIdOrderByCreatedAtDesc(Long taskId);

    /** Lấy Ticket đang hoạt động (OPEN hoặc IN_REVIEW) của một Task */
    Optional<MentoringDisputeTicket> findFirstByTaskIdAndStatusInOrderByCreatedAtDesc(
            Long taskId, Collection<MentoringTicketStatus> statuses);

    /** Kiểm tra xem Task đã có Ticket đang mở xử lý hay chưa */
    boolean existsByTaskIdAndStatusIn(Long taskId, Collection<MentoringTicketStatus> statuses);

    /** Tra cứu danh sách Ticket cho Admin lọc theo loại và trạng thái (UC116) */
    @Query("SELECT t FROM MentoringDisputeTicket t WHERE " +
           "(:ticketType IS NULL OR t.ticketType = :ticketType) AND " +
           "(:status IS NULL OR t.status = :status) " +
           "ORDER BY t.createdAt DESC")
    Page<MentoringDisputeTicket> findAdminTickets(
            @Param("ticketType") MentoringTicketType ticketType,
            @Param("status") MentoringTicketStatus status,
            Pageable pageable);

    /** Phí tranh chấp chỉ trở thành doanh thu sau khi Admin đã ra phán quyết. */
    @Query("SELECT t FROM MentoringDisputeTicket t " +
           "JOIN FETCH t.student s LEFT JOIN FETCH s.profile " +
           "WHERE t.status = com.alumnect.alumnect_backend.common.enums.MentoringTicketStatus.RESOLVED " +
           "AND t.disputeFee > 0 AND t.resolvedAt IS NOT NULL ORDER BY t.resolvedAt DESC")
    List<MentoringDisputeTicket> findAllResolvedFeeRevenue();
}
