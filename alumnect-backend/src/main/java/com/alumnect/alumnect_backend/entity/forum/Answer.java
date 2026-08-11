package com.alumnect.alumnect_backend.entity.forum;

import com.alumnect.alumnect_backend.common.enums.AnswerStatus;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng answers — một câu trả lời cho câu hỏi trên diễn đàn Q&A (UC41 - Answer a question).
 * Mỗi câu trả lời thuộc về một {@link Question} và một {@link User} (tác giả).
 * Số lượt vote được lưu dồn (denormalized) để hiển thị nhanh, thuộc phạm vi UC bình chọn khác.
 */
@Entity
@Table(name = "answers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Answer {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Câu hỏi mà câu trả lời này thuộc về — tham chiếu bảng questions */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    /** Tác giả viết câu trả lời — tham chiếu bảng users */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    /** Nội dung câu trả lời */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    /** Trạng thái: ACTIVE (hiển thị), HIDDEN (bị ẩn), DELETED (xóa mềm) — chỉ ACTIVE hiển thị dưới câu hỏi */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AnswerStatus status;

    /** Số lượt vote — đếm dồn (denormalized), thuộc phạm vi UC bình chọn khác */
    @Column(name = "vote_count", nullable = false)
    private int voteCount;

    /** Thời điểm tạo câu trả lời, không thể cập nhật sau khi tạo — dùng để sắp xếp theo thời gian */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Thời điểm cập nhật câu trả lời lần cuối */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Tự động gán thời gian tạo và trạng thái mặc định khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (status == null) {
            status = AnswerStatus.ACTIVE;
        }
    }

    /** Tự động cập nhật thời gian mỗi khi bản ghi được sửa */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
