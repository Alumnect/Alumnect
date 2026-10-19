package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO chi tiết một giao dịch trong Sổ quỹ Mentoring (Escrow Inflow, Payout, Refund) - UC105, UC120, UC121.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringPaymentLedgerResponse {

    private Long id;
    private Long paymentId;
    private Long taskId;
    private Long requestId;
    private Long dealId;
    private MentoringParticipantResponse student;
    private MentoringParticipantResponse mentor;
    private BigDecimal amount;
    private MentoringLedgerTransactionType transactionType;
    private MentoringLedgerStatus status;
    private String providerReference;
    private String providerStatus;
    private String failureCode;
    private Instant transactedAt;
    private Instant deadlineSnapshot;
    private String note;
    private Instant createdAt;
    private Instant updatedAt;
}
