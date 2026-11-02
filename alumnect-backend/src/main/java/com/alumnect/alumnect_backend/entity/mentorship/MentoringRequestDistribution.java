package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Entity ánh xạ bảng mentoring_request_distributions — lưu thông tin phân phối yêu cầu tới Mentor (UC100).
 * Ràng buộc duy nhất (request_id, mentor_profile_id) ngăn chặn phân phối trùng lặp tới cùng một Mentor (BR-10).
 */
@Entity
@Table(
    name = "mentoring_request_distributions",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_mentoring_request_distributions",
            columnNames = {"request_id", "mentor_profile_id"}
        )
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringRequestDistribution {

    /** Khóa chính tự sinh (BIGINT GENERATED ALWAYS AS IDENTITY) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Yêu cầu Mentoring được phân phối */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private MentoringRequest request;

    /** Hồ sơ Mentor nhận phân phối (tham chiếu mentor_profiles) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_profile_id", nullable = false)
    private MentorProfile mentorProfile;

    /** Trạng thái phân phối: PENDING, ACCEPTED, REJECTED, EXPIRED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private MentoringDistributionStatus status = MentoringDistributionStatus.PENDING;

    /** Thời điểm yêu cầu được gửi tới hộp thư của Mentor */
    @Column(name = "distributed_at", nullable = false)
    @Builder.Default
    private Instant distributedAt = Instant.now();

    /** Thời điểm Mentor phản hồi tiếp nhận hoặc từ chối */
    @Column(name = "responded_at")
    private Instant respondedAt;

    /** Lời nhắn hoặc lý do phản hồi của Mentor (nếu có) */
    @Column(name = "response_note", length = 500)
    private String responseNote;

    /** Thời điểm tạo bản ghi */
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật bản ghi */
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        updatedAt = Instant.now();
        if (distributedAt == null) {
            distributedAt = Instant.now();
        }
        if (status == null) {
            status = MentoringDistributionStatus.PENDING;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
