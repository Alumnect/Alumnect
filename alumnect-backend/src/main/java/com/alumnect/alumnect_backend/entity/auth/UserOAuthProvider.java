package com.alumnect.alumnect_backend.entity.auth;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng user_oauth_providers — lưu thông tin liên kết tài khoản mạng xã hội (Google OAuth2).
 */
@Entity
@Table(name = "user_oauth_providers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserOAuthProvider {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người dùng sở hữu liên kết OAuth này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Tên nhà cung cấp (VD: "GOOGLE") */
    @Column(nullable = false, length = 30)
    private String provider;

    /** ID người dùng của nhà cung cấp OAuth (VD: Google sub ID) */
    @Column(name = "provider_user_id", nullable = false, length = 120)
    private String providerUserId;

    /** Thời điểm liên kết tài khoản */
    @Column(name = "linked_at", nullable = false, updatable = false)
    private Instant linkedAt;

    /** Tự động thiết lập thời gian khi lưu */
    @PrePersist
    protected void onCreate() {
        linkedAt = Instant.now();
    }
}
