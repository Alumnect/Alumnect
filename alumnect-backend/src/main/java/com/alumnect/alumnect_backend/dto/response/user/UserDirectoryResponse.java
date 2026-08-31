package com.alumnect.alumnect_backend.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * DTO phản hồi danh sách tìm kiếm thành viên và danh bạ cựu sinh viên (User Directory).
 * Chứa thông tin tóm tắt hồ sơ công khai, chuyên ngành, kinh nghiệm chính và trạng thái theo dõi.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDirectoryResponse {

    /** Khóa chính tài khoản người dùng */
    private Long userId;

    /** Địa chỉ email của người dùng */
    private String email;

    /** Vai trò của người dùng trong hệ thống (STUDENT, ALUMNI) */
    private String role;

    /** Họ và tên đầy đủ */
    private String fullName;

    /** Đường dẫn ảnh đại diện */
    private String avatarUrl;

    /** Đường dẫn ảnh bìa hồ sơ */
    private String coverUrl;

    /** Dòng giới thiệu ngắn / Chức danh hiện tại */
    private String headline;

    /** Thông tin chuyên ngành đào tạo */
    private MajorResponse major;

    /** Niên khóa / Khóa nhập học (VD: 2021) */
    private Integer cohort;

    /** Mã số sinh viên */
    private String studentCode;

    /** Tỉnh / Thành phố sinh sống hoặc làm việc */
    private String city;

    /** Danh sách các kỹ năng nổi bật của người dùng */
    private List<UserSkillResponse> skills;

    /** Thông tin kinh nghiệm làm việc chính hiện tại */
    private PrimaryExperienceResponse primaryExperience;

    /** Số lượng người đang theo dõi tài khoản này */
    private Long followersCount;

    /** Số lượng người mà tài khoản này đang theo dõi */
    private Long followingCount;

    /** true nếu người dùng đang đăng nhập hiện tại đang theo dõi người này */
    private Boolean isFollowing;

    /** Trạng thái đã xác thực hồ sơ cựu sinh viên / sinh viên */
    private Boolean isAccountVerified;

    /** Thời điểm đăng ký tham gia AlumNect */
    private Instant createdAt;
}
