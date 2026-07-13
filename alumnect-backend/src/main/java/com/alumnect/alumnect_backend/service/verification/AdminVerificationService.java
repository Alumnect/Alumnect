package com.alumnect.alumnect_backend.service.verification;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.verification.AdminReviewVerificationDto;
import com.alumnect.alumnect_backend.dto.response.verification.AdminVerificationRequestDto;
import com.alumnect.alumnect_backend.entity.user.User;

/**
 * Service định nghĩa các nghiệp vụ phê duyệt yêu cầu xác minh cựu sinh viên của Admin.
 */
public interface AdminVerificationService {

    /**
     * Lấy danh sách các phiếu yêu cầu xác minh cựu sinh viên phân trang.
     * Cho phép lọc theo trạng thái duyệt (PENDING, APPROVED, REJECTED).
     *
     * @param status Trạng thái lọc
     * @param page Số thứ tự trang (0-indexed)
     * @param size Kích thước trang
     * @return Trang kết quả phiếu xác minh bọc trong PageResponse
     */
    PageResponse<AdminVerificationRequestDto> getVerificationRequests(String status, int page, int size);

    /**
     * Admin xem xét phê duyệt hoặc từ chối phiếu yêu cầu xác minh cựu sinh viên.
     * Nếu APPROVED -> Kích hoạt tài khoản người dùng thành ACTIVE và đặt isAccountVerified = true.
     * Nếu REJECTED -> Đặt trạng thái yêu cầu thành REJECTED và lưu lý do từ chối.
     *
     * @param id Khóa chính của phiếu xác minh
     * @param request DTO chứa quyết định duyệt (APPROVED/REJECTED) và ghi chú
     * @param adminUser Thực thể Admin thực hiện duyệt
     */
    void reviewVerificationRequest(Long id, AdminReviewVerificationDto request, User adminUser);
}
