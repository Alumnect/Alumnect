package com.alumnect.alumnect_backend.service.salary;

import com.alumnect.alumnect_backend.dto.request.salary.CreateSalaryContributionRequest;
import com.alumnect.alumnect_backend.dto.request.salary.UpdateSalaryContributionRequest;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryContributionResponse;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryStatisticsResponse;

import java.util.List;

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

    /**
     * Lấy toàn bộ lượt đóng góp lương của chính người dùng đang đăng nhập (UC51 - Edit salary
     * contribution) — để họ xem lại và chọn bản ghi cần sửa. Không dành cho việc xem của người khác.
     *
     * @param email Email người dùng đang đăng nhập (lấy từ SecurityContext)
     * @return Danh sách lượt đóng góp của chính người dùng, mới nhất trước
     * @throws com.alumnect.alumnect_backend.exception.ResourceNotFoundException nếu không tìm thấy tài khoản người dùng
     */
    List<SalaryContributionResponse> getMyContributions(String email);

    /**
     * Chỉnh sửa một lượt đóng góp lương đã có (UC51 - Edit salary contribution). Chỉ chính chủ (người
     * đã tạo lượt đóng góp đó) mới được sửa; người khác bị từ chối 403.
     *
     * @param email          Email người dùng đang đăng nhập (lấy từ SecurityContext)
     * @param contributionId ID lượt đóng góp cần sửa
     * @param request        DTO chứa dữ liệu lương mới (cùng bộ trường với lúc tạo)
     * @return Chi tiết lượt đóng góp sau khi sửa đã chuẩn hóa
     * @throws com.alumnect.alumnect_backend.exception.ResourceNotFoundException nếu không tìm thấy tài khoản hoặc lượt đóng góp
     * @throws com.alumnect.alumnect_backend.exception.ForbiddenException nếu không phải chính chủ
     * @throws com.alumnect.alumnect_backend.exception.BadRequestException nếu industryId không tồn tại hoặc currency sai định dạng
     */
    SalaryContributionResponse updateContribution(String email, Long contributionId, UpdateSalaryContributionRequest request);

    /**
     * Xóa (cứng) một lượt đóng góp lương đã có (UC52 - Delete salary contribution). Chỉ chính chủ
     * (người đã tạo lượt đóng góp đó) mới được xóa; người khác bị từ chối 403. Xóa cứng — không có
     * cột trạng thái để xóa mềm, và không có bản ghi nào khác tham chiếu tới lượt đóng góp này
     * (khác Answer/Comment không có khái niệm "vote" hay "reply" gắn vào 1 lượt đóng góp lương).
     *
     * @param email          Email người dùng đang đăng nhập (lấy từ SecurityContext)
     * @param contributionId ID lượt đóng góp cần xóa
     * @throws com.alumnect.alumnect_backend.exception.ResourceNotFoundException nếu không tìm thấy tài khoản hoặc lượt đóng góp
     * @throws com.alumnect.alumnect_backend.exception.ForbiddenException nếu không phải chính chủ
     */
    void deleteContribution(String email, Long contributionId);

    /**
     * Lấy thống kê lương tổng hợp cho Salary Board (UC53 - View salary statistics): số liệu tổng quan
     * (tổng lượt đóng góp, số vị trí đang theo dõi, trung vị chung) và danh sách dòng thống kê theo
     * nhóm chức danh + cấp bậc + khu vực (chỉ nhóm đạt đủ số mẫu tối thiểu mới hiển thị).
     *
     * @return Thống kê lương tổng hợp
     */
    SalaryStatisticsResponse getStatistics();
}
