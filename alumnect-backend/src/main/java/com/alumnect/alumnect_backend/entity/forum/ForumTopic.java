package com.alumnect.alumnect_backend.entity.forum;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng forum_topics — danh mục chủ đề của diễn đàn Q&A (UC38 - View question list).
 * Là bảng danh mục dùng chung, mỗi câu hỏi có thể thuộc về một chủ đề để lọc/phân loại.
 */
@Entity
@Table(name = "forum_topics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumTopic {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tên chủ đề — duy nhất trên toàn hệ thống (VD: "Career", "Interview") */
    @Column(nullable = false, unique = true, length = 120)
    private String name;

    /** Mô tả ngắn về chủ đề (không bắt buộc) */
    @Column(length = 500)
    private String description;

    /**
     * ID chủ đề cha (tự tham chiếu forum_topics.id) — tạo hệ phân cấp 2 cấp:
     * null = chủ đề cấp 1 (ngành lớn / chủ đề đứng riêng); có giá trị = chủ đề con thuộc ngành lớn đó.
     * Lưu dạng khóa đơn giản (không map sang đối tượng) vì Frontend tự dựng cây từ danh sách phẳng.
     */
    @Column(name = "parent_id")
    private Long parentId;

    /**
     * ID người tạo chủ đề (tham chiếu users.id). Null với các chủ đề mặc định của hệ thống.
     * UC38 chỉ hiển thị danh sách nên lưu dạng khóa đơn giản, chưa cần map sang đối tượng User.
     */
    @Column(name = "created_by")
    private Long createdBy;

    /** Thời điểm tạo chủ đề, không thể cập nhật sau khi tạo */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Tự động gán thời gian tạo khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
