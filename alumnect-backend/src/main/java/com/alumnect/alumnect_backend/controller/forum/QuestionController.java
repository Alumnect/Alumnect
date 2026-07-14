package com.alumnect.alumnect_backend.controller.forum;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionDetailResponse;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionResponse;
import com.alumnect.alumnect_backend.dto.response.forum.TopicResponse;
import com.alumnect.alumnect_backend.service.forum.QuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller xử lý các yêu cầu liên quan đến câu hỏi diễn đàn Q&A
 * (UC38 - View question list, UC39 - View question detail).
 * Được map tự động với prefix global /api/v1/questions.
 * <p>
 * Các endpoint được khai báo công khai (xem {@link com.alumnect.alumnect_backend.security.Endpoints#PUBLIC_GET})
 * vì câu hỏi ACTIVE là nội dung công khai — Guest chưa đăng nhập vẫn xem được (Actors: Guest/Student/Alumni).
 */
@RestController
@RequestMapping("/questions")
public class QuestionController {

    @Autowired
    private QuestionService questionService;

    /**
     * API lấy một trang câu hỏi trên diễn đàn Q&A.
     *
     * @param page    Số thứ tự trang cần lấy (0-based), mặc định 0
     * @param size    Kích thước trang, mặc định 10
     * @param sort    Tiêu chí sắp xếp: "recent" (mặc định), "votes", "answers"
     * @param topicId ID chủ đề cần lọc, bỏ trống nếu không lọc theo chủ đề
     * @return Trang kết quả câu hỏi {@link QuestionResponse} bọc trong {@link ApiResponse}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<QuestionResponse>>> getQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(required = false) Long topicId) {

        PageResponse<QuestionResponse> questions = questionService.getQuestions(page, size, sort, topicId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách câu hỏi thành công", questions));
    }

    /**
     * API lấy chi tiết một câu hỏi trên diễn đàn Q&A (UC39 - View question detail).
     * Chỉ trả về câu hỏi đang ở trạng thái ACTIVE; câu hỏi bị ẩn/xóa hoặc không tồn tại → HTTP 404.
     * <p>
     * Lưu ý: mapping literal {@code /topics} được Spring ưu tiên khớp trước biến đường dẫn {@code /{id}},
     * nên hai endpoint không xung đột.
     *
     * @param id ID câu hỏi cần xem chi tiết
     * @return Chi tiết câu hỏi {@link QuestionDetailResponse} bọc trong {@link ApiResponse}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionDetailResponse>> getQuestionById(@PathVariable Long id) {
        QuestionDetailResponse question = questionService.getQuestionDetail(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết câu hỏi thành công", question));
    }

    /**
     * API lấy toàn bộ danh mục chủ đề diễn đàn để đổ vào bộ lọc phía Frontend.
     *
     * @return Danh sách chủ đề {@link TopicResponse} bọc trong {@link ApiResponse}
     */
    @GetMapping("/topics")
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getTopics() {
        List<TopicResponse> topics = questionService.getTopics();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chủ đề thành công", topics));
    }
}
