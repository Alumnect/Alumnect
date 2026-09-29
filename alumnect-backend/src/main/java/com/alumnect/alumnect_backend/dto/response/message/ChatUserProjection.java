package com.alumnect.alumnect_backend.dto.response.message;

/**
 * Projection interface hứng kết quả truy vấn tìm kiếm người dùng cho chức năng chat.
 */
public interface ChatUserProjection {
    Long getUserId();
    String getEmail();
    String getFullName();
    String getAvatarUrl();
    String getHeadline();
    String getMajor();
    Boolean getIsFollowing();
}
