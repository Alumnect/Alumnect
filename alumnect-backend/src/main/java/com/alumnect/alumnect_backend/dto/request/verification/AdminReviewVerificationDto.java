package com.alumnect.alumnect_backend.dto.request.verification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO nhận thông tin phê duyệt hoặc từ chối phiếu yêu cầu của Alumni từ Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReviewVerificationDto {

    /** Trạng thái duyệt mới, chỉ được nhận giá trị APPROVED hoặc REJECTED */
    @NotBlank(message = "Trạng thái phê duyệt không được để trống")
    @Pattern(regexp = "APPROVED|REJECTED", message = "Trạng thái phê duyệt chỉ có thể là APPROVED hoặc REJECTED")
    private String status;

    /** Nhận xét hoặc lý do từ chối từ Admin */
    @Size(max = 500, message = "Nhận xét phê duyệt tối đa 500 ký tự")
    private String reviewNote;
}
