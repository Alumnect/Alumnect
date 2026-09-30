package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorPackageStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

/**
 * Entity ánh xạ bảng mentor_packages — lưu trữ danh mục các gói dịch vụ Mentor do Admin cấu hình (UC92).
 */
@Entity
@Table(name = "mentor_packages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorPackage {

    /** Khóa chính tự sinh (BIGINT GENERATED ALWAYS AS IDENTITY) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã định danh duy nhất của gói (ví dụ: MENTOR_1M, MENTOR_3M, MENTOR_6M) */
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    /** Tên hiển thị của gói (ví dụ: Gói Tiêu Chuẩn 1 Tháng) */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** Mô tả chi tiết quyền lợi gói dịch vụ */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Thời hạn gói tính theo tháng (ví dụ: 1, 3, 6) */
    @Column(name = "duration_months", nullable = false)
    private Integer durationMonths;

    /** Giá gói niêm yết (VND) */
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    /** Trạng thái kinh doanh của gói: ACTIVE (đang bán), INACTIVE (ngừng bán) */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MentorPackageStatus status = MentorPackageStatus.ACTIVE;

    /** Thời điểm khởi tạo gói */
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật thông tin gói gần nhất */
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
            status = MentorPackageStatus.ACTIVE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
