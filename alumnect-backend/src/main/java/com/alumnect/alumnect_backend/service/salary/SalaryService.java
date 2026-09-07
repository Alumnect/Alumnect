package com.alumnect.alumnect_backend.service.salary;

import com.alumnect.alumnect_backend.dto.request.salary.CreateSalaryContributionRequest;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryContributionResponse;

/**
 * Interface định nghĩa các dịch vụ liên quan tới Salary Board (UC50 - Contribute salary data).
 * <p>
 * Danh mục ngành nghề ({@code GET /industries}) KHÔNG khai báo ở đây — mirror pattern
 * {@code MajorController} (gọi thẳng Repository + Mapper, không qua Service) vì chỉ là passthrough
 * đơn giản, tránh thêm tầng Service không cần thiết cho một danh sách tĩnh.
 */
public interface SalaryService {

    /**
     * Đóng góp một mẫu lương ẩn danh lên Salary Board. Chỉ Cựu sinh viên (ALUMNI) đã đăng nhập mới
     * được đóng góp; vai trò khác (VD Student, Admin) bị từ chối 403.
     *
     * @param email   Email người dùng đang đăng nhập (lấy từ SecurityContext)
     * @param request DTO chứa dữ liệu lương (chức danh, mức lương bắt buộc; ngành/công ty/khu vực/kinh nghiệm tùy chọn)
     * @return Chi tiết lượt đóng góp vừa tạo đã chuẩn hóa (không chứa thông tin định danh)
     * @throws com.alumnect.alumnect_backend.exception.ForbiddenException nếu vai trò không phải Alumni
     * @throws com.alumnect.alumnect_backend.exception.ResourceNotFoundException nếu không tìm thấy tài khoản người dùng
     * @throws com.alumnect.alumnect_backend.exception.BadRequestException nếu industryId không tồn tại hoặc currency sai định dạng
     */
    SalaryContributionResponse createContribution(String email, CreateSalaryContributionRequest request);
}
