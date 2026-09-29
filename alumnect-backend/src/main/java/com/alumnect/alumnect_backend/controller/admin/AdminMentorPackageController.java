package com.alumnect.alumnect_backend.controller.admin;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.admin.AdminUpdateMentorPackageRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorPackageResponse;
import com.alumnect.alumnect_backend.service.admin.AdminMentorPackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller xử lý các yêu cầu quản lý gói Mentor dành cho Quản trị viên (Admin) (UC95).
 */
@RestController
@RequestMapping("/admin/mentor-packages")
@RequiredArgsConstructor
public class AdminMentorPackageController {

    private final AdminMentorPackageService adminMentorPackageService;

    /**
     * Lấy toàn bộ danh sách gói Mentor 1/3/6 tháng dành cho Admin (UC95).
     *
     * @return Danh sách gói Mentor bọc trong ApiResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<MentorPackageResponse>>> getAllPackages() {
        List<MentorPackageResponse> packages = adminMentorPackageService.getAllPackages();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách gói Mentor thành công", packages));
    }

    /**
     * Cập nhật giá và trạng thái hoạt động của gói Mentor (UC95).
     *
     * @param id ID gói Mentor cần cập nhật
     * @param request DTO chứa giá và trạng thái mới
     * @return Thông tin gói Mentor sau cập nhật bọc trong ApiResponse
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MentorPackageResponse>> updatePackage(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateMentorPackageRequest request) {

        MentorPackageResponse response = adminMentorPackageService.updatePackage(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật gói Mentor thành công", response));
    }
}
