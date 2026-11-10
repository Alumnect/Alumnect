package com.alumnect.alumnect_backend.dto.request.verification;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO tiếp nhận yêu cầu nâng cấp tài khoản từ Sinh viên (STUDENT) lên Cựu sinh viên (ALUMNI) (UC08).
 * Chứa đường dẫn tài liệu minh chứng tốt nghiệp, năm tốt nghiệp và chuyên ngành học tại FPTU.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitVerificationRequestDto {

    /**
     * Đường dẫn công khai (Public URL) của tài liệu minh chứng tốt nghiệp đã tải lên Cloudflare R2.
     */
    @NotBlank(message = "Vui lòng tải lên tài liệu minh chứng tốt nghiệp")
    @Size(max = 500, message = "Đường dẫn tài liệu minh chứng không được vượt quá 500 ký tự")
    @Pattern(regexp = "^https?://.+", message = "Đường dẫn tài liệu minh chứng không hợp lệ")
    private String proofUrl;

    /**
     * Năm tốt nghiệp chính thức của sinh viên tại Đại học FPT.
     */
    @NotNull(message = "Năm tốt nghiệp không được để trống")
    @Min(value = 2006, message = "Năm tốt nghiệp phải từ năm 2006 trở đi")
    private Integer graduationYear;

    /**
     * ID chuyên ngành tốt nghiệp trong danh mục chuyên ngành FPTU (bảng majors).
     */
    @NotNull(message = "Vui lòng chọn chuyên ngành tốt nghiệp")
    @Positive(message = "Chuyên ngành tốt nghiệp không hợp lệ")
    private Long majorId;
}

