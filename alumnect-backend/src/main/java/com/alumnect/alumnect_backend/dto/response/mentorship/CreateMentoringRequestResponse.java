package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * DTO phản hồi sau khi tạo yêu cầu Mentoring thành công (UC100, UC101).
 * Hỗ trợ cả yêu cầu chung (GENERAL) và yêu cầu trực tiếp gửi tới Mentor cụ thể (DIRECT).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMentoringRequestResponse {

    /** Khóa chính ID của yêu cầu Mentoring vừa tạo */
    private Long id;

    /** Loại yêu cầu: GENERAL (chung - UC100) hoặc DIRECT (trực tiếp - UC101) */
    private MentoringRequestType requestType;

    /** ID của Mentor đích (chỉ có khi requestType là DIRECT) */
    private Long targetMentorId;

    /** Họ tên Mentor đích (chỉ có khi requestType là DIRECT) */
    private String targetMentorName;

    /** URL ảnh đại diện Mentor đích (chỉ có khi requestType là DIRECT) */
    private String targetMentorAvatar;

    /** Chức danh / Khẩu hiệu nghề nghiệp Mentor đích (chỉ có khi requestType là DIRECT) */
    private String targetMentorHeadline;

    /** Tiêu đề yêu cầu */
    private String title;

    /** Mô tả chi tiết yêu cầu */
    private String description;

    /** ID của lĩnh vực cần hỗ trợ */
    private Long industryId;

    /** Tên của ngành nghề / lĩnh vực cần hỗ trợ */
    private String industryName;

    /** Ngân sách tối thiểu (VNĐ) */
    private BigDecimal budgetMin;

    /** Ngân sách tối đa (VNĐ) */
    private BigDecimal budgetMax;

    /** Hình thức làm việc: ONLINE, OFFLINE, BOTH */
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia: INDIVIDUAL, GROUP, BOTH */
    private MentoringType participationType;

    /** Loại nhiệm vụ: CAREER_ORIENTATION, RESUME_REVIEW, MOCK_INTERVIEW... */
    private MentoringTaskType taskType;

    /** Thời hạn mong muốn */
    private Instant expectedDeadline;

    /** Trạng thái hiện tại của yêu cầu (mặc định OPEN) */
    private MentoringRequestStatus status;

    /** Số lượng Mentor ACTIVE phù hợp đã được hệ thống phân phối tự động */
    private Integer matchedCount;

    /** Ghi chú tình trạng phân phối giải thích cho người dùng */
    private String distributionNote;

    /** Danh sách tài liệu đính kèm */
    private List<MentoringAttachmentResponse> attachments;

    /** Thời điểm tạo yêu cầu */
    private Instant createdAt;
}
