package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.WorkLogStatus;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Thực thể lưu trữ nhật ký công việc thực hiện (Work Log) của Mentor trong Mentoring Task (UC107).
 */
@Entity
@Table(name = "mentoring_work_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringWorkLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mentoring Task chứa nhật ký công việc này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private MentoringTask task;

    /** Mentor là người ghi nhận nhật ký công việc */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    /** Ngày thực hiện công việc được ghi nhận */
    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    /** Mô tả tóm tắt nội dung công việc */
    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    /** Chi tiết các hạng mục công việc đã hoàn thành */
    @Column(name = "work_completed", columnDefinition = "TEXT", nullable = false)
    private String workCompleted;

    /** Kết quả và sản phẩm đạt được */
    @Column(name = "result", columnDefinition = "TEXT", nullable = false)
    private String result;

    /** Kế hoạch và hành động tiếp theo */
    @Column(name = "next_action", columnDefinition = "TEXT")
    private String nextAction;

    /** Trạng thái xác nhận của nhật ký (PENDING_CONFIRMATION, CONFIRMED, REJECTED) */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private WorkLogStatus status = WorkLogStatus.PENDING_CONFIRMATION;

    /** Phản hồi hoặc nhận xét của học viên khi nghiệm thu (UC108) */
    @Column(name = "student_feedback", columnDefinition = "TEXT")
    private String studentFeedback;

    /** Thời điểm học viên xác nhận nghiệm thu (UC108) */
    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    /** Học viên đã xác nhận nghiệm thu (UC108) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by")
    private User confirmedBy;

    /** Số thứ tự phiên bản cập nhật của Work Log (bắt đầu từ 1) */
    @Column(name = "revision_number", nullable = false)
    @Builder.Default
    private Integer revisionNumber = 1;

    /** Danh sách tài liệu minh chứng đính kèm */
    @OneToMany(mappedBy = "workLog", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MentoringWorkLogAttachment> attachments = new ArrayList<>();

    /** Lịch sử phản hồi / yêu cầu làm rõ của học viên */
    @OneToMany(mappedBy = "workLog", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    @Builder.Default
    private List<MentoringWorkLogFeedback> feedbacks = new ArrayList<>();

    /** Lịch sử snapshot các phiên bản chỉnh sửa */
    @OneToMany(mappedBy = "workLog", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("revisionNumber DESC")
    @Builder.Default
    private List<MentoringWorkLogRevision> revisions = new ArrayList<>();

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

    /**
     * Tiện ích thêm tệp đính kèm vào nhật ký.
     */
    public void addAttachment(MentoringWorkLogAttachment attachment) {
        if (attachment != null) {
            attachments.add(attachment);
            attachment.setWorkLog(this);
        }
    }

    /**
     * Tiện ích xóa toàn bộ tệp đính kèm cũ để cập nhật danh sách mới.
     */
    public void clearAttachments() {
        attachments.forEach(att -> att.setWorkLog(null));
        attachments.clear();
    }
}
