package com.alumnect.alumnect_backend.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin thống kê số lượng tài khoản đăng ký mới theo ngày.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DayRegistrationStatDto {

    /** Ngày thống kê dưới dạng chuỗi yyyy-MM-dd */
    private String date;

    /** Số lượng tài khoản đăng ký mới trong ngày */
    private Long count;
}
