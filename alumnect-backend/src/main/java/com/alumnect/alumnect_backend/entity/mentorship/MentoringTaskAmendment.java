package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringAmendmentStatus;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể Task Amendment Ticket (UC109, mục 5.8).
 * Cho phép điều chỉnh phạm vi công việc, kết quả kỳ vọng, thời hạn và số tiền bổ sung trong Chat for Task.
 */
@Entity
@Table(name = "mentoring_task_amendments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskAmendment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nhiệm vụ Mentoring Task liên kết */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private MentoringTask task;

    /** Cuộc hội thoại Chat for Task nơi Ticket được nhúng */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    /** Người tạo yêu cầu điều chỉnh */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    /** Người nhận yêu cầu điều chỉnh (bên còn lại) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    /** Số thứ tự phiên bản điều chỉnh */
    @Column(name = "version", nullable = false)
    @Builder.Default
    private Integer version = 1;

    /** Phạm vi công việc trước điều chỉnh */
    @Column(name = "previous_scope", columnDefinition = "TEXT")
    private String previousScope;

    /** Phạm vi công việc mới đề xuất */
    @Column(name = "new_scope", columnDefinition = "TEXT")
    private String newScope;

    /** Kết quả kỳ vọng trước điều chỉnh */
    @Column(name = "previous_expected_result", columnDefinition = "TEXT")
    private String previousExpectedResult;

    /** Kết quả kỳ vọng mới đề xuất */
    @Column(name = "new_expected_result", columnDefinition = "TEXT")
    private String newExpectedResult;

    /** Số tiền bổ sung cụ thể (>= 0) */
    @Column(name = "additional_amount", precision = 12, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal additionalAmount = BigDecimal.ZERO;

    /** Deadline trước điều chỉnh */
    @Column(name = "previous_deadline")
    private Instant previousDeadline;

    /** Deadline mới đề xuất (nếu có) */
    @Column(name = "new_deadline")
    private Instant newDeadline;

    /** Lý do đề xuất điều chỉnh */
    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    /** Trạng thái: PENDING, AWAITING_TOPUP, APPLIED, REJECTED, SUPERSEDED, CANCELLED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private MentoringAmendmentStatus status = MentoringAmendmentStatus.PENDING;

    /** Người phản hồi */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responded_by")
    private User respondedBy;

    /** Thời điểm phản hồi */
    @Column(name = "responded_at")
    private Instant respondedAt;

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
