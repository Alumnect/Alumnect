package com.alumnect.alumnect_backend.service.moderation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Sự kiện thông báo khi có bài viết mới được đăng tải (Chiến lược Post-First, Moderate-Later chuẩn Facebook).
 * Cho phép bài viết xuất bản ngay lập tức, sau đó hệ thống AI/Profanity sẽ quét ngầm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostCreatedModerationEvent {

    /** ID của bài viết vừa được xuất bản */
    private Long postId;

    /** Nội dung văn bản của bài viết */
    private String content;

    /** ID tác giả bài viết */
    private Long authorId;
}
