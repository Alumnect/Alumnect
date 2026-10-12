package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO trả về thông tin tóm tắt một yêu cầu Mentoring trong danh sách Incoming Requests của Mentor (UC103).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin tóm tắt một yêu cầu Mentoring trong danh sách gửi đến của Mentor")
public class MentorIncomingRequestResponse {

    /** ID của yêu cầu Mentoring (mentoring_requests.id) */
    @Schema(description = "ID của yêu cầu Mentoring", example = "101")
    private Long id;

    /** ID của bản ghi phân phối (mentoring_request_distributions.id) */
    @Schema(description = "ID của bản ghi phân phối tới Mentor", example = "501")
    private Long distributionId;

    /** Loại yêu cầu: GENERAL (chung UC100) hoặc DIRECT (trực tiếp UC101) */
    @Schema(description = "Loại yêu cầu Mentoring (GENERAL hoặc DIRECT)", example = "GENERAL")
    private MentoringRequestType requestType;

    /** Tiêu đề yêu cầu hỗ trợ */
    @Schema(description = "Tiêu đề yêu cầu hỗ trợ", example = "Cần tư vấn kiến trúc Spring Boot Microservices")
    private String title;

    /** Tóm tắt nội dung yêu cầu */
    @Schema(description = "Nội dung yêu cầu hỗ trợ", example = "Em đang chuẩn bị đồ án tốt nghiệp cần tư vấn...")
    private String description;

    /** ID lĩnh vực / chuyên ngành */
    @Schema(description = "ID lĩnh vực chuyên môn", example = "1")
    private Long industryId;

    /** Tên lĩnh vực / chuyên ngành */
    @Schema(description = "Tên lĩnh vực chuyên môn", example = "Kỹ thuật phần mềm")
    private String industryName;

    /** ID sinh viên gửi yêu cầu */
    @Schema(description = "ID sinh viên gửi yêu cầu", example = "202")
    private Long studentId;

    /** Họ tên sinh viên */
    @Schema(description = "Họ tên sinh viên gửi yêu cầu", example = "Nguyễn Văn Sinh Viên")
    private String studentName;

    /** Ảnh đại diện sinh viên */
    @Schema(description = "URL ảnh đại diện của sinh viên", example = "https://example.com/avatar.jpg")
    private String studentAvatar;

    /** Headline / giới thiệu của sinh viên */
    @Schema(description = "Chuyên ngành / Headline của sinh viên", example = "Sinh viên K18 - ĐH FPT Hà Nội")
    private String studentHeadline;

    /** Ngân sách tối thiểu dự kiến */
    @Schema(description = "Ngân sách tối thiểu dự kiến", example = "200000")
    private BigDecimal budgetMin;

    /** Ngân sách tối đa dự kiến */
    @Schema(description = "Ngân sách tối đa dự kiến", example = "500000")
    private BigDecimal budgetMax;

    /** Hình thức làm việc mong muốn */
    @Schema(description = "Hình thức làm việc (ONLINE, OFFLINE, BOTH)", example = "ONLINE")
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia mong muốn */
    @Schema(description = "Hình thức tham gia (INDIVIDUAL, GROUP, BOTH)", example = "INDIVIDUAL")
    private MentoringType participationType;

    /** Loại nhiệm vụ cần hỗ trợ */
    @Schema(description = "Loại nhiệm vụ (CAREER_ORIENTATION, TECHNICAL_CONSULTING...)", example = "TECHNICAL_CONSULTING")
    private MentoringTaskType taskType;

    /** Thời hạn mong muốn hoàn thành */
    @Schema(description = "Thời hạn mong muốn hoàn thành phiên hỗ trợ")
    private Instant expectedDeadline;

    /** Trạng thái phân phối trong DB (PENDING, ACCEPTED, REJECTED, EXPIRED) */
    @Schema(description = "Trạng thái phân phối trong cơ sở dữ liệu", example = "PENDING")
    private MentoringDistributionStatus distributionStatus;

    /** Trạng thái phản hồi nghiệp vụ hiển thị (WAITING, ACCEPTED, DECLINED, EXPIRED) */
    @Schema(description = "Trạng thái phản hồi nghiệp vụ hiển thị", example = "WAITING")
    private String responseStatus;

    /** Lời nhắn hoặc lý do phản hồi của Mentor */
    @Schema(description = "Lời nhắn hoặc lý do phản hồi của Mentor", example = "Tôi rất sẵn lòng trao đổi.")
    private String responseNote;

    /** Thời điểm yêu cầu được phân phối tới Mentor */
    @Schema(description = "Thời điểm yêu cầu được gửi tới hộp thư của Mentor")
    private Instant distributedAt;

    /** Thời điểm Mentor phản hồi */
    @Schema(description = "Thời điểm Mentor phản hồi tiếp nhận hoặc từ chối")
    private Instant respondedAt;

    /** Trạng thái tổng thể của yêu cầu (OPEN, MATCHED, CLOSED, CANCELLED) */
    @Schema(description = "Trạng thái tổng thể của yêu cầu", example = "OPEN")
    private MentoringRequestStatus requestStatus;

    /** Số lượng tài liệu đính kèm */
    @Schema(description = "Số lượng tài liệu đính kèm", example = "2")
    private int attachmentCount;

    /** Thời điểm tạo yêu cầu */
    @Schema(description = "Thời điểm sinh viên tạo yêu cầu")
    private Instant createdAt;
}
