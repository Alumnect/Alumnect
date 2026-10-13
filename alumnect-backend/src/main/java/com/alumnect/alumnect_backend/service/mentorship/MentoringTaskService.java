package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskResponse;
import org.springframework.data.domain.Pageable;

/**
 * Giao diện dịch vụ quản lý Mentoring Task sau khi đã kích hoạt (UC105 & Flow 3, 4).
 */
public interface MentoringTaskService {

    /**
     * Lấy thông tin chi tiết của Mentoring Task theo taskId.
     *
     * @param currentUserId ID người dùng yêu cầu
     * @param taskId ID nhiệm vụ
     * @return DTO chi tiết Task
     */
    MentoringTaskResponse getTaskDetail(Long currentUserId, Long taskId);

    /**
     * Lấy thông tin Task gắn liền với Deal ID.
     *
     * @param currentUserId ID người dùng yêu cầu
     * @param dealId ID thỏa thuận
     * @return DTO chi tiết Task
     */
    MentoringTaskResponse getTaskByDealId(Long currentUserId, Long dealId);

    /**
     * Lấy danh sách Tasks của người dùng (Student hoặc Mentor) có phân trang và lọc theo trạng thái.
     *
     * @param currentUserId ID người dùng
     * @param status Trạng thái Task (tùy chọn)
     * @param pageable Cấu hình phân trang
     * @return Trang kết quả chứa danh sách Task
     */
    PageResponse<MentoringTaskResponse> getMyTasks(Long currentUserId, MentoringTaskStatus status, Pageable pageable);
}
