package com.alumnect.alumnect_backend.service.forum;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.forum.CreateQuestionRequest;
import com.alumnect.alumnect_backend.dto.request.forum.UpdateQuestionRequest;
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
     * Lấy một trang câu hỏi cho danh sách diễn đàn, có thể kèm tìm kiếm theo từ khóa
     * (UC44 - Search questions). Ai cũng xem được (Guest/Student/Alumni) vì câu hỏi ACTIVE
     * là nội dung công khai; kết quả loại bỏ câu hỏi đã bị ẩn/xóa.
     *
     * @param page     Số thứ tự trang cần lấy (0-based)
     * @param size     Kích thước trang (số câu hỏi mỗi trang)
     * @param sort     Tiêu chí sắp xếp: "recent" (mới nhất), "votes" (nhiều vote), "answers" (nhiều trả lời)
     * @param keyword  Từ khóa tìm kiếm trên tiêu đề/nội dung (không phân biệt hoa/thường), hoặc null/rỗng nếu không tìm kiếm
     * @param topicIds Danh sách ID thể loại cần lọc (khớp bất kỳ), hoặc null/rỗng nếu không lọc theo thể loại
     * @param majorIds Danh sách ID ngành cần lọc (khớp bất kỳ), hoặc null/rỗng nếu không lọc theo ngành
     * @return Trang kết quả câu hỏi đã chuẩn hóa, sẵn sàng trả về Client
     * @throws com.alumnect.alumnect_backend.exception.BadRequestException nếu keyword vượt quá độ dài tối đa cho phép
     */
    PageResponse<QuestionResponse> getQuestions(int page, int size, String sort, String keyword, List<Long> topicIds, List<Long> majorIds);

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
     * Đặt một câu hỏi mới trên diễn đàn Q&A (UC40 - Ask a question). Chỉ Student/Alumni đã đăng nhập
     * mới được đặt câu hỏi; vai trò khác (VD Admin) bị từ chối với lỗi 403.
     *
     * @param email   Email của người dùng đang đăng nhập (lấy từ SecurityContext)
     * @param request DTO chứa tiêu đề, nội dung và chủ đề (tùy chọn) của câu hỏi
     * @return Chi tiết câu hỏi vừa tạo đã chuẩn hóa
     * @throws com.alumnect.alumnect_backend.exception.ForbiddenException nếu vai trò không phải Student/Alumni
     * @throws com.alumnect.alumnect_backend.exception.BadRequestException nếu topicId hoặc majorId truyền lên không tồn tại
     */
    QuestionDetailResponse createQuestion(String email, CreateQuestionRequest request);

    /**
     * Chỉnh sửa một câu hỏi đã có trên diễn đàn Q&A (UC46 - Edit a question). Chỉ TÁC GIẢ của câu hỏi
     * mới được sửa; người khác (kể cả Student/Alumni khác) bị từ chối với lỗi 403. Cho phép sửa tiêu đề,
     * nội dung, thể loại, ngành và thay toàn bộ ảnh đính kèm.
     *
     * @param email      Email của người dùng đang đăng nhập (lấy từ SecurityContext)
     * @param questionId ID câu hỏi cần sửa
     * @param request    DTO chứa dữ liệu mới của câu hỏi
     * @return Chi tiết câu hỏi sau khi cập nhật đã chuẩn hóa
     * @throws com.alumnect.alumnect_backend.exception.ResourceNotFoundException nếu không tìm thấy câu hỏi ACTIVE tương ứng
     * @throws com.alumnect.alumnect_backend.exception.ForbiddenException nếu người dùng không phải tác giả câu hỏi
     * @throws com.alumnect.alumnect_backend.exception.BadRequestException nếu topicId hoặc majorId truyền lên không tồn tại
     */
    QuestionDetailResponse updateQuestion(String email, Long questionId, UpdateQuestionRequest request);

    /**
     * Lấy toàn bộ danh mục chủ đề diễn đàn để đổ vào bộ lọc phía Frontend.
     *
     * @return Danh sách chủ đề (id + tên), sắp xếp theo tên
     */
    List<TopicResponse> getTopics();
}
