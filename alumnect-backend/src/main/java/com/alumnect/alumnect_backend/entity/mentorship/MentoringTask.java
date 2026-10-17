package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Thực thể Mentoring Task đại diện cho nhiệm vụ/công việc hướng dẫn chính thức (UC105 & Flow 3, 4).
 * Được kích hoạt tự động ngay sau khi Student hoàn tất thanh toán Deal đã chốt.
 */
@Entity
@Table(name = "mentoring_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Thỏa thuận Deal gốc đã được chốt và thanh toán */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id", nullable = false, unique = true)
    private MentoringDeal deal;

    /** Yêu cầu Mentoring gốc đã sinh ra Deal và Task này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private MentoringRequest request;

    /** Cuộc trò chuyện Chat for Task riêng gắn với Task */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    /** Học viên (Student) nhận hướng dẫn và là người thanh toán */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /** Cố vấn (Mentor) phụ trách hướng dẫn */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    /** Tiêu đề nhiệm vụ (Tóm tắt từ Deal) */
    @Column(name = "task_title", length = 255, nullable = false)
    private String taskTitle;

    /** Phạm vi công việc đã chốt bất biến từ Deal */
    @Column(name = "task_scope", columnDefinition = "TEXT", nullable = false)
    private String taskScope;

    /** Mức giá thỏa thuận đã thanh toán (VND) */
    @Column(name = "agreed_price", precision = 12, scale = 2, nullable = false)
    private BigDecimal agreedPrice;

    /** Hạn chót hoàn thành nhiệm vụ */
    @Column(name = "deadline", nullable = false)
    private Instant deadline;

    /** Hình thức làm việc: ONLINE, OFFLINE, BOTH */
    @Enumerated(EnumType.STRING)
    @Column(name = "working_mode", length = 20, nullable = false)
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia: INDIVIDUAL, GROUP */
    @Enumerated(EnumType.STRING)
    @Column(name = "participation_type", length = 20, nullable = false)
    private MentoringParticipationType participationType;

    /** Phân loại công việc: CONSULTATION, PROJECT_MENTORING, SKILL_TRAINING... */
    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", length = 50, nullable = false)
    private MentoringTaskType taskType;

    /** Kết quả kỳ vọng đầu ra */
    @Column(name = "expected_result", columnDefinition = "TEXT", nullable = false)
    private String expectedResult;

    /** Trạng thái tiến trình: PREPARATION, IN_PROGRESS, SUBMITTED, COMPLETED, CANCELLED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private MentoringTaskStatus status = MentoringTaskStatus.PREPARATION;

    /** Thời điểm Task chính thức được kích hoạt bắt đầu */
    @Column(name = "started_at", nullable = false)
    @Builder.Default
    private Instant startedAt = Instant.now();

    /** Thời điểm Task hoàn thành nghiệm thu */
    @Column(name = "completed_at")
    private Instant completedAt;

    /** Danh sách các nhật ký công việc (Work Log) được Mentor ghi nhận */
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MentoringWorkLog> workLogs = new ArrayList<>();

    /** Thời điểm tạo bản ghi */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật bản ghi */
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
