package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.*;

/**
 * DTO chứa thông tin tóm tắt người tham gia Mentoring Task (Student hoặc Mentor) (UC106).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringParticipantResponse {

    /** ID người dùng */
    private Long id;

    /** Họ và tên hiển thị */
    private String fullName;

    /** Đường dẫn ảnh đại diện */
    private String avatarUrl;

    /** Email liên hệ */
    private String email;

    /** Vai trò (STUDENT hoặc ALUMNI) */
    private String role;

    /** Chuyên ngành hoặc tiêu đề nghề nghiệp */
    private String headline;

    /** Tiểu sử tóm tắt */
    private String bio;
}
