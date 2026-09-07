package com.alumnect.alumnect_backend.controller.salary;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dto.response.salary.IndustryResponse;
import com.alumnect.alumnect_backend.mapper.salary.SalaryMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller xử lý yêu cầu lấy danh mục ngành nghề cho Salary Board (UC50 - Contribute salary data).
 * Được map tự động với prefix global /api/v1/industries. Mirror pattern {@code MajorController}
 * (gọi thẳng Repository + Mapper, không qua Service, vì chỉ là danh sách tĩnh phục vụ dropdown).
 * <p>
 * Công khai (xem {@link com.alumnect.alumnect_backend.security.Endpoints#PUBLIC_GET}) — ai cũng xem
 * được danh mục ngành nghề dù chỉ Alumni mới đóng góp được lương (UC50).
 */
@RestController
@RequestMapping("/industries")
public class IndustryController {

    @Autowired
    private IndustryRepository industryRepository;

    @Autowired
    private SalaryMapper salaryMapper;

    /**
     * API lấy danh sách toàn bộ ngành nghề có trong hệ thống, dùng để đổ vào dropdown chọn ngành
     * khi đóng góp dữ liệu lương (UC50).
     *
     * @return Danh sách ngành nghề {@link IndustryResponse} bọc trong {@link ApiResponse}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<IndustryResponse>>> getAllIndustries() {
        List<IndustryResponse> industries = industryRepository.findAll().stream()
                .map(salaryMapper::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách ngành nghề thành công", industries));
    }
}
