package com.alumnect.alumnect_backend.entity.user;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.AuthProvider;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng users — lưu thông tin tài khoản và xác thực của người dùng.
 * Là bảng trung tâm, các bảng khác (user_profiles, verification_tokens...) đều tham chiếu tới.
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Địa chỉ email — duy nhất, dùng để đăng nhập */
    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /** Mật khẩu đã được mã hóa bằng BCrypt (null nếu đăng nhập qua Google) */
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    /** Vai trò của người dùng: STUDENT, ALUMNI hoặc ADMIN */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /** Trạng thái tài khoản: PENDING → ACTIVE / WAITING_APPROVAL / LOCKED */
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 20)
    private AccountStatus accountStatus;

    /** true nếu Admin đã duyệt hồ sơ (dành cho Alumni), Student tự động true sau khi xác nhận email */
    @Column(name = "is_account_verified", nullable = false)
    private boolean isAccountVerified;

    /** true nếu người dùng đã xác nhận địa chỉ email qua mã OTP */
    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified;

    /** Phương thức xác thực: LOCAL (email/password) hoặc GOOGLE (OAuth2) */
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 20)
    private AuthProvider authProvider;

    /** Thời điểm đăng nhập thành công gần nhất (null nếu chưa đăng nhập lần nào) */
    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    /** Thời điểm tạo bản ghi, không thể cập nhật sau khi tạo */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Thời điểm cập nhật bản ghi lần cuối */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Tự động gán thời gian tạo và giá trị mặc định khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (accountStatus == null) {
            accountStatus = AccountStatus.PENDING;
        }
        if (authProvider == null) {
            authProvider = AuthProvider.LOCAL;
        }
    }

    /** Tự động cập nhật thời gian mỗi khi bản ghi được sửa */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}

