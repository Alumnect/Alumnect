package com.alumnect.alumnect_backend.entity.post;

import com.alumnect.alumnect_backend.common.enums.CommentStatus;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng comments — một bình luận trên bài viết (UC16 - View Post Detail).
 * Mỗi bình luận thuộc về một {@link Post} và một tác giả {@link User}; có thể là trả lời
 * cho một bình luận khác (1 cấp) qua {@link #parentComment}. Việc ẩn bình luận là xóa mềm
 * qua {@link #status} = DELETED (BR-11).
 * <p>
 * Ở UC16 chỉ ĐỌC (hiển thị luồng bình luận); đăng/sửa/xóa bình luận thuộc UC18.
 */
@Entity
@Table(name = "comments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Bài viết chứa bình luận này — tham chiếu bảng posts */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    /** Tác giả của bình luận — tham chiếu bảng users */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Bình luận cha nếu đây là một trả lời (1 cấp); null nếu là bình luận gốc */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    /** Nội dung văn bản của bình luận */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** Trạng thái: ACTIVE (hiển thị) hoặc DELETED (đã xóa mềm — BR-11) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CommentStatus status;

    /** Thời điểm tạo bình luận, không thể cập nhật — dùng để sắp xếp luồng bình luận */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Thời điểm cập nhật bình luận lần cuối */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Tự động gán thời gian tạo và trạng thái mặc định khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (status == null) {
            status = CommentStatus.ACTIVE;
        }
    }

    /** Tự động cập nhật thời gian mỗi khi bản ghi được sửa */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}