package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO tóm tắt số liệu Quỹ và dòng tiền theo từng Task Mentoring cho Admin (UC121 & Mục 5.7).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminTaskFundSummaryResponse {

    /** ID của nhiệm vụ Mentoring Task */
    private Long taskId;

    /** Tiêu đề Task */
    private String taskTitle;

    /** Trạng thái hiện tại của Task */
    private MentoringTaskStatus taskStatus;

    /** ID của yêu cầu Mentoring gốc */
    private Long requestId;

    /** Học viên của Task */
    private MentoringParticipantResponse student;

    /** Cố vấn của Task */
    private MentoringParticipantResponse mentor;

    /** Giá trị hợp đồng Deal ban đầu (VND) */
    private BigDecimal initialPrice;

    /** Tổng số tiền thu bổ sung qua các Task Amendment thành công (VND) */
    private BigDecimal totalTopUpAmount;

    /** Tổng số tiền đã thu vào quỹ Escrow (VND) */
    private BigDecimal totalCollected;

    /** Số tiền đang tạm giữ trong quỹ Escrow khả dụng (VND) */
    private BigDecimal escrowHoldingAmount;

    /** Số tiền đang khóa hoặc chờ chi (VND) */
    private BigDecimal lockedAmount;

    /** Phí xử lý tranh chấp / Phí nền tảng nếu có (VND) */
    private BigDecimal platformFee;

    /** Tổng số tiền thù lao đã chi trả cho Cố vấn (VND) */
    private BigDecimal totalPayout;

    /** Tổng số tiền đã hoàn trả cho Học viên (VND) */
    private BigDecimal totalRefund;

    /** Hạn chót hiệu lực hiện tại của Task */
    private Instant currentDeadline;

    /** Trạng thái quyết toán: UNSETTLED (Chưa quyết toán), PARTIALLY_SETTLED (Quyết toán 1 phần), SETTLED (Đã quyết toán hoàn tất) */
    private String settlementStatus;

    /** Ticket tranh chấp / hòa giải đang gắn với Task (nếu có) */
    private Long activeTicketId;
    private String activeTicketCode;
    private String activeTicketStatus;

    /** Thời điểm khởi tạo Task */
    private Instant createdAt;

    /** Thời điểm cập nhật Task */
    private Instant updatedAt;
}
