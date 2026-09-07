package com.alumnect.alumnect_backend.service.report;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.report.CreateAnswerReportRequest;
import com.alumnect.alumnect_backend.dto.response.admin.AdminAnswerReportResponse;
import com.alumnect.alumnect_backend.entity.user.User;

/**
 * Service giao diện xử lý nghiệp vụ báo cáo câu trả lời vi phạm cho người dùng và Admin (UC79).
 */
public interface AnswerReportService {

    /**
     * Báo cáo một câu trả lời vi phạm từ phía người dùng.
     * Đồng thời phát STOMP WebSocket broadcast tới Admin dashboard real-time.
     *
     * @param answerId ID câu trả lời bị báo cáo
     * @param request Payload thông tin báo cáo (lý do, mô tả)
     * @param reporter Nguồn người dùng gửi báo cáo
     * @return AdminAnswerReportResponse đại diện cho bản ghi báo cáo mới tạo
     */
    AdminAnswerReportResponse reportAnswer(Long answerId, CreateAnswerReportRequest request, User reporter);

    /**
     * Lấy danh sách báo cáo câu trả lời vi phạm phân trang cho Admin (UC79).
     *
     * @param query Từ khóa tìm kiếm (nội dung câu trả lời, tiêu đề câu hỏi, tác giả, người báo cáo)
     * @param reason Lý do vi phạm (tùy chọn)
     * @param status Trạng thái xử lý (PENDING, RESOLVED, DISMISSED)
     * @param questionId ID câu hỏi chứa câu trả lời (tùy chọn)
     * @param page Số trang
     * @param size Số phần tử mỗi trang
     * @return Trang danh sách báo cáo bọc trong PageResponse
     */
    PageResponse<AdminAnswerReportResponse> getViolatingAnswers(String query, String reason, String status, Long questionId, int page, int size);

    /**
     * Cập nhật trạng thái báo cáo câu trả lời vi phạm và tùy chọn ẩn/hiện câu trả lời gốc (UC79).
     *
     * @param id ID của báo cáo
     * @param status Trạng thái mới (RESOLVED hoặc DISMISSED)
     * @param hideAnswer Có thực hiện ẩn câu trả lời hay không (true: HIDDEN, false: ACTIVE, null: giữ nguyên)
     */
    void updateReportStatus(Long id, String status, Boolean hideAnswer);
}
