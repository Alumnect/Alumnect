package com.alumnect.alumnect_backend.dto.response.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kết quả sau thao tác thích / bỏ thích bài viết hội nhóm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupPostLikeResponse {

    private Long postId;
    private boolean liked;
    private int likeCount;
}
