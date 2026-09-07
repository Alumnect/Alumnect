package com.alumnect.alumnect_backend.dto.response.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO trả về thông tin một người tham gia sự kiện trong danh sách attendees (UC25).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventAttendeeResponse {

    /** ID người dùng */
    private Long userId;

    /** Họ và tên hiển thị */
    private String fullName;

    /** Ảnh đại diện */
    private String avatarUrl;

    /** Tiêu đề nghề nghiệp / chức danh / khóa học */
    private String headline;

    /** Vai trò (STUDENT, ALUMNI) */
    private String role;

    /** Thời điểm đăng ký tham gia */
    private Instant registeredAt;
}
