package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.common.enums.ProposalSource;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO phản hồi thông tin tổng quan của Mentoring Deal (UC104).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringDealResponse {

    /** ID định danh của thỏa thuận Deal / Ticket */
    private Long id;

    /** ID của Ticket (tương đương id của Deal) */
    private Long ticketId;

    /** Loại Ticket: DEAL */
    private String ticketType;

    /** Nguồn gốc đề xuất: REQUEST_ACCEPTANCE hoặc RENEGOTIATION */
    private ProposalSource proposalSource;

    /** ID của Mentoring Request liên kết */
    private Long requestId;

    /** Tiêu đề của Mentoring Request liên kết */
    private String requestTitle;

    /** Trạng thái hiện tại của Mentoring Request liên kết */
    private MentoringRequestStatus requestStatus;

    /** ID của Học viên (Student) */
    private Long studentId;

    /** Họ tên của Học viên */
    private String studentName;

    /** Ảnh đại diện của Học viên */
    private String studentAvatar;

    /** Email của Học viên */
    private String studentEmail;

    /** ID của Cố vấn (Mentor) */
    private Long mentorId;

    /** Họ tên của Cố vấn */
    private String mentorName;

    /** Ảnh đại diện của Cố vấn */
    private String mentorAvatar;

    /** Email của Cố vấn */
    private String mentorEmail;

    /** ID cuộc trò chuyện Direct Messaging liên kết */
    private Long conversationId;

    /** Phạm vi công việc / nội dung chi tiết của Task */
    private String taskScope;

    /** Mức giá thỏa thuận (VND) */
    private BigDecimal agreedPrice;

    /** Hạn chót hoàn thành Task */
    private Instant deadline;

    /** Hình thức làm việc: ONLINE, OFFLINE, BOTH */
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia: INDIVIDUAL, GROUP */
    private MentoringParticipationType participationType;

    /** Loại nhiệm vụ: CONSULTATION, PROJECT_MENTORING... */
    private MentoringTaskType taskType;

    /** Kết quả kỳ vọng đầu ra */
    private String expectedResult;

    /** Phiên bản điều khoản hiện tại */
    private Integer version;

    /** Học viên đã xác nhận phiên bản hiện tại chưa */
    private Boolean studentConfirmed;

    /** Cố vấn đã xác nhận phiên bản hiện tại chưa */
    private Boolean mentorConfirmed;

    /** Thời điểm Học viên xác nhận */
    private Instant studentConfirmedAt;

    /** Thời điểm Cố vấn xác nhận */
    private Instant mentorConfirmedAt;

    /** Trạng thái hiện tại của thỏa thuận: PROPOSED, STUDENT_CONFIRMED, MENTOR_CONFIRMED, DEAL_CONFIRMED, CANCELLED */
    private MentoringDealStatus status;

    /** Cờ đánh dấu snapshot đã bị khóa cứng (khi cả 2 bên cùng confirm) */
    private Boolean isLocked;

    /** Thời điểm khóa snapshot */
    private Instant lockedAt;

    /** ID người khởi tạo thỏa thuận */
    private Long createdByUserId;

    /** Họ tên người khởi tạo thỏa thuận */
    private String createdByName;

    /** ID người cập nhật snapshot gần nhất */
    private Long updatedByUserId;

    /** Họ tên người cập nhật snapshot gần nhất */
    private String updatedByName;

    /** Thời điểm tạo thỏa thuận */
    private Instant createdAt;

    /** Thời điểm cập nhật gần nhất */
    private Instant updatedAt;

    /** Cờ đánh dấu Deal đã được thanh toán (UC105) */
    private Boolean isPaid;

    /** Thời điểm hoàn tất thanh toán */
    private Instant paidAt;

    /** ID của Mentoring Task nếu đã được kích hoạt sau thanh toán */
    private Long taskId;

    /** Người dùng đang đăng nhập có quyền xác nhận phiên bản hiện tại không */
    private Boolean canConfirm;

    /** Người dùng đang đăng nhập có quyền chỉnh sửa điều khoản không (false nếu đã locked) */
    private Boolean canEdit;

    /** Học viên có thể thanh toán Deal này (Deal đã khóa, là confirmed deal của Request, chưa thanh toán) */
    private Boolean canPay;

    /** Học viên có thể từ chối phiên bản Deal Ticket hiện tại */
    private Boolean canReject;

    /** Học viên có thể yêu cầu Mentor điều chỉnh phiên bản Deal Ticket hiện tại */
    private Boolean canRequestAdjustment;

    /** Lý do Chat for Task ở chế độ chỉ đọc (null nếu vẫn hoạt động) */
    private String readOnlyReason;
}
