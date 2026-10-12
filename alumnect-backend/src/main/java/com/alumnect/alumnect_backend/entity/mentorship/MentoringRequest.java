package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity ánh xạ bảng mentoring_requests — lưu thông tin yêu cầu Mentoring chung do sinh viên tạo (UC100).
 * Request không gán đích danh mentorId mà hệ thống sẽ tự động matching và phân phối tới các Mentor phù hợp.
 */
@Entity
@Table(name = "mentoring_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringRequest {

    /** Khóa chính tự sinh (BIGINT GENERATED ALWAYS AS IDENTITY) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Sinh viên tạo yêu cầu (tham chiếu bảng users) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /** Lĩnh vực / ngành nghề cần được hỗ trợ (tham chiếu bảng industries) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "industry_id", nullable = false)
    private Industry industry;

    /** Tiêu đề ngắn gọn mô tả nhu cầu cố vấn */
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /** Nội dung chi tiết nhu cầu hỗ trợ và bối cảnh của người học */
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    /** Ngân sách tối thiểu dự kiến chi trả cho phiên cố vấn (có thể null nếu thỏa thuận) */
    @Column(name = "budget_min", precision = 12, scale = 2)
    private BigDecimal budgetMin;

    /** Ngân sách tối đa sẵn sàng chi trả cho phiên cố vấn */
    @Column(name = "budget_max", precision = 12, scale = 2)
    private BigDecimal budgetMax;

    /** Phương thức làm việc mong muốn: ONLINE, OFFLINE, BOTH */
    @Enumerated(EnumType.STRING)
    @Column(name = "working_mode", nullable = false, length = 20)
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia mong muốn: INDIVIDUAL (1-1) hoặc GROUP (nhóm) */
    @Enumerated(EnumType.STRING)
    @Column(name = "participation_type", nullable = false, length = 20)
    private MentoringType participationType;

    /** Loại nhiệm vụ hỗ trợ: CAREER_ORIENTATION, RESUME_REVIEW, MOCK_INTERVIEW... */
    @Enumerated(EnumType.STRING)
    @Column(name = "task_type", nullable = false, length = 50)
    private MentoringTaskType taskType;

    /** Thời hạn mong muốn hoàn thành buổi/chương trình cố vấn */
    @Column(name = "expected_deadline")
    private Instant expectedDeadline;

    /** Trạng thái hiện tại của yêu cầu: OPEN, MATCHED, CLOSED, CANCELLED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private MentoringRequestStatus status = MentoringRequestStatus.OPEN;

    /** Số lượng Mentor phù hợp đã được hệ thống tìm kiếm và phân phối */
    @Column(name = "matched_count", nullable = false)
    @Builder.Default
    private Integer matchedCount = 0;

    /** Danh sách tài liệu / tệp đính kèm liên kết với yêu cầu này */
    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MentoringRequestAttachment> attachments = new ArrayList<>();

    /** Danh sách phân phối tới các Mentor phù hợp */
    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MentoringRequestDistribution> distributions = new ArrayList<>();

    /** Thời điểm tạo yêu cầu */
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật yêu cầu gần nhất */
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        updatedAt = Instant.now();
        if (status == null) {
            status = MentoringRequestStatus.OPEN;
        }
        if (matchedCount == null) {
            matchedCount = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
