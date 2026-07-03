package com.alumnect.alumnect_backend.entity.auth;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng refresh_tokens — lưu trữ thông tin refresh token phục vụ bảo mật phiên đăng nhập và xoay vòng token.
 */
@Entity
@Table(name = "refresh_tokens")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người dùng sở hữu refresh token này */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Mã băm SHA-256 của Refresh Token nhằm đảm bảo an toàn nếu CSDL bị lộ */
    @Column(name = "token_hash", nullable = false, unique = true, length = 255)
    private String tokenHash;

    /** Thời điểm hết hạn của Refresh Token */
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    /** Trạng thái bị thu hồi (true nếu token đã bị hủy trước hạn hoặc đã bị xoay vòng) */
    @Column(nullable = false)
    private boolean revoked;

    /** Thiết bị/Trình duyệt của người dùng sử dụng lúc đăng nhập */
    @Column(name = "user_agent", length = 255)
    private String userAgent;

    /** Địa chỉ IP của client lúc đăng nhập */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** Thời điểm tạo bản ghi */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Tự động điền thời gian tạo và giá trị mặc định cho trạng thái bị thu hồi */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
