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
import java.util.List;

/**
 * DTO trả về thông tin chi tiết một yêu cầu Mentoring dành riêng cho Mentor tiếp nhận (UC103).
 * Bao gồm đầy đủ thông tin sinh viên, nội dung yêu cầu, tệp đính kèm, trạng thái phản hồi của Mentor hiện tại,
 * và các cờ quyền hành động (canRespond, canMessage).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin chi tiết một yêu cầu Mentoring gửi tới Mentor (UC103)")
public class MentorIncomingRequestDetailResponse {

    /** ID của yêu cầu Mentoring (mentoring_requests.id) */
    @Schema(description = "ID của yêu cầu Mentoring", example = "101")
    private Long id;

    /** ID của bản ghi phân phối (mentoring_request_distributions.id) */
    @Schema(description = "ID của bản ghi phân phối tới Mentor", example = "501")
    private Long distributionId;

    /** Request có cùng một trong các ngành Mentor đã đăng ký hỗ trợ hay không */
    @Schema(description = "Request thuộc ngành Mentor đang hỗ trợ", example = "true")
    private boolean sameIndustry;

    /** Working mode và participation type có tương thích với lựa chọn của Mentor hay không */
    @Schema(description = "Request phù hợp hình thức hướng dẫn Mentor đã chọn", example = "true")
    private boolean sameFormat;

    /** Loại yêu cầu: GENERAL hoặc DIRECT */
    @Schema(description = "Loại yêu cầu (GENERAL hoặc DIRECT)", example = "GENERAL")
    private MentoringRequestType requestType;

    /** Tiêu đề yêu cầu hỗ trợ */
    @Schema(description = "Tiêu đề yêu cầu hỗ trợ", example = "Cần tư vấn kiến trúc Spring Boot Microservices")
    private String title;

    /** Nội dung chi tiết nhu cầu hỗ trợ */
    @Schema(description = "Nội dung chi tiết nhu cầu hỗ trợ")
    private String description;

    /** ID lĩnh vực / ngành nghề */
    @Schema(description = "ID lĩnh vực chuyên môn", example = "1")
    private Long industryId;

    /** Tên lĩnh vực / ngành nghề */
    @Schema(description = "Tên lĩnh vực chuyên môn", example = "Kỹ thuật phần mềm")
    private String industryName;

    // --- Thông tin sinh viên ---

    /** ID tài khoản sinh viên */
    @Schema(description = "ID tài khoản sinh viên", example = "202")
    private Long studentId;

    /** Họ tên sinh viên */
    @Schema(description = "Họ tên sinh viên", example = "Nguyễn Văn Sinh Viên")
    private String studentName;

    /** Ảnh đại diện sinh viên */
    @Schema(description = "URL ảnh đại diện sinh viên", example = "https://example.com/avatar.jpg")
    private String studentAvatar;

    /** Headline / thông tin giới thiệu sinh viên */
    @Schema(description = "Headline sinh viên", example = "Sinh viên K18 chuyên ngành KTPM - ĐH FPT")
    private String studentHeadline;

    /** Email sinh viên (hiển thị khi sinh viên cho phép hoặc khi trao đổi) */
    @Schema(description = "Email của sinh viên", example = "sinhvien@fpt.edu.vn")
    private String studentEmail;

    // --- Thông số yêu cầu ---

    /** Ngân sách tối thiểu */
    @Schema(description = "Ngân sách tối thiểu dự kiến", example = "200000")
    private BigDecimal budgetMin;

    /** Ngân sách tối đa */
    @Schema(description = "Ngân sách tối đa dự kiến", example = "500000")
    private BigDecimal budgetMax;

    /** Hình thức làm việc */
    @Schema(description = "Hình thức làm việc (ONLINE, OFFLINE, BOTH)", example = "ONLINE")
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia */
    @Schema(description = "Hình thức tham gia (INDIVIDUAL, GROUP, BOTH)", example = "INDIVIDUAL")
    private MentoringType participationType;

    /** Loại nhiệm vụ */
    @Schema(description = "Loại nhiệm vụ hỗ trợ", example = "TECHNICAL_CONSULTING")
    private MentoringTaskType taskType;

    /** Thời hạn mong muốn */
    @Schema(description = "Thời hạn mong muốn hoàn thành")
    private Instant expectedDeadline;

    /** Trạng thái tổng thể của yêu cầu (OPEN, MATCHED, CLOSED, CANCELLED) */
    @Schema(description = "Trạng thái tổng thể của yêu cầu", example = "OPEN")
    private MentoringRequestStatus requestStatus;

    /** Danh sách tệp đính kèm */
    @Schema(description = "Danh sách tài liệu đính kèm yêu cầu")
    private List<MentoringAttachmentResponse> attachments;

    // --- Trạng thái phản hồi của Mentor hiện tại ---

    /** Trạng thái phân phối trong DB (PENDING, ACCEPTED, REJECTED, EXPIRED) */
    @Schema(description = "Trạng thái phân phối trong cơ sở dữ liệu", example = "PENDING")
    private MentoringDistributionStatus distributionStatus;

    /** Trạng thái phản hồi theo thuật ngữ nghiệp vụ (WAITING, ACCEPTED, DECLINED, EXPIRED) */
    @Schema(description = "Trạng thái phản hồi nghiệp vụ hiển thị", example = "WAITING")
    private String responseStatus;

    /** Lời nhắn hoặc lý do phản hồi của Mentor */
    @Schema(description = "Lời nhắn hoặc lý do phản hồi của Mentor", example = "Rất vui được hỗ trợ bạn.")
    private String responseNote;

    /** Thời điểm yêu cầu được phân phối tới Mentor */
    @Schema(description = "Thời điểm yêu cầu được gửi tới Mentor")
    private Instant distributedAt;

    /** Thời điểm Mentor phản hồi */
    @Schema(description = "Thời điểm Mentor phản hồi")
    private Instant respondedAt;

    /** Cờ đánh dấu Mentor có thể phản hồi yêu cầu hay không (chưa phản hồi & request OPEN & mentor ACTIVE & subscription hợp lệ) */
    @Schema(description = "Mentor có quyền phản hồi (ACCEPT/DECLINE) yêu cầu này hay không", example = "true")
    private boolean canRespond;

    /** Cờ đánh dấu Mentor có thể bắt đầu nhắn tin trao đổi hay không (khi đã ACCEPTED) */
    @Schema(description = "Mentor có quyền nhắn tin trao đổi với sinh viên hay không", example = "false")
    private boolean canMessage;

    /** ID Chat for Task giữa Mentor và Học viên của Request này (có sau khi Mentor ACCEPT) */
    @Schema(description = "ID Chat for Task (Conversation MENTORING) của Request + Student + Mentor", example = "15")
    private Long conversationId;

    /** Mentor hiện tại có phải là Mentor được Học viên chốt chọn cho Request hay không */
    @Schema(description = "Mentor hiện tại có phải Mentor được chọn cho Request", example = "false")
    private boolean selectedMentor;

    /** Request đã chốt Mentor khác (Chat for Task của Mentor hiện tại chỉ đọc) */
    @Schema(description = "Request đã chọn Mentor khác", example = "false")
    private boolean otherMentorSelected;

    /** Thời điểm tạo yêu cầu */
    @Schema(description = "Thời điểm sinh viên tạo yêu cầu")
    private Instant createdAt;

    /** Thời điểm cập nhật yêu cầu */
    @Schema(description = "Thời điểm cập nhật yêu cầu gần nhất")
    private Instant updatedAt;
}
