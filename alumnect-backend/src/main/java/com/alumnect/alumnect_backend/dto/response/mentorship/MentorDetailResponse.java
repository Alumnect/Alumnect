package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO chi tiết hồ sơ Mentor phục vụ Use Case UC99 — View Mentor Detail.
 * Tổng hợp thông tin hồ sơ công khai, chuyên môn, kỹ năng, kinh nghiệm nghề nghiệp,
 * lĩnh vực hỗ trợ, điểm uy tín và chỉ số hoàn thành nhiệm vụ.
 * Tuân thủ quy định bảo mật: Không chứa bất kỳ thông tin nhạy cảm nào (CV gốc, tài khoản ngân hàng, token...).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorDetailResponse {

    // =========================================================================
    // A. MENTOR PROFILE HEADER & ĐỊNH DANH
    // =========================================================================

    /** ID hồ sơ Mentor (mentor_profiles.id) */
    private Long mentorId;

    /** ID tài khoản người dùng của Mentor (users.id) */
    private Long userId;

    /** Họ và tên đầy đủ của Mentor */
    private String fullName;

    /** URL ảnh đại diện */
    private String avatarUrl;

    /** Dòng tiêu đề ngắn / khẩu hiệu nghề nghiệp */
    private String headline;

    /** Chức danh / Vị trí công tác hiện tại tiêu biểu */
    private String currentPosition;

    /** Công ty / Tổ chức công tác hiện tại tiêu biểu */
    private String currentCompany;

    /** Trạng thái hồ sơ Mentor (INCOMPLETE, PAYMENT_PENDING, ACTIVE, EXPIRED) */
    private MentorStatus mentorStatus;

    /** Huy hiệu xác thực Cựu sinh viên FPT (dựa trên trạng thái xác thực tài khoản) */
    private Boolean isVerifiedAlumni;

    /** Khả năng sẵn sàng tiếp nhận yêu cầu cố vấn mới từ học viên (UC101) */
    private Boolean canReceiveRequest;

    /** Lý do giải thích nếu không đủ điều kiện nhận yêu cầu (dùng hiển thị thông báo nghiệp vụ) */
    private String availabilityReason;

    // =========================================================================
    // B. THÔNG TIN HỌC VẤN (ACADEMIC INFORMATION)
    // =========================================================================

    /** Thông tin học vấn chi tiết tại Đại học FPT */
    private AcademicInfo academicInfo;

    // =========================================================================
    // C. GIỚI THIỆU & TỔNG QUAN (ABOUT MENTOR)
    // =========================================================================

    /** Lời giới thiệu / định hướng cố vấn riêng biệt của Mentor */
    private String bio;

    /** Tiểu sử / Giới thiệu bản thân chi tiết từ hồ sơ người dùng */
    private String biography;

    /** Thành phố nơi Mentor đang sinh sống hoặc làm việc */
    private String city;

    // =========================================================================
    // D. CHUYÊN MÔN & KỸ NĂNG (EXPERTISE & SKILLS)
    // =========================================================================

    /** Hình thức làm việc / hướng dẫn (ONLINE, OFFLINE, BOTH) */
    private MentoringWorkingMode workingMode;

    /** Loại hình cố vấn (INDIVIDUAL, GROUP, BOTH) */
    private MentoringType mentoringType;

    /** Danh sách lĩnh vực hỗ trợ chuẩn (tham chiếu danh mục ngành nghề) */
    private List<SupportedFieldItem> supportedFields;

    /** Danh sách các chủ đề cố vấn chuyên sâu tự do của Mentor */
    private List<String> topics;

    /** Danh sách kỹ năng chuyên môn của Mentor phân theo nhóm */
    private List<SkillItem> skills;

    // =========================================================================
    // E. HÀNH TRÌNH NGHỀ NGHIỆP (CAREER TIMELINE / EXPERIENCES)
    // =========================================================================

    /** Lịch sử kinh nghiệm làm việc công khai của Mentor */
    private List<ExperienceItem> experiences;

    // =========================================================================
    // F. UY TÍN & THÀNH TÍCH CỐ VẤN (REPUTATION & ACHIEVEMENTS)
    // =========================================================================

    /** Điểm uy tín tổng hợp của Mentor (nhất quán với UC97) */
    private Integer reputationScore;

    /** Điểm đánh giá trung bình từ học viên (thang điểm 0.00 đến 5.00) */
    private BigDecimal rating;

    /** Tổng số lượng đánh giá nhận được từ học viên */
    private Integer reviewCount;

    /** Tổng số nhiệm vụ / phiên cố vấn đã hoàn thành */
    private Integer completedTasks;

    // =========================================================================
    // NESTED STATIC DTO CLASSES
    // =========================================================================

    /**
     * DTO lưu thông tin học vấn của Mentor tại FPT University.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AcademicInfo {
        /** Cơ sở đào tạo của Đại học FPT (VD: FPT University Đà Nẵng) */
        private String campus;

        /** Tên chuyên ngành học (VD: Kỹ thuật phần mềm, Trí tuệ nhân tạo) */
        private String majorName;

        /** Mã chuyên ngành học (VD: SE, AI) */
        private String majorCode;

        /** Khóa nhập học (VD: 2018, 2019) */
        private Integer cohort;

        /** Năm tốt nghiệp */
        private Integer graduationYear;
    }

    /**
     * DTO đại diện cho một lĩnh vực hỗ trợ chuyên môn của Mentor.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupportedFieldItem {
        /** ID lĩnh vực / ngành nghề (industries.id) */
        private Long id;

        /** Tên lĩnh vực / ngành nghề (VD: Công nghệ thông tin) */
        private String name;
    }

    /**
     * DTO đại diện cho một kỹ năng chuyên môn của Mentor.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillItem {
        /** ID kỹ năng */
        private Long id;

        /** Tên kỹ năng (VD: Spring Boot, React) */
        private String skillName;

        /** Tên nhóm kỹ năng (VD: Backend, Frontend, Cloud) */
        private String groupName;

        /** Thứ tự sắp xếp ưu tiên */
        private Short sortOrder;
    }

    /**
     * DTO đại diện cho một mốc kinh nghiệm làm việc trên Career Timeline.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExperienceItem {
        /** ID kinh nghiệm làm việc */
        private Long id;

        /** Chức danh / Vị trí công tác */
        private String title;

        /** Tên công ty / Cơ quan làm việc */
        private String company;

        /** Địa điểm làm việc */
        private String location;

        /** Thành phố làm việc */
        private String locationCity;

        /** Ngày bắt đầu công tác */
        private LocalDate startDate;

        /** Ngày kết thúc công tác (null nếu đang làm việc tại đây) */
        private LocalDate endDate;

        /** Đang làm việc tại vị trí này */
        private Boolean isCurrent;

        /** Đánh dấu là vị trí / công việc chính */
        private Boolean isPrimary;

        /** Mô tả chi tiết trách nhiệm và thành tựu công việc */
        private String description;
    }
}
