package com.alumnect.alumnect_backend.entity.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Entity ánh xạ bảng user_profiles — hồ sơ công khai hiển thị của người dùng.
 * Quan hệ 1-1 với bảng users, dùng chung khóa chính (user_id).
 */
@Entity
@Table(name = "user_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {

    /** Khóa chính, dùng chung với users.id (quan hệ 1-1) */
    @Id
    @Column(name = "user_id")
    private Long userId;

    /** Tham chiếu ngược về đối tượng User chủ sở hữu hồ sơ này */
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    /** Họ và tên đầy đủ của người dùng */
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    /** URL ảnh đại diện (lưu đường dẫn tới file ảnh hoặc link bên ngoài) */
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /** Số điện thoại liên hệ (không bắt buộc) */
    @Column(length = 20)
    private String phone;

    /** Chuyên ngành học của người dùng, tham chiếu bảng majors */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "major_id")
    private Major major;

    /** Khóa học (năm nhập học) — VD: 2021 = khóa nhập học năm 2021 */
    private Integer cohort;

    /** Mã số sinh viên — bắt buộc với Alumni, tùy chọn với Student */
    @Column(name = "student_code", length = 20)
    private String studentCode;

    /** Dòng tiêu đề ngắn hiển thị dưới tên (VD: "Software Engineer tại FPT Software") */
    @Column(length = 160)
    private String headline;

    /** Giới thiệu bản thân chi tiết (không giới hạn ký tự) */
    private String biography;


    /** Thành phố đang sinh sống hoặc làm việc */
    @Column(length = 120)
    private String city;

    /** Vĩ độ địa lý — dùng cho tính năng bản đồ cựu sinh viên */
    private BigDecimal latitude;

    /** Kinh độ địa lý — dùng cho tính năng bản đồ cựu sinh viên */
    private BigDecimal longitude;

    /** Danh sách liên kết mạng xã hội/website của người dùng */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "social_links", columnDefinition = "varchar(500)[]")
    private List<String> socialLinks;

    /** URL ảnh bìa hồ sơ (không bắt buộc) */
    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    /** Danh sách kinh nghiệm làm việc của người dùng */
    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @OrderBy("startDate DESC")
    private List<Experience> experiences;

    /** Danh sách kỹ năng của người dùng */
    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @OrderBy("sortOrder ASC, skillName ASC")
    private List<UserSkill> skills;

    /** Thời điểm tạo hồ sơ, không thể cập nhật sau khi tạo */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Thời điểm cập nhật hồ sơ lần cuối */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Tự động gán thời gian khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    /** Tự động cập nhật thời gian mỗi khi hồ sơ được sửa */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}

