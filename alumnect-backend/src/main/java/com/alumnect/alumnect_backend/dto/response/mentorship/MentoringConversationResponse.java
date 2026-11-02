package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO ngữ cảnh đầy đủ của một Chat for Task: truy vết được toàn bộ chuỗi
 * Request → Mentor Response → Conversation → Deal (các phiên bản) → Payment → Task,
 * kèm trạng thái chỉ đọc và các quyền thao tác của người dùng hiện tại (được tính ở backend).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringConversationResponse {

    /** ID Chat for Task (Conversation MENTORING) */
    private Long conversationId;

    /** Vai trò của người dùng hiện tại trong Chat for Task: STUDENT hoặc MENTOR */
    private String myRole;

    // ---------- Request ----------
    /** ID Mentoring Request sở hữu cuộc hội thoại */
    private Long requestId;

    /** Tiêu đề Request */
    private String requestTitle;

    /** Mô tả Request */
    private String requestDescription;

    /** Loại Request: GENERAL (UC100) hoặc DIRECT (UC101) */
    private MentoringRequestType requestType;

    /** Trạng thái Request: OPEN, MATCHED, CLOSED, CANCELLED */
    private MentoringRequestStatus requestStatus;

    /** Lĩnh vực của Request */
    private String industryName;

    /** Ngân sách tối thiểu Học viên đề xuất */
    private BigDecimal budgetMin;

    /** Ngân sách tối đa Học viên đề xuất (dùng làm giá khi Mentor "Chấp nhận Deal theo Request") */
    private BigDecimal budgetMax;

    /** Thời hạn mong muốn của Request */
    private Instant expectedDeadline;

    /** Hình thức làm việc mong muốn */
    private MentoringWorkingMode workingMode;

    /** Hình thức tham gia mong muốn */
    private MentoringType participationType;

    /** Loại nhiệm vụ của Request */
    private MentoringTaskType taskType;

    // ---------- Thành viên ----------
    /** ID tài khoản Học viên */
    private Long studentId;

    /** Họ tên Học viên */
    private String studentName;

    /** Ảnh đại diện Học viên */
    private String studentAvatar;

    /** ID tài khoản Mentor */
    private Long mentorUserId;

    /** ID hồ sơ Mentor */
    private Long mentorProfileId;

    /** Họ tên Mentor */
    private String mentorName;

    /** Ảnh đại diện Mentor */
    private String mentorAvatar;

    /** Trạng thái phản hồi của Mentor với Request: WAITING, ACCEPTED, DECLINED, EXPIRED */
    private String responseStatus;

    /** Thời điểm Mentor phản hồi */
    private Instant respondedAt;

    // ---------- Chọn Mentor ----------
    /** ID tài khoản Mentor được Request chốt chọn (null khi chưa chốt) */
    private Long selectedMentorUserId;

    /** ID Deal đã chốt của Request (null khi chưa chốt) */
    private Long confirmedDealId;

    /** Mentor của cuộc hội thoại này có phải Mentor được chọn hay không */
    private boolean selectedMentor;

    /** Cuộc hội thoại đang ở chế độ chỉ đọc */
    private boolean readOnly;

    /** Lý do chỉ đọc (ví dụ: "Request đã chọn Mentor khác.") */
    private String readOnlyReason;

    // ---------- Deal / Payment / Task ----------
    /** Luồng Deal của cuộc hội thoại kèm toàn bộ phiên bản (null nếu Mentor chưa gửi Deal Ticket) */
    private MentoringDealDetailResponse deal;

    /** Lần thanh toán gần nhất của Deal (null nếu chưa thanh toán lần nào) */
    private MentoringTaskPaymentStatusResponse latestPayment;

    /** ID Mentoring Task được gắn với cuộc hội thoại (null trước khi thanh toán thành công) */
    private Long taskId;

    /** Trạng thái Task hiện tại */
    private MentoringTaskStatus taskStatus;

    // ---------- Quyền thao tác ----------
    /** Người dùng hiện tại có thể gửi tin nhắn */
    private boolean canSendMessage;

    /** Nhóm mentoring gửi Request (null nếu Request cá nhân) */
    private Long groupId;

    private String groupName;

    /** Những người đang tham gia Chat for Task (Học viên, Mentor, thành viên nhóm) */
    private java.util.List<MentoringParticipantResponse> participants;

    /** Mentor có thể "Deal lại / Tạo Deal Ticket" */
    private boolean canCreateDealTicket;

    /** Mentor có thể "Chấp nhận Deal theo Request" */
    private boolean canAcceptDealByRequest;

    /** Lý do không thể "Chấp nhận Deal theo Request" (null nếu có thể) */
    private String acceptByRequestUnavailableReason;
}
