package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO đại diện cho một thẻ Mentor trong danh bạ tìm kiếm & lọc (UC98).
 * Cung cấp đầy đủ thông tin tóm tắt để hiển thị Mentor Card phía Client,
 * không để lộ các thông tin nhạy cảm (như email, số điện thoại riêng, tài khoản ngân hàng, file CV gốc).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorCardResponse {

    /** ID hồ sơ Mentor (mentor_profiles.id) */
    private Long mentorId;

    /** ID tài khoản người dùng của Mentor (users.id) */
    private Long userId;

    /** Họ và tên đầy đủ của Mentor */
    private String fullName;

    /** URL ảnh đại diện của Mentor */
    private String avatarUrl;

    /** Tiêu đề ngắn gọn / khẩu hiệu nghề nghiệp (Headline) */
    private String headline;

    /** Lời giới thiệu / định hướng cố vấn riêng */
    private String bio;

    /** Chức danh / vị trí công tác hiện tại */
    private String currentPosition;

    /** Tên công ty / tổ chức công tác hiện tại */
    private String currentCompany;

    /** Tên chuyên ngành học (Specialization / Major) */
    private String specialization;

    /** Mã chuyên ngành học (VD: SE, AI) */
    private String majorCode;

    /** ID chuyên ngành học */
    private Long majorId;

    /** Hình thức làm việc / hướng dẫn: ONLINE, OFFLINE, BOTH */
    private MentoringWorkingMode workingMode;

    /** Loại hình cố vấn: INDIVIDUAL, GROUP, BOTH */
    private MentoringType mentoringType;

    /** Danh sách lĩnh vực / ngành nghề chuyên môn hỗ trợ */
    private List<SupportedFieldItem> supportedFields;

    /** Danh sách các chủ đề cố vấn chuyên sâu */
    private List<String> topics;

    /** Danh sách kỹ năng chuyên môn nổi bật của Mentor */
    private List<String> skills;

    /** Điểm uy tín tổng hợp của Mentor */
    private Integer reputationScore;

    /** Điểm đánh giá trung bình từ học viên (0.00 - 5.00) */
    private BigDecimal rating;

    /** Tổng số lượt đánh giá nhận được */
    private Integer reviewCount;

    /** Tổng số buổi / nhiệm vụ cố vấn đã hoàn thành */
    private Integer completedTasks;

    /**
     * DTO đại diện cho một lĩnh vực hỗ trợ trong Mentor Card.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SupportedFieldItem {
        /** ID lĩnh vực / ngành nghề (industries.id) */
        private Long id;

        /** Tên lĩnh vực / ngành nghề */
        private String name;
    }
}
