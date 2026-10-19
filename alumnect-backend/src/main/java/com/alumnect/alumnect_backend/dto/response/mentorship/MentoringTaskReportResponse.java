package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO Báo cáo kết quả Task & Trạng thái thanh toán (UC114).
 * Hiển thị toàn diện Task Summary, Deal, Deadline, Work Logs, Deliverables và phân chia dòng tiền.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskReportResponse {

    // 1. Task Overview
    private Long taskId;
    private String taskTitle;
    private String description;
    private MentoringTaskStatus taskStatus;
    private Instant createdAt;
    private Instant completedAt;
    private Long durationDays;

    // 2. Deal & Scope Info
    private Long dealId;
    private String workingMode;
    private String participationType;
    private String taskType;
    private String expectedResult;

    // 3. Deadline & Extensions
    private Instant originalDeadline;
    private Instant finalDeadline;
    private Integer extensionCount;
    private Long totalExtensionDays;

    // 4. Progress & Deliverables
    private Integer totalWorkLogs;
    private Integer confirmedWorkLogs;
    private Double progressPercentage;
    private MentoringTaskCompletionResponse completionSummary;

    // 5. Amendments & Adjustments
    private Integer amendmentCount;
    private BigDecimal totalAdditionalAmount;

    // 6. Dispute & Settlement Ticket (nếu có)
    private MentoringDisputeTicketResponse activeTicket;
    private Boolean isDisputed;

    // 7. Financial Breakdown
    private BigDecimal originalPrice;
    private BigDecimal totalAgreedPrice;
    private BigDecimal studentTotalPaid;
    private BigDecimal studentRefundAmount;
    private String studentRefundStatus; // NO_REFUND, PROCESSING, REFUNDED, ON_HOLD

    private BigDecimal mentorEarnedAmount;
    private BigDecimal platformFee;
    private BigDecimal mentorNetPayout;
    private String mentorPayoutStatus; // PENDING_ESCROW, PROCESSING, PAID, ON_HOLD

    private String platformFeeNote;

    // 8. Participants
    private MentoringParticipantResponse student;
    private MentoringParticipantResponse mentor;
}
