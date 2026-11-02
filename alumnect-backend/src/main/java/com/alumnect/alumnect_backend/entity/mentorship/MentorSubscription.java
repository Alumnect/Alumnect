package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity ánh xạ bảng mentor_subscriptions — lưu thông tin đăng ký / lựa chọn gói Mentor (UC92) sẵn sàng cho thanh toán (UC93).
 */
@Entity
@Table(name = "mentor_subscriptions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorSubscription {

    /** Khóa chính tự sinh (BIGINT GENERATED ALWAYS AS IDENTITY) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Hồ sơ Mentor thực hiện chọn gói */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_profile_id", nullable = false)
    private MentorProfile mentorProfile;

    /** Gói Mentor được lựa chọn */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private MentorPackage mentorPackage;

    /** Giá thực tế tại thời điểm chọn gói/tạo giao dịch (snapshot price) */
    @Column(name = "price_at_purchase", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceAtPurchase;

    /** Thời hạn sử dụng tính theo tháng snapshot tại thời điểm mua */
    @Column(name = "duration_months", nullable = false)
    private Integer durationMonths;

    /** Trạng thái đăng ký: PENDING_PAYMENT, PAID, CANCELLED, EXPIRED */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MentorSubscriptionStatus status = MentorSubscriptionStatus.PENDING_PAYMENT;

    /** Thời điểm bắt đầu hiệu lực gói (được cập nhật sau khi thanh toán thành công tại UC93) */
    @Column(name = "start_date")
    private Instant startDate;

    /** Thời điểm hết hạn gói (được tính toán sau khi thanh toán thành công tại UC93) */
    @Column(name = "end_date")
    private Instant endDate;

    /** Thời điểm chọn gói / khởi tạo bản ghi */
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật bản ghi gần nhất */
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
            status = MentorSubscriptionStatus.PENDING_PAYMENT;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
