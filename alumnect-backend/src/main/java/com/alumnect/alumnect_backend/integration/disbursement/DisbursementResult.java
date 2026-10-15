package com.alumnect.alumnect_backend.integration.disbursement;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Kết quả xử lý lệnh chi tiền (Payout / Refund).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisbursementResult {

    private String providerReference;
    private String providerTransactionId;
    private String providerStatus;
    private String failureCode;
    private MentoringLedgerStatus status;
    private String message;
    private Instant transactedAt;
}
