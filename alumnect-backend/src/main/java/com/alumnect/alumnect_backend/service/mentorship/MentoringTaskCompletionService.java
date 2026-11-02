package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.request.mentorship.RespondTaskCompletionRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.SubmitTaskCompletionRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskCompletionResponse;

import java.util.List;

/**
 * Service quản lý nộp và nghiệm thu hoàn thành Mentoring Task (UC110).
 * Cho phép Mentor nộp mô tả kết quả cuối cùng cùng deliverables,
 * và Student xác nhận hoàn thành Task hoặc yêu cầu chỉnh sửa/bổ sung.
 */
public interface MentoringTaskCompletionService {

    /**
     * Mentor nộp kết quả hoàn thành nhiệm vụ (Submit Completion - UC110).
     *
     * @param currentUserId ID người dùng thực hiện (phải là Mentor)
     * @param taskId ID nhiệm vụ Mentoring Task
     * @param request Dữ liệu nộp kết quả
     * @return Thông tin lần nộp kết quả vừa tạo
     */
    MentoringTaskCompletionResponse submitCompletion(
            Long currentUserId, Long taskId, SubmitTaskCompletionRequest request);

    /**
     * Student phản hồi nghiệm thu kết quả Task (Confirm hoặc Reject - UC110).
     *
     * @param currentUserId ID người dùng thực hiện (phải là Student)
     * @param taskId ID nhiệm vụ Mentoring Task
     * @param completionId ID bản ghi nộp nghiệm thu
     * @param request Phản hồi chấp nhận hoặc từ chối kèm ghi chú
     * @return Thông tin lần nộp kết quả sau khi phản hồi
     */
    MentoringTaskCompletionResponse respondCompletion(
            Long currentUserId, Long taskId, Long completionId, RespondTaskCompletionRequest request);

    /**
     * Lấy lần nộp kết quả nghiệm thu mới nhất của Task (UC110).
     *
     * @param currentUserId ID người dùng xem
     * @param taskId ID nhiệm vụ Mentoring Task
     * @return Lần nộp kết quả mới nhất hoặc null nếu chưa có
     */
    MentoringTaskCompletionResponse getLatestCompletion(Long currentUserId, Long taskId);

    /**
     * Lấy danh sách lịch sử các lần nộp kết quả của Task (UC110).
     *
     * @param currentUserId ID người dùng xem
     * @param taskId ID nhiệm vụ Mentoring Task
     * @return Danh sách các lần nộp theo thứ tự mới nhất trước
     */
    List<MentoringTaskCompletionResponse> getCompletionHistory(Long currentUserId, Long taskId);
}
