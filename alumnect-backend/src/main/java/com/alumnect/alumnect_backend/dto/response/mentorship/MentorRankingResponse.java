package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO đại diện cho một mục Mentor trong bảng xếp hạng theo lĩnh vực chuyên môn (UC97).
 * Cung cấp đầy đủ chỉ số uy tín, thông tin định danh và công tác hiện tại để hiển thị trên giao diện xếp hạng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorRankingResponse {

    /** Thứ hạng trong lĩnh vực chuyên môn (1-based index toàn cục theo phân trang) */
    private Integer rank;

    /** ID hồ sơ Mentor (mentor_profiles.id) */
    private Long mentorId;

    /** ID tài khoản người dùng của Mentor (users.id, dùng để điều hướng xem hồ sơ cá nhân) */
    private Long userId;

    /** Họ và tên đầy đủ của Mentor */
    private String fullName;

    /** URL ảnh đại diện của Mentor */
    private String avatarUrl;

    /** Dòng tiêu đề ngắn hiển thị dưới tên (Headline) */
    private String headline;

    /** Tên công ty công tác hiện tại */
    private String currentCompany;

    /** Vị trí / chức danh công tác hiện tại */
    private String currentPosition;

    /** ID của lĩnh vực chuyên môn (ngành nghề) */
    private Long fieldId;

    /** Tên lĩnh vực chuyên môn (ngành nghề) */
    private String fieldName;

    /** Điểm uy tín tổng hợp của Mentor */
    private Integer reputationScore;

    /** Tổng số nhiệm vụ / phiên cố vấn đã hoàn thành */
    private Integer completedTasks;

    /** Điểm đánh giá trung bình của Mentor */
    private BigDecimal rating;

    /** Tổng số lượt đánh giá nhận được */
    private Integer reviewCount;
}
