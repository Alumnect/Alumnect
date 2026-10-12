package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.CreateMentoringRequestResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorResponseItemResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringRequestDetailResponse;

import java.util.List;

/**
 * Interface định nghĩa các nghiệp vụ xử lý yêu cầu Mentoring:
 * - UC100: Tạo yêu cầu chung & phân phối tự động
 * - UC101: Gửi yêu cầu cố vấn trực tiếp
 * - UC102: Sinh viên xem phản hồi từ Mentor
 * - UC103: Mentor xem và phản hồi (Accept/Decline) yêu cầu được gửi/phân phối
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

    /**
     * Lấy danh sách các yêu cầu Mentoring được phân phối hoặc gửi trực tiếp tới Mentor đang đăng nhập (phân trang, UC103).
     * Hỗ trợ lọc theo trạng thái phản hồi (WAITING, ACCEPTED, DECLINED) và loại yêu cầu (GENERAL, DIRECT).
     *
     * @param mentorEmail Email của Mentor đang đăng nhập
     * @param status Trạng thái phản hồi cần lọc (WAITING, ACCEPTED, DECLINED, hoặc null để lấy tất cả)
     * @param requestType Loại yêu cầu cần lọc (GENERAL, DIRECT, hoặc null để lấy tất cả)
     * @param page Số thứ tự trang (0-indexed)
     * @param size Số bản ghi mỗi trang
     * @return Danh sách phân trang các yêu cầu gửi tới Mentor
     */
    PageResponse<MentorIncomingRequestResponse> getIncomingRequests(String mentorEmail, String status, String requestType, int page, int size);

    /**
     * Lấy thông tin chi tiết một yêu cầu Mentoring được phân phối hoặc gửi trực tiếp tới Mentor đang đăng nhập (UC103).
     * Kiểm tra quyền sở hữu phân phối chặt chẽ: Mentor chỉ xem được yêu cầu thực sự được phân phối/gửi đến mình.
     *
     * @param mentorEmail Email của Mentor đang đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @return DTO chi tiết yêu cầu dành cho Mentor kèm trạng thái phản hồi và cờ quyền hành động
     */
    MentorIncomingRequestDetailResponse getIncomingRequestDetail(String mentorEmail, Long requestId);

    /**
     * Mentor chấp nhận (ACCEPT) yêu cầu Mentoring được phân phối hoặc gửi trực tiếp tới mình (UC103).
     * - Xác thực Mentor ACTIVE và Subscription còn hiệu lực.
     * - Kiểm tra Request OPEN và bản ghi phân phối đang PENDING (WAITING).
     * - Cập nhật trạng thái phân phối thành ACCEPTED và lưu thời điểm phản hồi (respondedAt).
     * - Không tự động tạo Deal, không trừ phí, không đóng yêu cầu.
     *
     * @param mentorEmail Email của Mentor đang đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @param requestDto DTO chứa lời nhắn phản hồi tùy chọn
     * @return DTO chi tiết yêu cầu sau khi chấp nhận
     */
    MentorIncomingRequestDetailResponse acceptIncomingRequest(String mentorEmail, Long requestId, RespondMentoringRequestRequest requestDto);

    /**
     * Mentor từ chối (DECLINE) yêu cầu Mentoring được phân phối hoặc gửi trực tiếp tới mình (UC103).
     * - Xác thực Mentor ACTIVE và Subscription còn hiệu lực.
     * - Kiểm tra Request OPEN và bản ghi phân phối đang PENDING (WAITING).
     * - Cập nhật trạng thái phân phối thành REJECTED (hiển thị DECLINED) và lưu thời điểm phản hồi.
     * - Không cho phép mở Deal với Mentor đã từ chối.
     *
     * @param mentorEmail Email của Mentor đang đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @param requestDto DTO chứa lời nhắn / lý do từ chối tùy chọn
     * @return DTO chi tiết yêu cầu sau khi từ chối
     */
    MentorIncomingRequestDetailResponse declineIncomingRequest(String mentorEmail, Long requestId, RespondMentoringRequestRequest requestDto);
}
