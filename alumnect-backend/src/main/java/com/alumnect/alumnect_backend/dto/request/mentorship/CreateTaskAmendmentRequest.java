package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Request tạo Ticket điều chỉnh Task: phạm vi, kết quả kỳ vọng, thời hạn và số tiền bổ sung (UC109, mục 5.8).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTaskAmendmentRequest {

    /** Phạm vi công việc mới đề xuất (nếu có thay đổi) */
    @Size(max = 5000, message = "Phạm vi công việc tối đa 5000 ký tự")
    private String newScope;

    /** Kết quả kỳ vọng mới đề xuất (nếu có thay đổi) */
    @Size(max = 5000, message = "Kết quả kỳ vọng tối đa 5000 ký tự")
    private String newExpectedResult;

    /** Số tiền bổ sung cụ thể (>= 0) */
    @DecimalMin(value = "0.0", message = "Số tiền bổ sung không được âm")
    @Builder.Default
    private BigDecimal additionalAmount = BigDecimal.ZERO;

    /** Thời hạn mới đề xuất (nếu có thay đổi) */
    private Instant newDeadline;

    /** Lý do đề xuất điều chỉnh */
    @NotBlank(message = "Lý do điều chỉnh không được để trống")
    @Size(min = 10, max = 1000, message = "Lý do điều chỉnh phải từ 10 đến 1000 ký tự")
    private String reason;
}
