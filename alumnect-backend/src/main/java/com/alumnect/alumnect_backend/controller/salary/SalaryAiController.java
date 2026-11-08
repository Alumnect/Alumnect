package com.alumnect.alumnect_backend.controller.salary;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.salary.SalaryAiCheckRequest;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryAiCheckResponse;
import com.alumnect.alumnect_backend.service.salary.SalaryAiService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint AI cho Salary Board [A1], prefix {@code /api/v1/salaries}: kiểm tra/chặn lương bất thường trước khi đóng góp.
 * Cần đăng nhập (JWT); kiểm tra lương chỉ ALUMNI (403 nếu khác).
 */
@RestController
@RequestMapping("/salaries")
public class SalaryAiController {

    @Autowired
    private SalaryAiService salaryAiService;

    @PostMapping("/ai-check")
    public ResponseEntity<ApiResponse<SalaryAiCheckResponse>> aiCheck(
            @Valid @RequestBody SalaryAiCheckRequest request,
            Authentication authentication) {
        SalaryAiCheckResponse result = salaryAiService.checkSalary(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Kiểm tra mức lương thành công", result));
    }
}
