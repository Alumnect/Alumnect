package com.alumnect.alumnect_backend.controller.user;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dto.response.user.MajorResponse;
import com.alumnect.alumnect_backend.mapper.user.MajorMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller xử lý các yêu cầu liên quan đến thông tin chuyên ngành.
 * Được map tự động với prefix global /api/v1/majors.
 */
@RestController
@RequestMapping("/majors")
public class MajorController {

    @Autowired
    private MajorRepository majorRepository;

    @Autowired
    private MajorMapper majorMapper;

    /**
     * API lấy danh sách toàn bộ chuyên ngành học có trong hệ thống.
     * Sử dụng để hiển thị danh mục chọn chuyên ngành khi đăng ký hoặc chỉnh sửa hồ sơ.
     *
     * @return Danh sách các chuyên ngành học {@link MajorResponse} bọc trong {@link ApiResponse}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MajorResponse>>> getAllMajors() {
        List<MajorResponse> majors = majorRepository.findAll().stream()
                .map(majorMapper::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chuyên ngành thành công", majors));
    }
}
