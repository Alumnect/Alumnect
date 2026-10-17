package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTicketStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Phản hồi chi tiết Settlement / Dispute Ticket gửi Admin (UC111 & UC112).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringDisputeTicketResponse {

    /** ID của Ticket */
    private Long id;

    /** Mã hiển thị duy nhất (ST-XXXX hoặc DP-XXXX) */
    private String ticketCode;

    /** Loại Ticket: SETTLEMENT hoặc DISPUTE */
    private MentoringTicketType ticketType;

    /** ID của nhiệm vụ Task */
    private Long taskId;

    /** Tiêu đề Task */
    private String taskTitle;

    /** ID cuộc trò chuyện Chat for Task */
    private Long conversationId;

    /** ID đề xuất phân chia tiền (nếu là SETTLEMENT) */
    private Long settlementProposalId;

    /** Người tạo Ticket */
    private MentoringParticipantResponse createdBy;

    /** Học viên liên quan */
    private MentoringParticipantResponse student;

    /** Cố vấn liên quan */
    private MentoringParticipantResponse mentor;

    /** Tiêu đề Ticket */
    private String title;

    /** Mô tả lý do / chi tiết */
    private String description;

    /** Lý do tranh chấp (UC112) */
    private String disputeReason;

    /** Phương án mong muốn của người gửi khiếu nại (UC112) */
    private String desiredSolution;

    /** Danh sách bằng chứng tranh chấp đính kèm (UC112 & UC113) */
    private java.util.List<MentoringTicketEvidenceResponse> evidences;

    /** Số tiền cho Mentor (VND) */
    private BigDecimal mentorAmount;

    /** Số tiền hoàn trả cho Học viên (VND) */
    private BigDecimal studentRefund;

    /** Tổng ngân sách xử lý của Task (VND) */
    private BigDecimal totalAmount;

    /** Trạng thái Ticket: OPEN, IN_REVIEW, RESOLVED, REJECTED, CANCELLED */
    private MentoringTicketStatus status;

    /** Admin tiếp nhận xử lý (nếu có) */
    private MentoringParticipantResponse handledBy;

    /** Thời điểm Admin tiếp nhận */
    private Instant acceptedAt;

    /** Thời điểm giải quyết */
    private Instant resolvedAt;

    /** Ghi chú giải quyết của Admin */
    private String resolutionNote;

    /** Phương án giải quyết chính thức của Admin (UC120) */
    private com.alumnect.alumnect_backend.common.enums.MentoringTicketDecision decision;

    /** Phí xử lý tranh chấp (VND) */
    private BigDecimal disputeFee;

    /** Trạng thái quyết toán tiền (UC120 - PENDING, PROCESSING, PARTIALLY_PAID, SETTLED, FAILED) */
    private com.alumnect.alumnect_backend.common.enums.MentoringSettlementStatus settlementStatus;

    /** ID giao dịch Payout cho Mentor trong sổ quỹ (nếu có) */
    private Long mentorPayoutLedgerId;

    /** ID giao dịch Refund cho Student trong sổ quỹ (nếu có) */
    private Long studentRefundLedgerId;

    /** Thời điểm tạo */
    private Instant createdAt;

    /** Thời điểm cập nhật */
    private Instant updatedAt;
}
