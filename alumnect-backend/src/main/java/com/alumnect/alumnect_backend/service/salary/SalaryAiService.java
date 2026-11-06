package com.alumnect.alumnect_backend.service.salary;

import com.alumnect.alumnect_backend.dto.request.salary.SalaryAiCheckRequest;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryAiCheckResponse;

/**
 * Dịch vụ AI cho Salary Board [A1]: kiểm tra và chặn lương bất thường khi cựu sinh viên đóng góp.
 */
public interface SalaryAiService {

    /**
     * Kiểm tra mức lương trước khi đóng góp (không lưu dữ liệu). Chỉ ALUMNI.
     *
     * @throws com.alumnect.alumnect_backend.exception.ForbiddenException nếu không phải Cựu sinh viên
     */
    SalaryAiCheckResponse checkSalary(String email, SalaryAiCheckRequest request);
}
