package com.alumnect.alumnect_backend.dto.response.salary;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin một ngành nghề trả về cho Client (UC50 - Contribute salary data)
 * — dùng để đổ vào dropdown chọn ngành khi đóng góp dữ liệu lương.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IndustryResponse {

    /** ID ngành nghề */
    private Long id;

    /** Tên ngành nghề (VD: "Công nghệ thông tin") */
    private String name;
}
