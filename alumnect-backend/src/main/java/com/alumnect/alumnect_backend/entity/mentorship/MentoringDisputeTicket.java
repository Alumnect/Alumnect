package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTicketStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketType;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể Settlement / Dispute Ticket gửi lên Ban Quản Trị (Admin) xử lý (UC111 & UC112).
 * - Loại SETTLEMENT: Hai bên đã đồng thuận phương án phân chia tiền dừng Task (UC111), gửi Admin xác nhận & giải ngân/hoàn tiền.
 * - Loại DISPUTE: Tranh chấp khi hai bên không thống nhất hoặc phát sinh khiếu nại (UC112).
 */
@Entity
@Table(name = "mentoring_dispute_tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringDisputeTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã định danh hiển thị của Ticket (ví dụ: ST-20261014-001 hoặc DP-20261014-001) */
    @Column(name = "ticket_code", length = 50, nullable = false, unique = true)
    private String ticketCode;

    /** Loại Ticket: SETTLEMENT hoặc DISPUTE */
    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_type", length = 30, nullable = false)
    private MentoringTicketType ticketType;

    /** Nhiệm vụ Mentoring Task liên kết */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private MentoringTask task;

    /** Cuộc trò chuyện Chat for Task */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    /** Đề xuất phân chia tiền dừng Task đã được đồng thuận (nếu là loại SETTLEMENT) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settlement_proposal_id")
    private MentoringTaskSettlementProposal settlementProposal;

    /** Người tạo Ticket (Student hoặc Mentor) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    /** Học viên liên quan */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /** Cố vấn liên quan */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    /** Tiêu đề ngắn gọn của Ticket */
    @Column(name = "title", length = 255, nullable = false)
    private String title;

    /** Nội dung mô tả / lý do / căn cứ giải quyết */
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    /** Lý do tranh chấp (UC112) */
    @Column(name = "dispute_reason", length = 255)
    private String disputeReason;

    /** Phương án mong muốn của người tạo khiếu nại (UC112) */
    @Column(name = "desired_solution", length = 255)
    private String desiredSolution;

    /** Số tiền thanh toán cho Cố vấn (VND) */
    @Column(name = "mentor_amount", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal mentorAmount = BigDecimal.ZERO;

    /** Số tiền hoàn trả cho Học viên (VND) */
    @Column(name = "student_refund", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal studentRefund = BigDecimal.ZERO;

    /** Tổng ngân sách giải quyết của Task (VND) */
    @Column(name = "total_amount", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    /** Trạng thái xử lý của Ticket: OPEN, IN_REVIEW, RESOLVED, REJECTED, CANCELLED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private MentoringTicketStatus status = MentoringTicketStatus.OPEN;

    /** Quản trị viên (Admin) tiếp nhận xử lý (UC117) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "handled_by")
    private User handledBy;

    /** Thời điểm Admin tiếp nhận Ticket (UC117) */
    @Column(name = "accepted_at")
    private Instant acceptedAt;

    /** Thời điểm Admin giải quyết xong Ticket (UC120) */
    @Column(name = "resolved_at")
    private Instant resolvedAt;

    /** Ghi chú phán quyết / quyết định giải quyết của Admin */
    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    /** Thời điểm tạo Ticket */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật */
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
