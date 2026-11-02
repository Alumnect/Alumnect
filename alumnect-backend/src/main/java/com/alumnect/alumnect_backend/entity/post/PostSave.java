package com.alumnect.alumnect_backend.entity.post;

import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Entity ánh xạ bảng post_saves — một lượt lưu/đánh dấu (bookmark) bài viết của người dùng (UC20 - Save Post).
 * Ràng buộc UNIQUE (post_id, user_id) ở database đảm bảo mỗi người dùng chỉ lưu một bài viết tối đa một lần.
 */
@Entity
@Table(name = "post_saves")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostSave {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Bài viết được lưu — tham chiếu tới bảng posts */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    /** Người dùng thực hiện lưu bài viết — tham chiếu tới bảng users */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Thời điểm lưu bài viết */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Tự động gán thời gian khi lần đầu lưu vào database */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
