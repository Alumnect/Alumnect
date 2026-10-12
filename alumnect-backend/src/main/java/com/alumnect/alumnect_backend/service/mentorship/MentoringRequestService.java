package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.CreateMentoringRequestResponse;

/**
 * Interface định nghĩa các nghiệp vụ xử lý yêu cầu Mentoring chung (UC100).
 */
public interface MentoringRequestService {

    /**
     * Tạo mới một yêu cầu Mentoring chung, thực hiện xác thực sinh viên, kiểm tra điều khoản,
     * lưu trữ dữ liệu và kích hoạt matching phân phối tự động tới các Mentor phù hợp (UC100).
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param request DTO chứa thông tin tạo yêu cầu
     * @return DTO kết quả tạo yêu cầu kèm thông tin phân phối
     */
    CreateMentoringRequestResponse createMentoringRequest(String userEmail, CreateMentoringRequestRequest request);

    /**
     * Lấy danh sách các yêu cầu Mentoring của sinh viên đang đăng nhập (phân trang).
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param page Số thứ tự trang (0-indexed)
     * @param size Số bản ghi mỗi trang
     * @return Danh sách phân trang các yêu cầu mentoring
     */
    PageResponse<CreateMentoringRequestResponse> getMyRequests(String userEmail, int page, int size);

    /**
     * Lấy thông tin chi tiết một yêu cầu Mentoring theo ID của sinh viên sở hữu.
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @return DTO chi tiết yêu cầu
     */
    CreateMentoringRequestResponse getRequestDetail(String userEmail, Long requestId);
}
