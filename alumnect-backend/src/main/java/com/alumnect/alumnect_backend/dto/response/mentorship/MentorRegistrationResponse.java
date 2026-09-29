package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO trả về toàn bộ thông tin đăng ký Mentor cho Client (UC91).
 * Tổng hợp dữ liệu tái sử dụng từ UserProfile, Experience, UserSkill và dữ liệu đặc thù của Mentor.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorRegistrationResponse {

    /** Cờ thông báo người dùng đã từng lưu hồ sơ đăng ký Mentor hay chưa */
    private boolean hasExistingRegistration;

    /** Trạng thái hồ sơ Mentor hiện tại */
    private MentorStatus mentorStatus;

    /** Cờ kiểm tra hồ sơ đã hoàn tất tất cả điều kiện UC91 hay chưa */
    private boolean isComplete;

    /** Thông tin cá nhân cơ bản (tái sử dụng từ UserProfile & User, Read-only) */
    private PersonalInfo personalInfo;

    /** Thông tin chuyên môn nghề nghiệp (tái sử dụng từ Experience, UserSkill và thông tin Mentor) */
    private ProfessionalInfo professionalInfo;

    /** Thông tin chi tiết về hướng dẫn cố vấn */
    private MentoringInfo mentoringInfo;

    /** Thông tin tệp CV đính kèm (chứa Signed Download URL có thời hạn) */
    private CvInfo cvInfo;

    /** Thông tin tài khoản ngân hàng nhận chi trả (Private 1-1) */
    private PayoutAccountInfo payoutAccount;

    /** Trạng thái chấp thuận Điều khoản Hướng dẫn & Hỗ trợ (UC90) */
    private boolean termsAccepted;

    /** Danh sách các trường còn thiếu cần bổ sung để hoàn tất đăng ký */
    private List<String> missingFields;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonalInfo {
        private String fullName;
        private String avatarUrl;
        private String email;
        private String phone;
        private String campus;
        private String majorName;
        private Integer graduationYear;
        private String studentCode;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfessionalInfo {
        private ReusedFromProfile reusedFromProfile;
        private Integer yearsOfExperience;
        private String bio;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReusedFromProfile {
        private String currentPosition;
        private String currentCompany;
        private List<String> skills;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MentoringInfo {
        private MentoringWorkingMode workingMode;
        private MentoringType mentoringType;
        private List<SupportedIndustryItem> supportedIndustries;
        private List<String> mentoringTopics;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupportedIndustryItem {
        private Long id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CvInfo {
        private String cvFileKey;
        private String cvDownloadUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PayoutAccountInfo {
        private String bankName;
        private String bankAccountNumber;
        private String bankAccountHolder;
    }
}
