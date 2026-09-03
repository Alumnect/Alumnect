package com.alumnect.alumnect_backend.dto.response.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO trả về kết quả sau khi bình chọn/bỏ bình chọn một câu hỏi (UC42 - Vote on a question).
 * Cho phép Frontend cập nhật ngay trạng thái nút bình chọn và số vote mà không cần tải lại
 * toàn bộ câu hỏi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoteResponse {

    /** true nếu người dùng hiện đang bình chọn câu hỏi (sau thao tác), false nếu đã bỏ bình chọn */
    private boolean voted;

    /** Tổng số vote hiện tại của câu hỏi */
    private int voteCount;
}
