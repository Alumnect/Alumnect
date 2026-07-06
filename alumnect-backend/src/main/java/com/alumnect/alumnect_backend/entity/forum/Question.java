package com.alumnect.alumnect_backend.entity.forum;

import com.alumnect.alumnect_backend.common.enums.QuestionStatus;
import com.alumnect.alumnect_backend.entity.user.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * Entity ánh xạ bảng questions — một câu hỏi trên diễn đàn Q&A (UC38 - View question list).
 * Mỗi câu hỏi thuộc về một {@link User} (tác giả) và có thể gắn với một {@link ForumTopic} (chủ đề).
 * Số lượt vote/answer được lưu dồn (denormalized) để hiển thị nhanh, không cần đếm lại từ bảng con.
 */
@Entity
@Table(name = "questions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tác giả đặt câu hỏi — tham chiếu tới bảng users */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    /** Chủ đề của câu hỏi (null nếu chưa phân loại) — tham chiếu bảng forum_topics */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id")
    private ForumTopic topic;

    /** Tiêu đề câu hỏi */
    @Column(nullable = false, length = 250)
    private String title;

    /** Nội dung chi tiết câu hỏi */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    /** Trạng thái câu hỏi: ACTIVE (hiển thị), HIDDEN (bị ẩn), DELETED (xóa mềm) — chỉ ACTIVE lên bảng tin */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuestionStatus status;

    /** Số lượt vote — đếm dồn (denormalized), thuộc phạm vi UC bình chọn khác */
    @Column(name = "vote_count", nullable = false)
    private int voteCount;

    /** Số câu trả lời — đếm dồn (denormalized), thuộc phạm vi UC trả lời khác */
    @Column(name = "answer_count", nullable = false)
    private int answerCount;

    /** Thời điểm tạo câu hỏi, không thể cập nhật sau khi tạo — dùng để sắp xếp "mới nhất" */
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** Thời điểm cập nhật câu hỏi lần cuối */
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Tự động gán thời gian tạo và trạng thái mặc định khi lần đầu lưu vào DB */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (status == null) {
            status = QuestionStatus.ACTIVE;
        }
    }

    /** Tự động cập nhật thời gian mỗi khi bản ghi được sửa */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
