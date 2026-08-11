package com.alumnect.alumnect_backend.entity.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng follows — lưu trữ mối quan hệ theo dõi giữa các người dùng trong hệ thống.
 */
@Entity
@Table(name = "follows")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Follow {

    /** Khóa chính tự động tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người thực hiện hành động theo dõi (Người theo dõi) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower;

    /** Người được theo dõi (Đối tượng theo dõi) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false)
    private User following;

    /** Thời điểm thiết lập mối quan hệ theo dõi */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Tự động gán thời điểm tạo khi lưu bản ghi vào DB */
    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }
}
