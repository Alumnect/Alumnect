package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Thực thể lưu trữ snapshot phiên bản Work Log để bảo toàn bằng chứng kiểm toán (UC108).
 */
@Entity
@Table(name = "mentoring_work_log_revisions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringWorkLogRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_log_id", nullable = false)
    private MentoringWorkLog workLog;

    @Column(name = "revision_number", nullable = false)
    private Integer revisionNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "work_completed", columnDefinition = "TEXT", nullable = false)
    private String workCompleted;

    @Column(name = "result", columnDefinition = "TEXT", nullable = false)
    private String result;

    @Column(name = "next_action", columnDefinition = "TEXT")
    private String nextAction;

    @Column(name = "attachments_summary", columnDefinition = "TEXT")
    private String attachmentsSummary;

    @Column(name = "student_feedback", columnDefinition = "TEXT")
    private String studentFeedback;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
