package com.alumnect.alumnect_backend.dto.response.mentorship;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Phản hồi ảnh chụp phương án thỏa thuận dừng Task (Settlement Snapshot) (UC111).
 * Cho phép Student và Mentor xem lại tỷ lệ phân chia tiền đã thống nhất trước khi gửi tới Admin.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringSettlementSnapshotResponse {

    /** ID của nhiệm vụ Task */
    private Long taskId;

    /** Tiêu đề Task */
    private String taskTitle;

    /** ID của đề xuất thỏa thuận dừng Task */
    private Long proposalId;

    /** Số tiền cho Mentor (VND) */
    private BigDecimal mentorAmount;

    /** Số tiền hoàn trả cho Học viên (VND) */
    private BigDecimal studentRefund;

    /** Tổng ngân sách giải quyết của Task (VND) */
    private BigDecimal totalAmount;

    /** Lý do thỏa thuận dừng Task */
    private String reason;

    /** Người đề xuất */
    private String proposerName;

    /** Vai trò người đề xuất */
    private String proposerRole;

    /** Người xác nhận đồng thuận */
    private String responderName;

    /** Vai trò người xác nhận */
    private String responderRole;

    /** Thời điểm hai bên chính thức đồng thuận */
    private Instant agreedAt;

    /** Cả hai bên đã đồng thuận phương án này hay chưa */
    private Boolean isAgreed;

    /** Người dùng hiện tại có quyền gửi Settlement Ticket lên Admin hay không */
    private Boolean canSubmitTicket;

    /** Đã có Ticket đang mở cho Task này hay chưa */
    private Boolean hasOpenTicket;
}
