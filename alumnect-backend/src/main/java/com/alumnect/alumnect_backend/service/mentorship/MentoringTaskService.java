package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskResponse;
import org.springframework.data.domain.Pageable;

/**
 * Giao diện dịch vụ quản lý Mentoring Task sau khi đã kích hoạt (UC105, UC106 & Flow 3, 4).
 */
public interface MentoringTaskService {

    /**
     * Lấy thông tin chi tiết đầy đủ của Mentoring Task theo taskId tổng hợp 10 sections nghiệp vụ (UC106).
     *
     * @param currentUserId ID người dùng yêu cầu (Student hoặc Mentor)
     * @param taskId ID nhiệm vụ
     * @return DTO chi tiết Task đầy đủ
     */
    MentoringTaskDetailResponse getTaskDetail(Long currentUserId, Long taskId);

    /**
     * Lấy thông tin tóm tắt cơ bản của Mentoring Task (UC105).
     *
     * @param currentUserId ID người dùng yêu cầu
     * @param taskId ID nhiệm vụ
     * @return DTO tóm tắt Task
     */
    MentoringTaskResponse getTaskSummary(Long currentUserId, Long taskId);

    /**
     * Lấy thông tin Task gắn liền với Deal ID.
     *
     * @param currentUserId ID người dùng yêu cầu
     * @param dealId ID thỏa thuận
     * @return DTO chi tiết Task đầy đủ
     */
    MentoringTaskDetailResponse getTaskByDealId(Long currentUserId, Long dealId);

    /**
     * Lấy danh sách Tasks của người dùng (Student hoặc Mentor) có phân trang và lọc theo trạng thái/stage (UC106).
     *
     * @param currentUserId ID người dùng
     * @param stage Giai đoạn cấp cao UI (ALL, PREPARATION, IN_PROGRESS, ENDING)
     * @param status Trạng thái Task cụ thể (tùy chọn)
     * @param pageable Cấu hình phân trang
     * @return Trang kết quả chứa danh sách Task phong phú
     */
    PageResponse<MentoringTaskResponse> getMyTasks(Long currentUserId, String stage, MentoringTaskStatus status, Pageable pageable);
}
