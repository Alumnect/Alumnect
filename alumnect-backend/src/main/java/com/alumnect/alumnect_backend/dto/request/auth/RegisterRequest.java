package com.alumnect.alumnect_backend.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin yêu cầu đăng ký tài khoản mới của người dùng.
 * Áp dụng các luật kiểm tra dữ liệu đầu vào (Validation) bằng tiếng Việt.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    /** Họ và tên của người dùng */
    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 150, message = "Họ và tên không được vượt quá 150 ký tự")
    private String fullName;

    /** Địa chỉ email đăng ký */
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
    private String email;

    /** Mật khẩu đăng nhập (yêu cầu độ dài 8-100 ký tự, chứa cả chữ cái và chữ số) */
    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, max = 100, message = "Mật khẩu phải có độ dài từ 8 đến 100 ký tự")
    @Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
        message = "Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số"
    )
    private String password;

    /** Vai trò muốn đăng ký: STUDENT (Sinh viên) hoặc ALUMNI (Cựu sinh viên) */
    @NotBlank(message = "Vai trò không được để trống")
    private String role; // STUDENT or ALUMNI

    /** ID của chuyên ngành học, tham chiếu từ danh mục chuyên ngành */
    @NotNull(message = "Chuyên ngành không được để trống")
    private Long majorId;

    /** Khóa học (năm nhập học) */
    @NotNull(message = "Khóa học không được để trống")
    private Integer cohort;

    /** Mã số sinh viên (tùy chọn với STUDENT, bắt buộc với ALUMNI khi xử lý logic) */
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
