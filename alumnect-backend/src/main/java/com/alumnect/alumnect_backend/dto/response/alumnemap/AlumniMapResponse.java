package com.alumnect.alumnect_backend.dto.response.alumnemap;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

/**
 * DTO phản hồi chứa thông tin rút gọn của cựu sinh viên phục vụ hiển thị trên bản đồ.
 * Đảm bảo lọc bỏ các thông tin bảo mật/riêng tư như email, số điện thoại, địa chỉ cụ thể.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlumniMapResponse {

    /** ID của người dùng (cựu sinh viên) */
    private Long userId;

    /** Họ và tên của cựu sinh viên */
    private String fullName;

    /** URL ảnh đại diện */
    private String avatarUrl;

    /** Chức danh công việc hiện tại (VD: Software Engineer) */
    private String currentPosition;

    /** Công ty đang làm việc hiện tại */
    private String currentCompany;

    /** Thành phố/Khu vực đang sinh sống hoặc làm việc */
    private String city;

    /** Niên khóa (khóa học của FPTU, ví dụ: 18) */
    private Integer cohort;

    /** Vĩ độ địa lý */
    private BigDecimal latitude;

    /** Kinh độ địa lý */
    private BigDecimal longitude;
}
