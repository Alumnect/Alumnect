package com.alumnect.alumnect_backend.entity.post;

import com.alumnect.alumnect_backend.common.enums.PostType;
import com.alumnect.alumnect_backend.common.enums.PostVisibility;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng posts — một bài viết trên bảng tin cộng đồng (UC15 - View community Feed).
 * Mỗi bài viết thuộc về một {@link User} (tác giả) và có thể bị Admin ẩn khỏi bảng tin
 * (isHidden) mà không cần xóa cứng dữ liệu.
 */
@Entity
@Table(name = "posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tác giả của bài viết — tham chiếu tới bảng users */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Loại bài viết: NORMAL, ACHIEVEMENT, RECRUITMENT hoặc EVENT — dùng để lọc theo tab trên Frontend */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostType type;

    /** Nội dung văn bản của bài viết */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** URL ảnh đính kèm bài viết (null nếu bài viết không có ảnh) */
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    /** Phạm vi hiển thị: PUBLIC (Guest xem được) hoặc MEMBERS (chỉ thành viên đã đăng nhập) — áp dụng BR-12 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostVisibility visibility;

    /** Số lượt thích — đếm dồn (denormalized), chưa hỗ trợ tra cứu "ai đã thích" ở UC này */
    @Column(name = "like_count", nullable = false)
    private int likeCount;

    /** Số lượt bình luận — đếm dồn (denormalized), thuộc phạm vi UC khác */
    @Column(name = "comment_count", nullable = false)
    private int commentCount;

    /** Số lượt đăng lại — đếm dồn (denormalized), thuộc phạm vi UC khác */
    @Column(name = "repost_count", nullable = false)
    private int repostCount;

    /** true nếu bài viết đã bị Admin ẩn khỏi bảng tin (BR-08/BR-11) — không xóa cứng dữ liệu */
    @Column(name = "is_hidden", nullable = false)
    private boolean isHidden;

    /** Thời điểm tạo bài viết, không thể cập nhật sau khi tạo — dùng để sắp xếp bảng tin theo "mới nhất" */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Thời điểm cập nhật bài viết lần cuối */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Tự động gán thời gian tạo và giá trị mặc định khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (type == null) {
            type = PostType.NORMAL;
        }
        if (visibility == null) {
            visibility = PostVisibility.PUBLIC;
        }
    }

    /** Tự động cập nhật thời gian mỗi khi bản ghi được sửa */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
