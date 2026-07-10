package com.alumnect.alumnect_backend.dto.response.forum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin một chủ đề diễn đàn trả về cho Client (UC38 - View question list).
 * Dùng để đổ vào bộ lọc chủ đề (dropdown/tabs) phía Frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopicResponse {

    /** ID chủ đề — dùng làm giá trị lọc gửi lên tham số topicId */
    private Long id;

    /** Tên chủ đề hiển thị */
    private String name;
}
