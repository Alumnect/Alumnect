package com.alumnect.alumnect_backend.service.moderation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sự kiện phát ra khi bài viết được đăng hoặc được sửa (Chiến lược Post-First, Moderate-Later).
 * Bài viết xuất bản ngay lập tức, bộ lọc từ cấm quét ngầm sau khi transaction commit.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostCreatedModerationEvent {

    /** ID của bài viết vừa được đăng hoặc sửa */
    private Long postId;

    /** Nội dung văn bản của bài viết */
    private String content;

    /** ID tác giả bài viết */
    private Long authorId;
}
