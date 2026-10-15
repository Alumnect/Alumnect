package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/** Một khoản tiền chi ra (thù lao Mentor hoặc hoàn tiền Học viên) hiển thị trong ví. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentoringWalletItemResponse {
    private Long ledgerId;
    private Long taskId;
    private String taskTitle;
    private String counterpartName;
    private BigDecimal amount;
    private MentoringLedgerStatus status;
    private String providerStatus;
    private String note;
    private Instant transactedAt;
    private Instant createdAt;
}
