package com.alumnect.alumnect_backend.controller.forum;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.forum.CreateAnswerRequest;
import com.alumnect.alumnect_backend.dto.request.forum.UpdateAnswerRequest;
import com.alumnect.alumnect_backend.dto.response.forum.AnswerResponse;
import com.alumnect.alumnect_backend.dto.response.forum.VoteResponse;
import com.alumnect.alumnect_backend.service.forum.AnswerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý các yêu cầu liên quan đến câu trả lời của một câu hỏi diễn đàn Q&A
 * (UC41 - Answer a question, UC43 - Vote on an answer). Map với prefix global
 * /api/v1/questions/{questionId}/answers.
 * <p>
 * GET là công khai (xem {@link com.alumnect.alumnect_backend.security.Endpoints#PUBLIC_GET})
 * vì câu trả lời dưới câu hỏi ACTIVE là nội dung công khai. POST/PUT/DELETE yêu cầu đăng nhập; chỉ
 * Student/Alumni được thao tác (RBAC tại tầng Service), Guest bị Spring Security chặn 401.
 */
@RestController
@RequestMapping("/questions/{questionId}/answers")
public class AnswerController {

    @Autowired
    private AnswerService answerService;

    /**
     * API lấy một trang câu trả lời của một câu hỏi.
     *
     * @param questionId     ID câu hỏi cần lấy câu trả lời
     * @param page           Số thứ tự trang (0-based), mặc định 0
     * @param size           Kích thước trang, mặc định 10
     * @param authentication Thông tin xác thực do Spring Security tự động cung cấp — null/Anonymous nếu là Guest;
     *                       dùng để tính cờ {@code voted} của từng câu trả lời/reply (UC43)
     * @return Trang kết quả câu trả lời {@link AnswerResponse} bọc trong {@link ApiResponse}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AnswerResponse>>> getAnswers(
            @PathVariable Long questionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        String viewerEmail = isAuthenticated(authentication) ? authentication.getName() : null;
        PageResponse<AnswerResponse> answers = answerService.getAnswers(questionId, page, size, viewerEmail);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách câu trả lời thành công", answers));
    }

    /**
     * API trả lời một câu hỏi trên diễn đàn Q&A (UC41 - Answer a question).
     * Yêu cầu đăng nhập (JWT); chỉ Sinh viên/Cựu sinh viên được trả lời — Admin/vai trò khác nhận 403.
     * Guest chưa đăng nhập bị Spring Security chặn với 401 trước khi vào Controller.
     *
     * @param questionId     ID câu hỏi được trả lời
     * @param request        DTO chứa nội dung câu trả lời
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email tác giả
     * @return Chi tiết câu trả lời vừa tạo {@link AnswerResponse} bọc trong {@link ApiResponse}, HTTP 201 Created
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AnswerResponse>> createAnswer(
            @PathVariable Long questionId,
            @Valid @RequestBody CreateAnswerRequest request,
            Authentication authentication) {

        AnswerResponse created = answerService.createAnswer(authentication.getName(), questionId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Trả lời câu hỏi thành công", created));
    }

    /**
     * API chỉnh sửa một câu trả lời (hoặc reply) trên diễn đàn Q&A (UC48 - Edit an answer).
     * Yêu cầu đăng nhập (JWT); chỉ TÁC GIẢ của câu trả lời mới được sửa — người khác nhận 403.
     *
     * @param questionId     ID câu hỏi chứa câu trả lời
     * @param answerId       ID câu trả lời cần sửa
     * @param request        DTO chứa nội dung mới
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email người sửa
     * @return Chi tiết câu trả lời sau khi cập nhật {@link AnswerResponse} bọc trong {@link ApiResponse}
     */
    @PutMapping("/{answerId}")
    public ResponseEntity<ApiResponse<AnswerResponse>> updateAnswer(
            @PathVariable Long questionId,
            @PathVariable Long answerId,
            @Valid @RequestBody UpdateAnswerRequest request,
            Authentication authentication) {

        AnswerResponse updated = answerService.updateAnswer(authentication.getName(), questionId, answerId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật câu trả lời thành công", updated));
    }

    /**
     * API bình chọn (upvote) một câu trả lời (hoặc reply) trên diễn đàn Q&A (UC43 - Vote on an answer).
     * Yêu cầu đăng nhập (JWT); chỉ Sinh viên/Cựu sinh viên được bình chọn — Admin/vai trò khác nhận 403.
     * Guest chưa đăng nhập bị Spring Security chặn với 401 trước khi vào Controller. Idempotent — gọi
     * lại nhiều lần không tăng thêm vote.
     *
     * @param questionId     ID câu hỏi chứa câu trả lời
     * @param answerId       ID câu trả lời cần bình chọn
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email người bình chọn
     * @return Trạng thái bình chọn mới + tổng số vote {@link VoteResponse} bọc trong {@link ApiResponse}
     */
    @PostMapping("/{answerId}/vote")
    public ResponseEntity<ApiResponse<VoteResponse>> voteAnswer(
            @PathVariable Long questionId,
            @PathVariable Long answerId,
            Authentication authentication) {

        VoteResponse result = answerService.voteAnswer(authentication.getName(), questionId, answerId);
        return ResponseEntity.ok(ApiResponse.success("Bình chọn câu trả lời thành công", result));
    }

    /**
     * API bỏ bình chọn một câu trả lời (hoặc reply) trên diễn đàn Q&A (UC43 - Vote on an answer).
     * Yêu cầu đăng nhập (JWT); chỉ Sinh viên/Cựu sinh viên. Idempotent — bỏ bình chọn khi chưa từng
     * bình chọn không lỗi.
     *
     * @param questionId     ID câu hỏi chứa câu trả lời
     * @param answerId       ID câu trả lời cần bỏ bình chọn
     * @param authentication Thông tin xác thực do Spring Security cung cấp — dùng lấy email người bỏ bình chọn
     * @return Trạng thái bình chọn mới + tổng số vote {@link VoteResponse} bọc trong {@link ApiResponse}
     */
    @DeleteMapping("/{answerId}/vote")
    public ResponseEntity<ApiResponse<VoteResponse>> unvoteAnswer(
            @PathVariable Long questionId,
            @PathVariable Long answerId,
            Authentication authentication) {

        VoteResponse result = answerService.unvoteAnswer(authentication.getName(), questionId, answerId);
        return ResponseEntity.ok(ApiResponse.success("Bỏ bình chọn câu trả lời thành công", result));
    }

    /**
     * Xác định người gọi đã đăng nhập hay là Guest dựa trên {@link Authentication} do Spring Security cung cấp.
     * Mirror pattern {@code isAuthenticated} của {@code QuestionController} (UC42)/{@code PostController}.
     *
     * @param authentication Đối tượng xác thực — null hoặc {@link AnonymousAuthenticationToken} nếu là Guest
     * @return true nếu đã đăng nhập (có JWT hợp lệ), false nếu là Guest
     */
    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }
}
