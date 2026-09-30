package com.alumnect.alumnect_backend.entity.mentorship;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Entity ánh xạ bảng user_terms_acceptances — lưu vết việc người dùng chấp nhận Điều khoản Hướng dẫn & Hỗ trợ.
 * Ràng buộc duy nhất (user_id, terms_version) đảm bảo một người dùng chỉ chấp nhận 1 lần cho cùng 1 phiên bản.
 */
@Entity
@Table(
    name = "user_terms_acceptances",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_user_terms_acceptances_user_version",
            columnNames = {"user_id", "terms_version"}
        )
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTermsAcceptance {

    /** Khóa chính tự sinh (BIGINT GENERATED ALWAYS AS IDENTITY) */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người dùng chấp nhận điều khoản (tham chiếu tới bảng users) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Phiên bản điều khoản được chấp nhận (ví dụ: 1.0) */
    @Column(name = "terms_version", nullable = false, length = 20)
    private String termsVersion;

    /** Thời điểm người dùng thực hiện chấp nhận điều khoản */
    @Column(name = "accepted_at", nullable = false)
    @Builder.Default
    private Instant acceptedAt = Instant.now();
}
