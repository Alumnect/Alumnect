package com.alumnect.alumnect_backend.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.util.List;

/**
 * DTO chứa thông tin hồ sơ chi tiết người dùng phục vụ cho danh sách và chi tiết của Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDto {

    /** Khóa chính của người dùng */
    private Long id;

    /** Địa chỉ email đăng nhập */
    private String email;

    /** Họ và tên đầy đủ */
    private String fullName;

    /** Đường dẫn ảnh đại diện */
    private String avatarUrl;

    /** Số điện thoại */
    private String phone;

    /** Niên khóa học */
    private Integer cohort;

    /** Mã số sinh viên */
    private String studentCode;

    /** Mã chuyên ngành (VD: SE, AI...) */
    private String majorCode;

    /** Tên chuyên ngành (VD: Kỹ thuật phần mềm...) */
    private String majorName;

    /** Tên vai trò (STUDENT, ALUMNI, ADMIN) */
    private String role;

    /** Trạng thái tài khoản (PENDING, ACTIVE, LOCKED, WAITING_APPROVAL) */
    private String accountStatus;

    /** Trạng thái xác thực hồ sơ tốt nghiệp */
    private Boolean isAccountVerified;

    /** Trạng thái xác minh email */
    private Boolean emailVerified;

    /** Phương thức đăng nhập (LOCAL, GOOGLE) */
    private String authProvider;

    /** Thời điểm đăng ký tài khoản */
    private Instant createdAt;

    /** Thời điểm cập nhật tài khoản gần nhất */
    private Instant updatedAt;

    /** Thời điểm đăng nhập gần nhất */
    private Instant lastLoginAt;

    /** Dòng giới thiệu ngắn */
    private String headline;

    /** Tiểu sử/Giới thiệu bản thân */
    private String biography;


    /** Thành phố sinh sống */
    private String city;

    /** Danh sách liên kết mạng xã hội/website */
    private List<String> socialLinks;
}
