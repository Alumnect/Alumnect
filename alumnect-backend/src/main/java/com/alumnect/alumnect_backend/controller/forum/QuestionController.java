package com.alumnect.alumnect_backend.controller.forum;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.forum.CreateQuestionRequest;
import com.alumnect.alumnect_backend.dto.request.forum.UpdateQuestionRequest;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionDetailResponse;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionResponse;
import com.alumnect.alumnect_backend.dto.response.forum.TopicResponse;
import com.alumnect.alumnect_backend.service.forum.QuestionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller xử lý các yêu cầu liên quan đến câu hỏi diễn đàn Q&A
 * (UC38 - View question list, UC39 - View question detail, UC44 - Search questions).
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
     * API lấy một trang câu hỏi trên diễn đàn Q&A, có thể kèm tìm kiếm theo từ khóa (UC44 - Search questions).
     *
     * @param page    Số thứ tự trang cần lấy (0-based), mặc định 0
     * @param size    Kích thước trang, mặc định 10
     * @param sort    Tiêu chí sắp xếp: "recent" (mặc định), "votes", "answers"
     * @param keyword Từ khóa tìm kiếm trên tiêu đề/nội dung câu hỏi, không phân biệt hoa/thường;
     *                bỏ trống nếu không tìm kiếm
     * @param topicId Danh sách ID thể loại cần lọc (tick chọn nhiều), VD {@code topicId=3,7,9};
     *                bỏ trống nếu không lọc theo thể loại
     * @param majorId Danh sách ID ngành cần lọc (tick chọn nhiều), VD {@code majorId=1,4};
     *                bỏ trống nếu không lọc theo ngành. Lọc từ khóa, thể loại và ngành độc lập nhau.
     * @return Trang kết quả câu hỏi {@link QuestionResponse} bọc trong {@link ApiResponse}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<QuestionResponse>>> getQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) List<Long> topicId,
            @RequestParam(required = false) List<Long> majorId) {

        PageResponse<QuestionResponse> questions = questionService.getQuestions(page, size, sort, keyword, topicId, majorId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách câu hỏi thành công", questions));
    }

    /**
     * API đặt một câu hỏi mới trên diễn đàn Q&A (UC40 - Ask a question).
     * Yêu cầu đăng nhập (JWT); chỉ Sinh viên/Cựu sinh viên được đặt câu hỏi — Admin/vai trò khác nhận 403.
     * Guest chưa đăng nhập bị Spring Security chặn với 401 trước khi vào Controller.
     *
     * @param request        DTO chứa tiêu đề, nội dung và chủ đề (tùy chọn) của câu hỏi
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email tác giả
     * @return Chi tiết câu hỏi vừa tạo {@link QuestionDetailResponse} bọc trong {@link ApiResponse}, HTTP 201 Created
     */
    @PostMapping
    public ResponseEntity<ApiResponse<QuestionDetailResponse>> createQuestion(
            @Valid @RequestBody CreateQuestionRequest request,
            Authentication authentication) {

        QuestionDetailResponse created = questionService.createQuestion(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt câu hỏi thành công", created));
    }

    /**
     * API chỉnh sửa một câu hỏi trên diễn đàn Q&A (UC46 - Edit a question).
     * Yêu cầu đăng nhập (JWT); chỉ TÁC GIẢ của câu hỏi mới được sửa — người khác nhận 403.
     * Guest chưa đăng nhập bị Spring Security chặn với 401 trước khi vào Controller.
     *
     * @param id             ID câu hỏi cần sửa
     * @param request        DTO chứa tiêu đề, nội dung, thể loại, ngành và bộ ảnh mới
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email người sửa
     * @return Chi tiết câu hỏi sau khi cập nhật {@link QuestionDetailResponse} bọc trong {@link ApiResponse}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuestionDetailResponse>> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody UpdateQuestionRequest request,
            Authentication authentication) {

        QuestionDetailResponse updated = questionService.updateQuestion(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật câu hỏi thành công", updated));
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
