package com.alumnect.alumnect_backend.dto.request.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTicketDecision;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

/**
 * Payload yêu cầu Quản trị viên ra phán quyết giải quyết Ticket tranh chấp / hòa giải (UC120).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminResolveTicketRequest {

    /** Phương án xử lý: FULL_MENTOR_PAYMENT, PARTIAL_SPLIT, FULL_STUDENT_REFUND */
    @NotNull(message = "Vui lòng chọn phương án giải quyết Ticket")
    private MentoringTicketDecision decision;

    /** Lý do / Căn cứ đưa ra phán quyết (Bắt buộc) */
    @NotBlank(message = "Lý do phán quyết không được để trống")
    @Size(min = 10, max = 2000, message = "Lý do phán quyết phải có độ dài từ 10 đến 2000 ký tự")
    private String decisionReason;

    /** Số tiền thanh toán cho Cố vấn (VND) */
    @DecimalMin(value = "0.0", message = "Số tiền thanh toán cho Cố vấn không được âm")
    private BigDecimal mentorAmount;

    /** Số tiền hoàn trả cho Học viên (VND) */
    @DecimalMin(value = "0.0", message = "Số tiền hoàn trả cho Học viên không được âm")
    private BigDecimal studentRefund;

    /** Phí xử lý tranh chấp theo chính sách nền tảng nếu có (VND) */
    @DecimalMin(value = "0.0", message = "Phí xử lý tranh chấp không được âm")
    @Builder.Default
    private BigDecimal disputeFee = BigDecimal.ZERO;

    /** Chế độ chia: AMOUNT hoặc PERCENTAGE */
    private String splitMode;

    /** Tỷ lệ % của Cố vấn (nếu tính theo %) */
    private Double mentorPercentage;

    /** Tỷ lệ % của Học viên (nếu tính theo %) */
    private Double studentPercentage;
}
