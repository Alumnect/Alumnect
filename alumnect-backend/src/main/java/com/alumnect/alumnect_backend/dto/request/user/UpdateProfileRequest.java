package com.alumnect.alumnect_backend.dto.request.user;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO yêu cầu cập nhật thông tin hồ sơ cá nhân của người dùng.
 * Áp dụng validation tiếng Việt theo chuẩn dự án.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    /** Họ và tên hiển thị đầy đủ */
    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 150, message = "Họ và tên không được vượt quá 150 ký tự")
    private String fullName;

    /** Đường dẫn ảnh đại diện */
    @Size(max = 500, message = "Đường dẫn ảnh đại diện không được vượt quá 500 ký tự")
    private String avatarUrl;

    /** Đường dẫn ảnh bìa hồ sơ */
    @Size(max = 500, message = "Đường dẫn ảnh bìa không được vượt quá 500 ký tự")
    private String coverUrl;

    /** Số điện thoại liên hệ */
    @Pattern(regexp = "^$|^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không đúng định dạng Việt Nam")
    private String phone;

    /** Dòng giới thiệu ngắn (Headline) */
    @Size(max = 160, message = "Dòng giới thiệu không được vượt quá 160 ký tự")
    private String headline;

    /** Tiểu sử hoặc phần giới thiệu bản thân chi tiết */
    private String biography;

    /** Cơ sở FPT University (VD: FPT University Đà Nẵng, Hà Nội...) */
    @Size(max = 80, message = "Tên cơ sở không được vượt quá 80 ký tự")
    private String campus;

    /** Niên khóa học (khóa nhập học) */
    private Integer cohort;

    /** ID của chuyên ngành học */
    private Long majorId;

    /** Năm tốt nghiệp hoặc năm dự kiến tốt nghiệp */
    private Integer graduationYear;

    /** Thành phố / Địa điểm hiện tại */
    @Size(max = 120, message = "Thành phố không được vượt quá 120 ký tự")
    private String city;

    /** Danh sách liên kết cá nhân (LinkedIn, GitHub, Portfolio...) */
    private List<String> socialLinks;

    /** Danh sách kỹ năng cá nhân */
    @Valid
    private List<UserSkillRequest> skills;
}
