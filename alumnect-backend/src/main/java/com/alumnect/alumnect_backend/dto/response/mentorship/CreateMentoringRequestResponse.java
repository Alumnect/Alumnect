package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
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
 * DTO phản hồi sau khi tạo yêu cầu Mentoring chung thành công (UC100).
 * Bảo mật thông tin riêng tư của các Mentor recipient theo quy định BR-08.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMentoringRequestResponse {

    /** Khóa chính ID của yêu cầu Mentoring vừa tạo */
    private Long id;

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
