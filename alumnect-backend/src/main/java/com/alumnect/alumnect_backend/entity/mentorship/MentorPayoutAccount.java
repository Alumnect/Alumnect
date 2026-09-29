package com.alumnect.alumnect_backend.entity.mentorship;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Persistable;

import java.time.Instant;

/**
 * Entity ánh xạ bảng mentor_payout_accounts — lưu thông tin tài khoản ngân hàng nhận chi trả của Mentor.
 * Quan hệ 1-1 với MentorProfile, tách riêng nhằm cô lập và bảo vệ dữ liệu nhạy cảm (PII).
 */
@Entity
@Table(name = "mentor_payout_accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorPayoutAccount implements Persistable<Long> {

    /** Khóa chính đồng thời là khóa ngoại tham chiếu tới mentor_profiles(id) */
    @Id
    @Column(name = "mentor_profile_id")
    private Long mentorProfileId;

    /** Hồ sơ Mentor tương ứng */
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "mentor_profile_id")
    private MentorProfile mentorProfile;

    /** Tên ngân hàng thụ hưởng (ví dụ: Vietcombank, Techcombank, MB Bank...) */
    @Column(name = "bank_name", length = 100)
    private String bankName;

    /** Số tài khoản ngân hàng */
    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    /** Tên chủ tài khoản ngân hàng (viết hoa không dấu) */
    @Column(name = "bank_account_holder", length = 150)
    private String bankAccountHolder;

    /** Thời điểm thiết lập tài khoản */
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /** Thời điểm cập nhật tài khoản gần nhất */
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public Long getId() {
        return this.mentorProfileId;
    }

    @Override
    public boolean isNew() {
        return this.isNew;
    }

    @PostLoad
    @PostPersist
    public void markNotNew() {
        this.isNew = false;
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
