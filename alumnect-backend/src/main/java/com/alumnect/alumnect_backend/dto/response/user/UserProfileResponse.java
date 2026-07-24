package com.alumnect.alumnect_backend.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO chứa thông tin trả về của hồ sơ người dùng cho phía Client.
 * Thể hiện thông tin cá nhân công khai của sinh viên/cựu sinh viên.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    /** Khóa chính của người dùng (user_id) */
    private Long userId;

    /** Địa chỉ email tài khoản */
    private String email;

    /** Vai trò của người dùng (STUDENT, ALUMNI, ADMIN) */
    private String role;

    /** Họ và tên đầy đủ */
    private String fullName;

    /** Đường dẫn ảnh đại diện */
    private String avatarUrl;

    /** Số điện thoại liên hệ */
    private String phone;

    /** Chuyên ngành học */
    private MajorResponse major;

    /** Niên khóa học (năm nhập học) */
    private Integer cohort;

    /** Mã số sinh viên */
    private String studentCode;

    /** Dòng giới thiệu ngắn */
    private String headline;

    /** Tiểu sử/Giới thiệu bản thân */
    private String biography;

    /** Cơ sở đào tạo của FPT University */
    private String campus;

    /** Năm tốt nghiệp hoặc dự kiến tốt nghiệp */
    private Integer graduationYear;


    /** Thành phố sinh sống hoặc làm việc */
    private String city;

    /** Vĩ độ địa lý phục vụ cho bản đồ */
    private BigDecimal latitude;

    /** Kinh độ địa lý phục vụ cho bản đồ */
    private BigDecimal longitude;

    /** Danh sách các liên kết mạng xã hội/website của người dùng */
    private List<String> socialLinks;

    /** Đường dẫn ảnh bìa hồ sơ */
    private String coverUrl;

    /** Thời điểm đăng ký tài khoản */
    private Instant createdAt;

    /** Thời điểm cập nhật tài khoản gần nhất */
    private Instant updatedAt;

    /** Trạng thái tài khoản (PENDING, ACTIVE, LOCKED, WAITING_APPROVAL) */
    private String accountStatus;

    /** Trạng thái xác thực hồ sơ */
    private Boolean isAccountVerified;

    /** Thông tin kinh nghiệm làm việc chính hiện tại */
    private PrimaryExperienceResponse primaryExperience;

    /** Danh sách kinh nghiệm làm việc của người dùng */
    private List<ExperienceResponse> experiences;

    /** Danh sách kỹ năng của người dùng */
    private List<UserSkillResponse> skills;
}
