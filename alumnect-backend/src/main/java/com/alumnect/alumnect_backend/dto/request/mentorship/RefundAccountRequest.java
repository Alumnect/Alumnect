package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Tài khoản ngân hàng nhận hoàn tiền của Học viên. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundAccountRequest {

    @NotBlank(message = "Tên ngân hàng không được để trống.")
    @Size(max = 100)
    private String bankName;

    @NotBlank(message = "Mã BIN ngân hàng không được để trống.")
    @Pattern(regexp = "\\d{6}", message = "Mã BIN ngân hàng phải gồm 6 chữ số.")
    private String bankBin;

    @NotBlank(message = "Số tài khoản không được để trống.")
    @Pattern(regexp = "\\d{6,30}", message = "Số tài khoản chỉ gồm 6–30 chữ số.")
    private String bankAccountNumber;

    @NotBlank(message = "Tên chủ tài khoản không được để trống.")
    @Size(max = 150)
    private String bankAccountHolder;
}
