package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.admin.AdminUpdateUserStatusDto;
import com.alumnect.alumnect_backend.dto.response.admin.AdminUserDto;

/**
 * Service định nghĩa các nghiệp vụ quản lý tài khoản người dùng của Admin.
 */
public interface AdminUserService {

    /**
     * Tìm kiếm và lấy danh sách tài khoản người dùng phân trang.
     * Cho phép lọc theo từ khóa (tên/email/mã số sinh viên), vai trò, trạng thái, chuyên ngành, khóa học.
     *
     * @param query Từ khóa tìm kiếm
     * @param role Tên vai trò lọc (STUDENT, ALUMNI, ADMIN)
     * @param status Trạng thái tài khoản lọc (ACTIVE, LOCKED, WAITING_APPROVAL, PENDING)
     * @param majorId ID chuyên ngành lọc
     * @param cohort Khóa học lọc
     * @param page Số thứ tự trang (0-indexed)
     * @param size Kích thước trang
     * @return Trang kết quả người dùng bọc trong PageResponse
     */
    PageResponse<AdminUserDto> getUsers(String query, String role, String status, Long majorId, Integer cohort, int page, int size);

    /**
     * Lấy thông tin chi tiết hồ sơ tài khoản người dùng.
     *
     * @param id Khóa chính người dùng
     * @return DTO thông tin chi tiết
     */
    AdminUserDto getUserById(Long id);

    /**
     * Cập nhật trạng thái khóa/mở khóa tài khoản người dùng.
     *
     * @param id Khóa chính người dùng cần cập nhật
     * @param request DTO chứa trạng thái mới
     */
    void updateUserStatus(Long id, AdminUpdateUserStatusDto request);
}
