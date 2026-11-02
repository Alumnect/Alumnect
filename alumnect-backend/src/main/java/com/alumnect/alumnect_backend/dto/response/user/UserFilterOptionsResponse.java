package com.alumnect.alumnect_backend.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO phản hồi danh sách các tùy chọn bộ lọc động (Khóa học, Tỉnh/Thành phố).
 * Được truy vấn từ dữ liệu thực tế của các tài khoản ACTIVE trong hệ thống.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFilterOptionsResponse {

    /** Danh sách các khóa học (Cohort) thực tế trong hệ thống, sắp xếp giảm dần */
    private List<Integer> cohorts;

    /** Danh sách các tỉnh / thành phố (City) thực tế trong hệ thống, sắp xếp bảng chữ cái */
    private List<String> cities;
}
