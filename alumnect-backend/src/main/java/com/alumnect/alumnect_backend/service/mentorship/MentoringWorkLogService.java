package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWorkLogResponse;

import java.util.List;

/**
 * Giao diện dịch vụ quản lý nhật ký công việc Mentoring Work Log (UC107).
 */
public interface MentoringWorkLogService {

    /**
     * Lấy danh sách tất cả các Work Logs của một Mentoring Task theo thứ tự mới nhất.
     *
     * @param currentUserId ID người dùng yêu cầu
     * @param taskId ID nhiệm vụ Mentoring
     * @return Danh sách DTO Work Log
     */
    List<MentoringWorkLogResponse> getWorkLogsByTaskId(Long currentUserId, Long taskId);

    /**
     * Xem chi tiết một bản ghi Work Log cụ thể trong Task.
     *
     * @param currentUserId ID người dùng yêu cầu
     * @param taskId ID nhiệm vụ Mentoring
     * @param workLogId ID bản ghi Work Log
     * @return DTO Work Log chi tiết
     */
    MentoringWorkLogResponse getWorkLogDetail(Long currentUserId, Long taskId, Long workLogId);

    /**
     * Mentor ghi nhận Work Log mới vào Mentoring Task (UC107).
     *
     * @param currentUserId ID của Mentor đang đăng nhập
     * @param taskId ID nhiệm vụ Mentoring
     * @param request DTO chứa nội dung nhật ký và tài liệu đính kèm
     * @return DTO Work Log vừa tạo
     */
    MentoringWorkLogResponse createWorkLog(Long currentUserId, Long taskId, CreateMentoringWorkLogRequest request);

    /**
     * Mentor chỉnh sửa Work Log chưa được học viên xác nhận (UC107).
     *
     * @param currentUserId ID của Mentor đang đăng nhập
     * @param taskId ID nhiệm vụ Mentoring
     * @param workLogId ID bản ghi Work Log cần sửa
     * @param request DTO cập nhật nội dung
     * @return DTO Work Log sau khi cập nhật
     */
    MentoringWorkLogResponse updateWorkLog(Long currentUserId, Long taskId, Long workLogId, UpdateMentoringWorkLogRequest request);

    /**
     * Học viên xác nhận nghiệm thu Work Log (UC108).
     *
     * @param currentUserId ID của Student đang đăng nhập
     * @param taskId ID nhiệm vụ Mentoring
     * @param workLogId ID bản ghi Work Log cần xác nhận
     * @param request DTO nhận xét của học viên (tùy chọn)
     * @return DTO Work Log sau khi xác nhận thành công
     */
    MentoringWorkLogResponse confirmWorkLog(Long currentUserId, Long taskId, Long workLogId, com.alumnect.alumnect_backend.dto.request.mentorship.ConfirmMentoringWorkLogRequest request);

    /**
     * Học viên từ chối / yêu cầu Mentor điều chỉnh Work Log (UC108).
     *
     * @param currentUserId ID của Student đang đăng nhập
     * @param taskId ID nhiệm vụ Mentoring
     * @param workLogId ID bản ghi Work Log cần điều chỉnh
     * @param request DTO phản hồi lý do yêu cầu điều chỉnh
     * @return DTO Work Log sau khi cập nhật trạng thái REJECTED
     */
    MentoringWorkLogResponse rejectWorkLog(Long currentUserId, Long taskId, Long workLogId, com.alumnect.alumnect_backend.dto.request.mentorship.RejectMentoringWorkLogRequest request);
}

