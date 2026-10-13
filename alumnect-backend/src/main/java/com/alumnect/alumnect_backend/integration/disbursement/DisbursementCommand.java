package com.alumnect.alumnect_backend.integration.disbursement;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Lệnh chi tiền (Payout / Refund) gửi tới cổng thanh toán / ngân hàng thụ hưởng (UC105, UC118).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisbursementCommand {

    private Long taskId;
    private Long requestId;
    private Long dealId;
    private Long beneficiaryUserId;
    private BigDecimal amount;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private String description;
    private String originalPaymentReference;
}
