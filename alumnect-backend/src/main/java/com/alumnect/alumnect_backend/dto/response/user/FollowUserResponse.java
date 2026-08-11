package com.alumnect.alumnect_backend.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin thu gọn của một người dùng trong danh sách người theo dõi hoặc đang theo dõi.
 * Phục vụ cho giao diện hiển thị danh sách thu nhỏ để tối ưu hóa truyền tải dữ liệu.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowUserResponse {

    /** ID của tài khoản người dùng */
    private Long userId;

    /** Địa chỉ email của người dùng */
    private String email;

    /** Họ và tên đầy đủ */
    private String fullName;

    /** Đường dẫn ảnh đại diện */
    private String avatarUrl;

    /** Dòng giới thiệu ngắn hiển thị dưới tên (Headline) */
    private String headline;

    /** Trạng thái xác thực tài khoản (chỉ hiện tích xanh cho tài khoản được duyệt) */
    private Boolean isAccountVerified;

    /** true nếu người xem hiện tại đang theo dõi người này */
    private Boolean isFollowing;
}
