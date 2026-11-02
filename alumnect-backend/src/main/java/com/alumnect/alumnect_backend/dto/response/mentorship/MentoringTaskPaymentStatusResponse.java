package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import lombok.*;

import java.time.Instant;

/**
 * Phản hồi tra cứu trạng thái thanh toán Task (Polling & Realtime check) (UC105).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentoringTaskPaymentStatusResponse {

    private Long paymentId;
    private Long dealId;
    private Long orderCode;
    private PaymentStatus paymentStatus;
    private Instant paidAt;

    private Long taskId;
    private MentoringTaskStatus taskStatus;
    private String message;
}
