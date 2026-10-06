package com.alumnect.alumnect_backend.dto.request.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO tiếp nhận dữ liệu đăng ký hoặc lưu nháp hồ sơ Mentor từ Client (UC91).
 * Bean Validation chỉ kiểm tra format và giới hạn độ dài hợp lệ, không ép buộc NotNull
 * để đảm bảo tính năng Lưu nháp (Save Draft) hoạt động an toàn.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorRegistrationRequest {

    /** Họ và tên đầy đủ (chỉnh sửa trực tiếp tại Section 1) */
    @Size(max = 150, message = "Họ và tên tối đa 150 ký tự")
    private String fullName;

    /** Số điện thoại (chỉnh sửa trực tiếp tại Section 1) */
    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    /** Cơ sở đào tạo FPT University */
    @Size(max = 80, message = "Cơ sở đào tạo tối đa 80 ký tự")
    private String campus;

    /** Năm tốt nghiệp */
    private Integer graduationYear;


    /** Lời giới thiệu / định hướng cố vấn riêng biệt (tối đa 2000 ký tự) */
    @Size(max = 2000, message = "Lời giới thiệu tối đa 2000 ký tự")
    private String bio;

    /** Hình thức hướng dẫn: ONLINE, OFFLINE, BOTH (cho phép null khi lưu nháp) */
    private MentoringWorkingMode workingMode;

    /** Loại hình cố vấn: INDIVIDUAL, GROUP, BOTH (cho phép null khi lưu nháp) */
    private MentoringType mentoringType;

    /** Danh sách ID ngành nghề hỗ trợ chuẩn từ bảng industries */
    private List<Long> supportedIndustryIds;

    /** Danh sách các chủ đề cố vấn chuyên sâu tự do của Mentor */
    private List<String> mentoringTopics;

    /** Khóa tệp CV trên Cloudflare R2 sau khi tải lên qua Presigned URL */
    @Size(max = 255, message = "Khóa tệp CV tối đa 255 ký tự")
    private String cvFileKey;

    /** Tên ngân hàng thụ hưởng nhận chi trả */
    @Size(max = 100, message = "Tên ngân hàng tối đa 100 ký tự")
    private String bankName;

    /** Số tài khoản ngân hàng thụ hưởng */
    @Size(max = 50, message = "Số tài khoản ngân hàng tối đa 50 ký tự")
    private String bankAccountNumber;

    /** Tên chủ tài khoản ngân hàng (viết hoa không dấu) */
    @Size(max = 150, message = "Tên chủ tài khoản tối đa 150 ký tự")
    private String bankAccountHolder;
}
