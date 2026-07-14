package com.alumnect.alumnect_backend.entity.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng user_settings — lưu cài đặt giao diện và ngôn ngữ của người dùng.
 * Quan hệ 1-1 với bảng users, dùng chung khóa chính (user_id).
 */
@Entity
@Table(name = "user_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettings {

    /** Khóa chính, dùng chung với users.id (quan hệ 1-1) */
    @Id
    @Column(name = "user_id")
    private Long userId;

    /** Tham chiếu ngược về đối tượng User chủ sở hữu cài đặt này */
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    /** Giao diện: LIGHT (sáng), DARK (tối), SYSTEM (theo hệ điều hành) — mặc định: SYSTEM */
    @Column(nullable = false, length = 20)
    private String theme;

    /** Ngôn ngữ hiển thị — mặc định: "vi" (tiếng Việt) */
    @Column(nullable = false, length = 10)
    private String language;

    /** Thời điểm cài đặt được cập nhật lần cuối */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Tự động gán giá trị mặc định (SYSTEM, vi) khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        updatedAt = Instant.now();
        if (theme == null) {
            theme = "SYSTEM";
        }
        if (language == null) {
            language = "vi";
        }
    }

    /** Tự động cập nhật thời gian mỗi khi cài đặt được sửa */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}

