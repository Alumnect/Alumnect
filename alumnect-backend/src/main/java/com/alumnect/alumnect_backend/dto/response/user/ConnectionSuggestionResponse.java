package com.alumnect.alumnect_backend.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * DTO phản hồi thông tin thành viên được gợi ý kết nối (UC10 - View Connection Suggestions).
 * Kế thừa thông tin hiển thị của danh bạ và bổ sung lý do gợi ý phù hợp (Suggestion Reason).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionSuggestionResponse {

    /** ID định danh người dùng */
    private Long userId;

    /** Email tài khoản */
    private String email;

    /** Vai trò (STUDENT / ALUMNI) */
    private String role;

    /** Họ và tên đầy đủ */
    private String fullName;

    /** Đường dẫn ảnh đại diện */
    private String avatarUrl;

    /** Tiêu đề nghề nghiệp / Giới thiệu ngắn */
    private String headline;

    /** Thông tin chuyên ngành đào tạo */
    private MajorResponse major;

    /** Niên khóa / Khóa nhập học */
    private Integer cohort;

    /** Mã số sinh viên (nếu có) */
    private String studentCode;

    /** Tỉnh / Thành phố hiện tại */
    private String city;

    /** Danh sách kỹ năng chuyên môn */
    private List<UserSkillResponse> skills;

    /** Kinh nghiệm làm việc chính / hiện tại */
    private PrimaryExperienceResponse primaryExperience;

    /** Tổng số người đang theo dõi */
    private Long followersCount;

    /** Tổng số người mà tài khoản đang theo dõi */
    private Long followingCount;

    /** Cờ đánh dấu người xem hiện tại đã theo dõi người này chưa */
    private Boolean isFollowing;

    /** Trạng thái xác thực cựu sinh viên */
    private Boolean isAccountVerified;

    /** Thời điểm đăng ký tài khoản */
    private Instant createdAt;

    /** Lý do gợi ý kết nối trực quan (ví dụ: "Cùng chuyên ngành SE", "Cùng niên khóa K15", "Ở cùng Đà Nẵng") */
    private String suggestionReason;

    /** Điểm số độ tương đồng / gợi ý (dùng để sắp xếp độ ưu tiên) */
    private Integer matchScore;
}
