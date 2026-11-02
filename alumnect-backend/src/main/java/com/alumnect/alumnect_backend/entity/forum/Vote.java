package com.alumnect.alumnect_backend.entity.forum;

import com.alumnect.alumnect_backend.common.enums.VoteTargetType;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng votes — một lượt bình chọn của người dùng cho một câu hỏi hoặc câu trả lời
 * (UC42 - Vote on a question). Ràng buộc UNIQUE (user_id, target_type, target_id) ở DB đảm bảo
 * mỗi người chỉ bình chọn một lần cho mỗi đối tượng; bộ đếm {@code vote_count} trên
 * {@link Question}/Answer được cập nhật đồng thời ở tầng Service.
 * <p>
 * {@code targetId} KHÔNG dùng {@code @ManyToOne} vì thiết kế đa hình (có thể trỏ tới câu hỏi HOẶC
 * câu trả lời tùy {@code targetType}) — không thể ràng buộc FK cứng tới một bảng cụ thể.
 */
@Entity
@Table(name = "votes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vote {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Người dùng đã bình chọn — tham chiếu tới bảng users */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Loại đối tượng được bình chọn (QUESTION/ANSWER) */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 10)
    private VoteTargetType targetType;

    /** ID đối tượng được bình chọn (id của câu hỏi hoặc câu trả lời, tùy targetType) */
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    /** Giá trị bình chọn: 1 (upvote) hoặc -1 (downvote) — UC42 hiện chỉ dùng 1 (khớp UI 1 nút mũi tên) */
    @Column(nullable = false)
    private short value;

    /** Thời điểm bình chọn, không cập nhật sau khi tạo */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Tự động gán thời gian khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}
