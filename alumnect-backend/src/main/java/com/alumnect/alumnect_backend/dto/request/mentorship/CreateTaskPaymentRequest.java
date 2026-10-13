package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * Request DTO khởi tạo giao dịch thanh toán Task từ Deal (UC105).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTaskPaymentRequest {

    /** ID của thỏa thuận Mentoring Deal đã được xác nhận (DEAL_CONFIRMED) */
    @NotNull(message = "ID của thỏa thuận Deal không được để trống.")
    private Long dealId;
}
