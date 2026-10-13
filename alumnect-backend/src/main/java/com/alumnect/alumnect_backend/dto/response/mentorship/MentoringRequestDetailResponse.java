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
import java.util.ArrayList;
import java.util.List;

/**
 * DTO chi tiết yêu cầu Mentoring kèm danh sách phản hồi thực tế từ các Mentor (UC102).
 * Thể hiện chính xác sự khác biệt giữa General Request (UC100) và Direct Request (UC101).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringRequestDetailResponse {

    /** Khóa chính ID của yêu cầu Mentoring */
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

    /** Trạng thái hiện tại của yêu cầu (OPEN, MATCHED, CLOSED, CANCELLED) */
    private MentoringRequestStatus status;

    /** Số lượng Mentor ACTIVE phù hợp đã được hệ thống phân phối tự động */
    private Integer matchedCount;

    /** Ghi chú tình trạng phân phối giải thích cho người dùng */
    private String distributionNote;

    /** Danh sách tài liệu đính kèm */
    @Builder.Default
    private List<MentoringAttachmentResponse> attachments = new ArrayList<>();

    /** Thời điểm tạo yêu cầu */
    private Instant createdAt;

    /** Thời điểm cập nhật yêu cầu gần nhất */
    private Instant updatedAt;

    /** Tổng hợp số liệu phản hồi từ các Mentor */
    private MentoringResponseSummaryResponse responseSummary;

    /** ID tài khoản Mentor được chốt chọn (null khi chưa xác nhận Deal) */
    private Long selectedMentorUserId;

    /** ID Deal Ticket đã được hai bên xác nhận và khóa (null khi chưa chốt) */
    private Long confirmedDealId;

    /** ID Mentoring Task được kích hoạt sau khi thanh toán thành công (null khi chưa thanh toán) */
    private Long taskId;

    /**
     * Danh sách chi tiết phản hồi của từng Mentor thực sự liên quan đến yêu cầu:
     * - Nếu GENERAL: Danh sách các Mentor đã thực sự được phân phối yêu cầu.
     * - Nếu DIRECT: Duy nhất Mentor đích được chọn (hoàn toàn không chứa Mentor khác).
     */
    @Builder.Default
    private List<MentorResponseItemResponse> mentorResponses = new ArrayList<>();
}
