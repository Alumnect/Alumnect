package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request tạo đề xuất dừng Task và phân chia tiền giữa Student và Mentor (UC109).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSettlementProposalRequest {

    /** Số tiền thanh toán cho Mentor (>= 0) */
    @NotNull(message = "Số tiền thanh toán cho Mentor không được để trống")
    @DecimalMin(value = "0.0", message = "Số tiền cho Mentor không được âm")
    private BigDecimal mentorAmount;

    /** Số tiền hoàn trả cho Student (>= 0) */
    @NotNull(message = "Số tiền hoàn lại cho Student không được để trống")
    @DecimalMin(value = "0.0", message = "Số tiền hoàn lại cho Student không được âm")
    private BigDecimal studentRefund;

    /** Lý do đề xuất dừng Task và phương án phân chia tiền */
    @NotBlank(message = "Lý do đề xuất dừng Task không được để trống")
    @Size(min = 10, max = 1000, message = "Lý do đề xuất dừng Task phải từ 10 đến 1000 ký tự")
    private String reason;
}
