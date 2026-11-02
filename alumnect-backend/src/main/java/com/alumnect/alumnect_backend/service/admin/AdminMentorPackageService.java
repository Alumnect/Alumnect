package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.dto.request.admin.AdminUpdateMentorPackageRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorPackageResponse;

import java.util.List;

/**
 * Interface dịch vụ quản lý các gói dịch vụ Mentor dành cho Quản trị viên (UC95).
 */
public interface AdminMentorPackageService {

    /**
     * Lấy toàn bộ danh sách gói Mentor (bao gồm cả ACTIVE và INACTIVE) sắp xếp theo thời hạn.
     *
     * @return Danh sách DTO các gói Mentor
     */
    List<MentorPackageResponse> getAllPackages();

    /**
     * Cập nhật giá và trạng thái hoạt động của gói Mentor theo ID.
     *
     * @param id ID gói Mentor cần cập nhật
     * @param request DTO chứa thông tin giá và trạng thái mới
     * @return DTO gói Mentor sau khi cập nhật
     */
    MentorPackageResponse updatePackage(Long id, AdminUpdateMentorPackageRequest request);
}
