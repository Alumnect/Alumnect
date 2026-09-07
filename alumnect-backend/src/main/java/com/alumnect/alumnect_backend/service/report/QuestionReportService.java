package com.alumnect.alumnect_backend.service.report;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.report.CreateQuestionReportRequest;
import com.alumnect.alumnect_backend.dto.response.admin.AdminQuestionReportResponse;
import com.alumnect.alumnect_backend.entity.user.User;

/**
 * Service giao diện xử lý nghiệp vụ báo cáo câu hỏi vi phạm cho người dùng và Admin (UC78).
 */
public interface QuestionReportService {

    /**
     * Báo cáo một câu hỏi vi phạm từ phía người dùng.
     * Đồng thời phát STOMP WebSocket broadcast tới Admin dashboard real-time.
     *
     * @param questionId ID câu hỏi bị báo cáo
     * @param request Payload thông tin báo cáo (lý do, mô tả)
     * @param reporter Nguồn người dùng gửi báo cáo
     * @return AdminQuestionReportResponse đại diện cho bản ghi báo cáo mới tạo
     */
    AdminQuestionReportResponse reportQuestion(Long questionId, CreateQuestionReportRequest request, User reporter);

    /**
     * Lấy danh sách báo cáo câu hỏi vi phạm phân trang cho Admin (UC78).
     *
     * @param query Từ khóa tìm kiếm (tiêu đề/nội dung câu hỏi, tác giả, người báo cáo)
     * @param reason Lý do vi phạm (tùy chọn)
     * @param status Trạng thái xử lý (PENDING, RESOLVED, DISMISSED)
     * @param topicId ID chủ đề (tùy chọn)
     * @param page Số trang
     * @param size Số phần tử mỗi trang
     * @return Trang danh sách báo cáo bọc trong PageResponse
     */
    PageResponse<AdminQuestionReportResponse> getViolatingQuestions(String query, String reason, String status, Long topicId, int page, int size);

    /**
     * Cập nhật trạng thái báo cáo câu hỏi vi phạm và tùy chọn ẩn/hiện câu hỏi gốc (UC78).
     *
     * @param id ID của báo cáo
     * @param status Trạng thái mới (RESOLVED hoặc DISMISSED)
     * @param hideQuestion Có thực hiện ẩn câu hỏi hay không (true: HIDDEN, false: ACTIVE, null: giữ nguyên)
     */
    void updateReportStatus(Long id, String status, Boolean hideQuestion);
}
