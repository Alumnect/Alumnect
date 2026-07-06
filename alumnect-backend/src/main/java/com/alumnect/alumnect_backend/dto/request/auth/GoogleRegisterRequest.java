package com.alumnect.alumnect_backend.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin yêu cầu đăng ký tài khoản mới bằng tài khoản Google.
 * Không yêu cầu mật khẩu mà sử dụng Google ID token để xác thực email.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleRegisterRequest {

    /** Token ID nhận được từ Google Identity Services phía Client */
    @NotBlank(message = "Google ID token không được để trống")
    private String token;

    /** Họ và tên của người dùng (có thể lấy mặc định từ Google hoặc do người dùng tự nhập) */
    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 150, message = "Họ và tên không được vượt quá 150 ký tự")
    private String fullName;

    /** Vai trò muốn đăng ký: STUDENT (Sinh viên) hoặc ALUMNI (Cựu sinh viên) */
    @NotBlank(message = "Vai trò không được để trống")
    private String role; // STUDENT or ALUMNI

    /** ID của chuyên ngành học, tham chiếu từ danh mục chuyên ngành */
    @NotNull(message = "Chuyên ngành không được để trống")
    private Long majorId;

    /** Khóa học (năm nhập học) */
    @NotNull(message = "Khóa học không được để trống")
    private Integer cohort;

    /** Mã số sinh viên (bắt buộc đối với tất cả người dùng) */
    @NotBlank(message = "Mã số sinh viên không được để trống")
    @Size(max = 20, message = "Mã số sinh viên không được vượt quá 20 ký tự")
    private String studentCode;

    /** Năm tốt nghiệp (chỉ áp dụng cho ALUMNI) */
    private Integer graduationYear;

    /** Đường dẫn minh chứng tốt nghiệp (chỉ áp dụng cho ALUMNI) */
    @Size(max = 500, message = "URL minh chứng không được vượt quá 500 ký tự")
    private String proofUrl;

    /** Ghi chú gửi kèm khi đăng ký (chỉ áp dụng cho ALUMNI) */
    @Size(max = 500, message = "Ghi chú không được vượt quá 500 ký tự")
    private String note;
}
