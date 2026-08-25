package com.alumnect.alumnect_backend.entity.forum;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity ánh xạ bảng question_images — một ảnh đính kèm của câu hỏi diễn đàn Q&A
 * (UC40 - Ask a question mở rộng, UC46 - Edit a question).
 * Mỗi câu hỏi có thể có nhiều ảnh; {@code sortOrder} quyết định thứ tự hiển thị.
 */
@Entity
@Table(name = "question_images")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionImage {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Câu hỏi chứa ảnh này — tham chiếu bảng questions (xóa câu hỏi thì ảnh bị xóa theo) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    /** Đường dẫn công khai của ảnh (đã upload lên storage qua presigned URL) */
    @Column(nullable = false, length = 500)
    private String url;

    /** Thứ tự hiển thị ảnh trong câu hỏi (0 là ảnh đầu tiên) */
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private short sortOrder = 0;
}
