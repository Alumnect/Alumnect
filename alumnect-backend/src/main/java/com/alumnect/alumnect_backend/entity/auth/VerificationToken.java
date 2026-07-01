package com.alumnect.alumnect_backend.entity.auth;

import com.alumnect.alumnect_backend.common.enums.VerificationType;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng verification_tokens — lưu mã OTP 6 số dùng để xác thực email hoặc đặt lại mật khẩu.
 * Mỗi token có thời hạn sử dụng và chỉ được dùng một lần.
 */
@Entity
@Table(name = "verification_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationToken {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người dùng sở hữu token này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Loại token: EMAIL_VERIFICATION (xác thực email) hoặc PASSWORD_RESET (quên mật khẩu) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VerificationType type;

    /** Mã OTP 6 chữ số (100000–999999), duy nhất trong toàn bảng */
    @Column(nullable = false, unique = true, length = 120)
    private String token;

    /** Thời điểm token hết hiệu lực — sau thời điểm này token không còn dùng được */
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    /** true nếu token đã được sử dụng thành công (không thể dùng lại) */
    @Column(nullable = false)
    private boolean used;

    /** Thời điểm tạo token, không thể cập nhật sau khi tạo */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Số lần nhập sai mã OTP này (tối đa 5 lần) */
    @Builder.Default
    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts = 0;

    /** Tự động gán thời gian tạo khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}

