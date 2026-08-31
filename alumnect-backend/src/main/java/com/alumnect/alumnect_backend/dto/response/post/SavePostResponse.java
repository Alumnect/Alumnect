package com.alumnect.alumnect_backend.dto.response.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về kết quả sau khi lưu/bỏ lưu một bài viết (UC20 - Save Post).
 * Cho phép Frontend cập nhật ngay trạng thái nút Bookmark mà không cần tải lại toàn bộ bài viết.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavePostResponse {

    /** true nếu bài viết đang được lưu (sau thao tác), false nếu đã bỏ lưu */
    private boolean saved;
}
