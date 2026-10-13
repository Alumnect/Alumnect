package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringSettlementProposalStatus;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể Thỏa thuận dừng Task và phân chia tiền giữa Student và Mentor (UC109, bước 3 & 6, 7).
 */
@Entity
@Table(name = "mentoring_task_settlement_proposals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskSettlementProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nhiệm vụ Mentoring Task liên kết */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private MentoringTask task;

    /** Cuộc hội thoại Chat for Task */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    /** Người tạo đề xuất dừng Task */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    /** Người nhận đề xuất dừng Task */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    /** Số tiền thanh toán cho Mentor (>= 0) */
    @Column(name = "mentor_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal mentorAmount;

    /** Số tiền hoàn trả cho Student (>= 0) */
    @Column(name = "student_refund", precision = 12, scale = 2, nullable = false)
    private BigDecimal studentRefund;

    /** Tổng số tiền phân chia (phải bằng mentorAmount + studentRefund) */
    @Column(name = "total_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    /** Lý do dừng Task */
    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    /** Trạng thái: PENDING, ACCEPTED, REJECTED, SUPERSEDED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private MentoringSettlementProposalStatus status = MentoringSettlementProposalStatus.PENDING;

    /** Người phản hồi */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responded_by")
    private User respondedBy;

    /** Thời điểm phản hồi */
    @Column(name = "responded_at")
    private Instant respondedAt;

    /** Thời điểm tạo đề xuất */
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
