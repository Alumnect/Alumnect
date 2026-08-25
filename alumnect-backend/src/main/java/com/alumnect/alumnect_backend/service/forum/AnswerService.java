package com.alumnect.alumnect_backend.service.forum;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.forum.CreateAnswerRequest;
import com.alumnect.alumnect_backend.dto.request.forum.UpdateAnswerRequest;
import com.alumnect.alumnect_backend.dto.response.forum.AnswerResponse;

/**
 * Interface định nghĩa các dịch vụ liên quan tới câu trả lời diễn đàn Q&A (UC41 - Answer a question).
 */
public interface AnswerService {

    /**
     * Lấy một trang câu trả lời ACTIVE của một câu hỏi. Ai cũng xem được (Guest/Student/Alumni)
     * vì câu trả lời dưới câu hỏi ACTIVE là nội dung công khai.
     *
     * @param questionId ID câu hỏi cần lấy danh sách câu trả lời
     * @param page       Số thứ tự trang (0-based)
     * @param size       Kích thước trang
     * @return Trang kết quả câu trả lời đã chuẩn hóa
     * @throws com.alumnect.alumnect_backend.exception.ResourceNotFoundException nếu câu hỏi không tồn tại hoặc không ACTIVE
     */
    PageResponse<AnswerResponse> getAnswers(Long questionId, int page, int size);

    /**
     * Trả lời một câu hỏi trên diễn đàn Q&A, hoặc reply cho một câu trả lời gốc (nếu có {@code parentId}).
     * Chỉ Student/Alumni đã đăng nhập mới được trả lời; vai trò khác (VD Admin) bị từ chối 403.
     * Khi tạo câu trả lời GỐC thành công, số câu trả lời của câu hỏi tăng 1 (reply không tính vào bộ đếm).
     *
     * @param email      Email người dùng đang đăng nhập (lấy từ SecurityContext)
     * @param questionId ID câu hỏi được trả lời
     * @param request    DTO chứa nội dung câu trả lời và {@code parentId} (tùy chọn — reply)
     * @return Chi tiết câu trả lời vừa tạo đã chuẩn hóa
     * @throws com.alumnect.alumnect_backend.exception.ForbiddenException nếu vai trò không phải Student/Alumni
     * @throws com.alumnect.alumnect_backend.exception.ResourceNotFoundException nếu không tìm thấy user hoặc câu hỏi ACTIVE
     * @throws com.alumnect.alumnect_backend.exception.BadRequestException nếu {@code parentId} không hợp lệ (không tồn tại, khác câu hỏi, hoặc đã là reply)
     */
    AnswerResponse createAnswer(String email, Long questionId, CreateAnswerRequest request);

    /**
     * Chỉnh sửa một câu trả lời (hoặc reply) trên diễn đàn Q&A (UC48 - Edit an answer).
     * Chỉ TÁC GIẢ của câu trả lời mới được sửa; người khác bị từ chối 403.
     *
     * @param email      Email người dùng đang đăng nhập (lấy từ SecurityContext)
     * @param questionId ID câu hỏi chứa câu trả lời (để xác thực đường dẫn)
     * @param answerId   ID câu trả lời cần sửa
     * @param request    DTO chứa nội dung mới
     * @return Chi tiết câu trả lời sau khi cập nhật đã chuẩn hóa
     * @throws com.alumnect.alumnect_backend.exception.ForbiddenException nếu người dùng không phải tác giả
     * @throws com.alumnect.alumnect_backend.exception.ResourceNotFoundException nếu không tìm thấy câu trả lời ACTIVE tương ứng
     */
    AnswerResponse updateAnswer(String email, Long questionId, Long answerId, UpdateAnswerRequest request);
}
