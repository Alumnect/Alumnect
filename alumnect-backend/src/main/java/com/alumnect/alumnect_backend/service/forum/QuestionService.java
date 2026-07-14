package com.alumnect.alumnect_backend.service.forum;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionDetailResponse;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionResponse;
import com.alumnect.alumnect_backend.dto.response.forum.TopicResponse;
import java.util.List;

/**
 * Interface định nghĩa các dịch vụ liên quan tới câu hỏi diễn đàn Q&A
 * (UC38 - View question list, UC39 - View question detail).
 */
public interface QuestionService {

    /**
     * Lấy một trang câu hỏi cho danh sách diễn đàn. Ai cũng xem được (Guest/Student/Alumni)
     * vì câu hỏi ACTIVE là nội dung công khai; kết quả loại bỏ câu hỏi đã bị ẩn/xóa.
     *
     * @param page    Số thứ tự trang cần lấy (0-based)
     * @param size    Kích thước trang (số câu hỏi mỗi trang)
     * @param sort    Tiêu chí sắp xếp: "recent" (mới nhất), "votes" (nhiều vote), "answers" (nhiều trả lời)
     * @param topicId ID chủ đề cần lọc, hoặc null nếu không lọc theo chủ đề
     * @return Trang kết quả câu hỏi đã chuẩn hóa, sẵn sàng trả về Client
     */
    PageResponse<QuestionResponse> getQuestions(int page, int size, String sort, Long topicId);

    /**
     * Lấy chi tiết một câu hỏi theo ID (UC39 - View question detail). Ai cũng xem được
     * (Guest/Student/Alumni) vì câu hỏi ACTIVE là nội dung công khai. Chỉ trả về câu hỏi đang
     * hiển thị; câu hỏi bị ẩn/xóa (HIDDEN/DELETED) hoặc không tồn tại đều coi như không tìm thấy.
     *
     * @param id ID câu hỏi cần xem chi tiết
     * @return Thông tin chi tiết câu hỏi đã chuẩn hóa, sẵn sàng trả về Client
     * @throws com.alumnect.alumnect_backend.exception.ResourceNotFoundException nếu không tìm thấy câu hỏi ACTIVE tương ứng
     */
    QuestionDetailResponse getQuestionDetail(Long id);

    /**
     * Lấy toàn bộ danh mục chủ đề diễn đàn để đổ vào bộ lọc phía Frontend.
     *
     * @return Danh sách chủ đề (id + tên), sắp xếp theo tên
     */
    List<TopicResponse> getTopics();
}
