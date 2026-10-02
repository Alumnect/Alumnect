package com.alumnect.alumnect_backend.dto.response.payment;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO phản hồi trạng thái giao dịch thanh toán PayOS và trạng thái hồ sơ Mentor (UC93).
 * Phục vụ cho tính năng Polling kiểm tra kết quả giao dịch và cập nhật giao diện thời gian thực.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTransactionStatusResponse {

    /** ID bản ghi giao dịch nội bộ */
    @Schema(description = "ID giao dịch", example = "101")
    private Long transactionId;

    /** Mã đơn hàng PayOS */
    @Schema(description = "Mã đơn hàng PayOS", example = "1727800000000")
    private Long orderCode;

    /** Số tiền giao dịch */
    @Schema(description = "Số tiền thanh toán", example = "250000.00")
    private BigDecimal amount;

    /** Trạng thái giao dịch thanh toán (PENDING, PAID, FAILED, EXPIRED, CANCELLED) */
    @Schema(description = "Trạng thái thanh toán", example = "PAID")
    private PaymentStatus paymentStatus;

    /** Thời điểm thanh toán thành công nếu có */
    @Schema(description = "Thời điểm thanh toán thành công")
    private Instant paidAt;

    /** Thời điểm hết hạn phiên thanh toán */
    @Schema(description = "Thời điểm hết hạn phiên thanh toán")
    private Instant paymentExpiresAt;

    /** Trạng thái gói Mentor Subscription sau xử lý */
    @Schema(description = "Trạng thái subscription", example = "ACTIVE")
    private MentorSubscriptionStatus subscriptionStatus;

    /** Trạng thái hồ sơ Mentor sau khi tính toán lại */
    @Schema(description = "Trạng thái Mentor Status", example = "ACTIVE")
    private MentorStatus mentorStatus;

    /** Thời điểm bắt đầu hiệu lực gói */
    @Schema(description = "Thời điểm bắt đầu gói")
    private Instant subscriptionStartDate;

    /** Thời điểm kết thúc hiệu lực gói mới nhất */
    @Schema(description = "Thời điểm hết hạn gói")
    private Instant subscriptionEndDate;

    /** Cờ báo hiệu giao dịch đã đạt trạng thái kết thúc (terminal state) để Frontend dừng Polling */
    @Schema(description = "Cờ dừng polling (PAID / FAILED / EXPIRED / CANCELLED)", example = "true")
    private Boolean isTerminal;
}
