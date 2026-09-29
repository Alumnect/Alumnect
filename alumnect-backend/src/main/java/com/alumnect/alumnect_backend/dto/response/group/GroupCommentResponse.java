package com.alumnect.alumnect_backend.dto.response.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Thông tin chi tiết một bình luận trong bài viết hội nhóm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupCommentResponse {

    private Long id;
    private Long postId;
    private GroupPostAuthorResponse author;
    private String content;

    /** Người xem có quyền xóa bình luận (tác giả bình luận, tác giả bài viết, hoặc Owner/Admin nhóm) */
    private boolean canDelete;

    private Instant createdAt;
    private Instant updatedAt;
}
