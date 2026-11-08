package com.alumnect.alumnect_backend.service.salary;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * JSON mà Gemini được yêu cầu trả về cho A1: chỉ ước lượng DẢI LƯƠNG thị trường (VNĐ/tháng, gộp) và 1 câu nhận xét.
 * Phần tính % bất thường / quyết định chặn do backend tự tính, không giao cho model.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SalaryAiModelOutput {
    private Long marketMinVnd;
    private Long marketMedianVnd;
    private Long marketMaxVnd;
    private String noteVi;
}
