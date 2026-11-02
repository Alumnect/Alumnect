package com.alumnect.alumnect_backend.dto.response.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO đại diện thông tin thành viên tìm kiếm phục vụ nhắn tin / thêm vào nhóm chat.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatUserResponse {

    /** Mã người dùng */
    private Long userId;

    /** Email người dùng */
    private String email;

    /** Họ và tên */
    private String fullName;

    /** Ảnh đại diện */
    private String avatarUrl;

    /** Chức danh / Headline */
    private String headline;

    /** Chuyên ngành học */
    private String major;

    /** Đang theo dõi người này hay chưa */
    private boolean isFollowing;
}
