package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringCompletionStatus;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể lưu vết lần nộp kết quả nghiệm thu hoàn thành Task (UC110).
 * Cho phép Mentor nộp bản mô tả kết quả cuối cùng cùng sản phẩm/tệp bàn giao (deliverables),
 * và Student xem xét để xác nhận nghiệm thu hoàn thành Task hoặc yêu cầu điều chỉnh.
 */
@Entity
@Table(name = "mentoring_task_completions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nhiệm vụ Mentoring Task được nộp kết quả */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private MentoringTask task;

    /** Cuộc hội thoại Chat for Task */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    /** Người nộp kết quả (Mentor) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    /** Mô tả tóm tắt kết quả hoàn thành cuối cùng */
    @Column(name = "final_summary", columnDefinition = "TEXT", nullable = false)
    private String finalSummary;

    /** Danh sách sản phẩm, deliverables hoặc đường dẫn sản phẩm bàn giao */
    @Column(name = "deliverables", columnDefinition = "TEXT")
    private String deliverables;

    /** Danh sách URLs đính kèm chứng từ/file kết quả (phân cách bởi dấu phẩy hoặc JSON) */
    @Column(name = "attachment_urls", columnDefinition = "TEXT")
    private String attachmentUrls;

    /** Trạng thái nghiệm thu: PENDING, CONFIRMED, REJECTED, SUPERSEDED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private MentoringCompletionStatus status = MentoringCompletionStatus.PENDING;

    /** Người phản hồi nghiệm thu (Student) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responded_by")
    private User respondedBy;

    /** Thời điểm phản hồi */
    @Column(name = "responded_at")
    private Instant respondedAt;

    /** Ghi chú phản hồi hoặc lý do yêu cầu chỉnh sửa */
    @Column(name = "feedback_note", columnDefinition = "TEXT")
    private String feedbackNote;

    /** Thời điểm nộp kết quả */
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
