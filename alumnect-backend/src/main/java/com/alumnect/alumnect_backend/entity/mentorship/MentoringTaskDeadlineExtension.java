package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringExtensionStatus;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể Deadline Extension Ticket (UC109).
 * Cho phép Student hoặc Mentor đề xuất gia hạn hạn chót nhiệm vụ Mentoring Task trong Chat for Task.
 */
@Entity
@Table(name = "mentoring_task_deadline_extensions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskDeadlineExtension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nhiệm vụ Mentoring Task được yêu cầu gia hạn */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private MentoringTask task;

    /** Cuộc hội thoại Chat for Task nơi Ticket được nhúng */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    /** Người tạo yêu cầu gia hạn (Student hoặc Mentor) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    /** Người nhận yêu cầu gia hạn (bên còn lại) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    /** Hạn chót hiện tại của Task tại thời điểm gửi Ticket */
    @Column(name = "current_deadline", nullable = false)
    private Instant currentDeadline;

    /** Hạn chót mới được đề xuất */
    @Column(name = "proposed_deadline", nullable = false)
    private Instant proposedDeadline;

    /** Lý do đề xuất gia hạn */
    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    /** Trạng thái Ticket: PENDING, CONFIRMED, REJECTED, SUPERSEDED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private MentoringExtensionStatus status = MentoringExtensionStatus.PENDING;

    /** Người phản hồi (chấp nhận hoặc từ chối) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responded_by")
    private User respondedBy;

    /** Thời điểm phản hồi */
    @Column(name = "responded_at")
    private Instant respondedAt;

    /** Ghi chú giải trình khi phản hồi */
    @Column(name = "response_note", length = 500)
    private String responseNote;

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
