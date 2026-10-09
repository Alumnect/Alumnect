package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity ánh xạ bảng mentor_profiles — lưu trữ thông tin hồ sơ cố vấn đặc thù của Alumni.
 * Quan hệ 1-1 với User. Vị trí/công ty/kỹ năng được tái sử dụng trực tiếp từ Experience và UserSkill.
 */
@Entity
@Table(name = "mentor_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorProfile {

    /** Khóa chính tự sinh (BIGINT GENERATED ALWAYS AS IDENTITY) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người dùng sở hữu hồ sơ Mentor (quan hệ 1-1 với users) */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;


    /** Lời giới thiệu / định hướng cố vấn riêng biệt */
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    /** Hình thức hướng dẫn: ONLINE, OFFLINE, BOTH (có thể null khi lưu nháp) */
    @Enumerated(EnumType.STRING)
    @Column(name = "working_mode", length = 20)
    private MentoringWorkingMode workingMode;

    /** Loại hình cố vấn: INDIVIDUAL, GROUP, BOTH (có thể null khi lưu nháp) */
    @Enumerated(EnumType.STRING)
    @Column(name = "mentoring_type", length = 20)
    private MentoringType mentoringType;

    /** Khóa tệp CV lưu trữ riêng tư trên Cloudflare R2 (ví dụ: mentorship/cvs/uuid.pdf) */
    @Column(name = "cv_file_key", length = 255)
    private String cvFileKey;

    /** Trạng thái hồ sơ Mentor: INCOMPLETE, PAYMENT_PENDING, ACTIVE, EXPIRED */
    @Enumerated(EnumType.STRING)
    @Column(name = "mentor_status", nullable = false, length = 20)
    @Builder.Default
    private MentorStatus mentorStatus = MentorStatus.INCOMPLETE;

    /** Điểm uy tín tổng hợp của Mentor (tính theo hoạt động cố vấn, đánh giá và phản hồi) */
    @Column(name = "reputation_score", nullable = false)
    @Builder.Default
    private Integer reputationScore = 0;

    /** Tổng số nhiệm vụ / phiên cố vấn đã hoàn thành */
    @Column(name = "completed_tasks", nullable = false)
    @Builder.Default
    private Integer completedTasks = 0;

    /** Điểm đánh giá trung bình (thang điểm 0.00 đến 5.00) */
    @Column(name = "rating", nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private java.math.BigDecimal rating = java.math.BigDecimal.ZERO;

    /** Tổng số lượng đánh giá nhận được từ người học */
    @Column(name = "review_count", nullable = false)
    @Builder.Default
    private Integer reviewCount = 0;

    /** Danh sách lĩnh vực hỗ trợ chuẩn liên kết với industries */
    @OneToMany(mappedBy = "mentorProfile", fetch = FetchType.LAZY)
    @Builder.Default
    private List<MentorSupportedField> supportedFields = new ArrayList<>();

    /** Danh sách chủ đề cố vấn chuyên sâu tự do của Mentor */
    @OneToMany(mappedBy = "mentorProfile", fetch = FetchType.LAZY)
    @Builder.Default
    private List<MentorTopic> topics = new ArrayList<>();

    /** Thời điểm tạo hồ sơ */
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật hồ sơ gần nhất */
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        updatedAt = Instant.now();
        if (mentorStatus == null) {
            mentorStatus = MentorStatus.INCOMPLETE;
        }
        if (reputationScore == null) {
            reputationScore = 0;
        }
        if (completedTasks == null) {
            completedTasks = 0;
        }
        if (rating == null) {
            rating = java.math.BigDecimal.ZERO;
        }
        if (reviewCount == null) {
            reviewCount = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
