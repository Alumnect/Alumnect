package com.alumnect.alumnect_backend.entity.post;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng post_likes — một lượt "thích" của người dùng cho một bài viết
 * (UC17 - Like a post). Ràng buộc UNIQUE (post_id, user_id) ở DB đảm bảo mỗi người
 * chỉ thích một lần cho mỗi bài; bộ đếm like_count trên {@link Post} được cập nhật
 * đồng thời ở tầng Service.
 */
@Entity
@Table(name = "post_likes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostLike {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Bài viết được thích — tham chiếu tới bảng posts */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    /** Người dùng đã thích — tham chiếu tới bảng users */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Thời điểm thích bài viết, không cập nhật sau khi tạo */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Tự động gán thời gian khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
