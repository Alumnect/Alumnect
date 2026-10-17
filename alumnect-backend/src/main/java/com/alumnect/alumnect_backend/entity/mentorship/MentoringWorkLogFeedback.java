package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể lưu trữ lịch sử phản hồi và yêu cầu làm rõ của Học viên cho Work Log (UC108).
 */
@Entity
@Table(name = "mentoring_work_log_feedbacks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringWorkLogFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_log_id", nullable = false)
    private MentoringWorkLog workLog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /** Hành động của học viên: CONFIRMED hoặc CLARIFICATION_REQUESTED */
    @Column(name = "action", length = 50, nullable = false)
    private String action;

    /** Lý do / góp ý chi tiết từ học viên */
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    /** Phiên bản Work Log mà học viên đã phản hồi */
    @Column(name = "revision_number", nullable = false)
    @Builder.Default
    private Integer revisionNumber = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
