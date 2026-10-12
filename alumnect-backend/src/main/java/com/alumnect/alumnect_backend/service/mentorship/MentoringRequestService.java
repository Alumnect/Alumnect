package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.CreateMentoringRequestResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorResponseItemResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringRequestDetailResponse;

import java.util.List;

/**
 * Interface định nghĩa các nghiệp vụ xử lý yêu cầu Mentoring (UC100 - General, UC101 - Direct, UC102 - View Responses).
 */
public interface MentoringRequestService {

    /**
     * Tạo mới một yêu cầu Mentoring chung hoặc trực tiếp, thực hiện xác thực sinh viên, kiểm tra điều khoản,
     * lưu trữ dữ liệu và phân phối tới Mentor (UC100 & UC101).
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param request DTO chứa thông tin tạo yêu cầu
     * @return DTO kết quả tạo yêu cầu kèm thông tin phân phối
     */
    CreateMentoringRequestResponse createMentoringRequest(String userEmail, CreateMentoringRequestRequest request);

    /**
     * Lấy danh sách các yêu cầu Mentoring của sinh viên đang đăng nhập (phân trang, UC102).
     * Bao gồm tổng hợp số liệu phản hồi từ các Mentor cho từng yêu cầu.
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
     * @return DTO chi tiết yêu cầu cơ bản
     */
    CreateMentoringRequestResponse getRequestDetail(String userEmail, Long requestId);

    /**
     * Lấy thông tin chi tiết một yêu cầu Mentoring kèm toàn bộ phản hồi từ các Mentor liên quan (UC102).
     * - Nếu GENERAL: Trả về toàn bộ Mentor thực sự được phân phối yêu cầu.
     * - Nếu DIRECT: Chỉ trả về duy nhất Mentor đích.
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @return DTO chi tiết yêu cầu kèm danh sách phản hồi của Mentor và thống kê
     */
    MentoringRequestDetailResponse getRequestDetailWithResponses(String userEmail, Long requestId);

    /**
     * Lấy danh sách phản hồi của các Mentor đối với một yêu cầu Mentoring cụ thể (UC102 sub-resource).
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @return Danh sách phản hồi của các Mentor
     */
    List<MentorResponseItemResponse> getRequestResponses(String userEmail, Long requestId);
}
