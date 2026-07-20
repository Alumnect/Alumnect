package com.alumnect.alumnect_backend.dto.response.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về kết quả sau khi thích/bỏ thích một bài viết (UC17 - Like a post).
 * Cho phép Frontend cập nhật ngay trạng thái nút Thích và số lượt thích mà không
 * cần tải lại toàn bộ bài viết.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LikeResponse {

    /** true nếu người dùng hiện đang thích bài viết (sau thao tác), false nếu đã bỏ thích */
    private boolean liked;

    /** Tổng số lượt thích hiện tại của bài viết */
    private int likeCount;
}
