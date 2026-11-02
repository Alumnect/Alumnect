package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO tóm tắt thông tin thanh toán Task Payment (UC106).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringPaymentSummaryResponse {

    /** ID giao dịch thanh toán */
    private Long paymentId;

    /** Mã đơn hàng PayOS */
    private Long orderCode;

    /** Số tiền thanh toán (VND) */
    private BigDecimal amount;

    /** Trạng thái thanh toán: PENDING, PAID, FAILED, EXPIRED, CANCELLED */
    private PaymentStatus paymentStatus;

    /** Phương thức thanh toán (PAYOS) */
    private String paymentMethod;

    /** Thời điểm thanh toán thành công */
    private Instant paidAt;

    /** Số tài khoản thụ hưởng */
    private String accountNumber;

    /** Tên chủ tài khoản thụ hưởng */
    private String accountName;
}
