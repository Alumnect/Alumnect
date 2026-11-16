package com.alumnect.alumnect_backend.dto.request.mentorship;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Yêu cầu phản ánh sự cố dòng tiền / ping lại Admin khi chưa hoàn tiền hoặc giải ngân sai.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu phản ánh sự cố dòng tiền gửi tới Ban Quản Trị")
public class PingAdminFinanceRequest {

    @NotBlank(message = "Vui lòng nhập lý do phản ánh sự cố dòng tiền")
    @Size(min = 5, max = 1000, message = "Lý do phản ánh phải từ 5 đến 1000 ký tự")
    @Schema(description = "Nội dung phản ánh sự cố (chưa hoàn tiền, chi sai số tiền, lỗi tài khoản...)", example = "Đã 3 ngày kể từ phán quyết nhưng tài khoản ngân hàng chưa nhận được tiền hoàn trả.")
    private String reason;

    @Schema(description = "Loại sự cố (REFUND_NOT_RECEIVED, WRONG_AMOUNT, ACCOUNT_ERROR, OTHER)", example = "REFUND_NOT_RECEIVED")
    private String issueType;
}
