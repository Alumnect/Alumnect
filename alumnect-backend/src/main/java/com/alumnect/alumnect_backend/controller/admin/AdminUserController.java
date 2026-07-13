package com.alumnect.alumnect_backend.controller.admin;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.admin.AdminUpdateUserStatusDto;
import com.alumnect.alumnect_backend.dto.response.admin.AdminUserDto;
import com.alumnect.alumnect_backend.service.admin.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý tài khoản người dùng dành cho Quản trị viên (Admin).
 */
@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    /**
     * Tìm kiếm và lấy danh sách tài khoản người dùng phân trang.
     * Hỗ trợ tìm kiếm theo từ khóa (tên/email/mã số sinh viên), vai trò, trạng thái, chuyên ngành, khóa học.
     * Quyền truy cập: Chỉ vai trò ADMIN.
     *
     * @param query Từ khóa tìm kiếm (tùy chọn)
     * @param role Vai trò người dùng lọc (tùy chọn)
     * @param status Trạng thái tài khoản lọc (tùy chọn)
     * @param majorId ID chuyên ngành lọc (tùy chọn)
     * @param cohort Khóa học lọc (tùy chọn)
     * @param page Số trang hiển thị, mặc định 0
     * @param size Số lượng phần tử mỗi trang, mặc định 10
     * @return Trang kết quả người dùng bọc trong PageResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminUserDto>>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long majorId,
            @RequestParam(required = false) Integer cohort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<AdminUserDto> users = adminUserService.getUsers(query, role, status, majorId, cohort, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", users));
    }

    /**
     * Xem thông tin hồ sơ tài khoản chi tiết của người dùng.
     * Quyền truy cập: Chỉ vai trò ADMIN.
     *
     * @param id Khóa chính người dùng
     * @return DTO thông tin chi tiết người dùng
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserDto>> getUserById(@PathVariable Long id) {
        AdminUserDto user = adminUserService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết thông tin người dùng thành công", user));
    }

    /**
     * Khóa hoặc mở khóa tài khoản người dùng.
     * Quyền truy cập: Chỉ vai trò ADMIN.
     *
     * @param id Khóa chính người dùng
     * @param request DTO chứa trạng thái mới (ACTIVE/LOCKED)
     * @return Phản hồi trống báo trạng thái thành công
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserStatusDto request) {
        adminUserService.updateUserStatus(id, request);
        String msg = "ACTIVE".equalsIgnoreCase(request.getStatus()) ? "Mở khóa tài khoản thành công" : "Khóa tài khoản thành công";
        return ResponseEntity.ok(ApiResponse.success(msg, null));
    }
}
