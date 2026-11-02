package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondTaskCompletionRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.SubmitTaskCompletionRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskCompletionResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskCompletionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý nộp và nghiệm thu hoàn thành Mentoring Task (UC110).
 */
@Slf4j
@RestController
@RequestMapping("/mentoring/tasks")
@RequiredArgsConstructor
@Tag(name = "Mentoring Task Completion", description = "Xử lý nộp kết quả và xác nhận hoàn thành Task (UC110)")
public class MentoringTaskCompletionController {

    private final MentoringTaskCompletionService completionService;
    private final UserRepository userRepository;

    @PostMapping("/{taskId}/completions")
    @Operation(summary = "Mentor nộp kết quả hoàn thành nhiệm vụ (UC110)",
               description = "Cho phép Mentor nộp tóm tắt kết quả cuối cùng và deliverables chờ Student nghiệm thu")
    public ResponseEntity<ApiResponse<MentoringTaskCompletionResponse>> submitCompletion(
            @PathVariable Long taskId,
            @Valid @RequestBody SubmitTaskCompletionRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskCompletionResponse response = completionService.submitCompletion(currentUserId, taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Nộp kết quả hoàn thành Task thành công", response));
    }

    @PutMapping("/{taskId}/completions/{completionId}/respond")
    @Operation(summary = "Student xác nhận hoặc từ chối nghiệm thu hoàn thành Task (UC110)",
               description = "Student xác nhận hoàn thành (chuyển Task sang COMPLETED và tự tạo lệnh Payout thù lao cho Mentor) hoặc từ chối để Mentor chỉnh sửa")
    public ResponseEntity<ApiResponse<MentoringTaskCompletionResponse>> respondCompletion(
            @PathVariable Long taskId,
            @PathVariable Long completionId,
            @Valid @RequestBody RespondTaskCompletionRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskCompletionResponse response = completionService.respondCompletion(currentUserId, taskId, completionId, request);
        String message = Boolean.TRUE.equals(request.getAccept())
                ? "Xác nhận nghiệm thu hoàn thành Task thành công"
                : "Đã gửi yêu cầu chỉnh sửa/bổ sung cho Cố vấn";
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }

    @GetMapping("/{taskId}/completions/latest")
    @Operation(summary = "Lấy lần nộp nghiệm thu mới nhất của Task (UC110)",
               description = "Trả về thông tin kết quả hoàn thành và deliverables mới nhất của Task")
    public ResponseEntity<ApiResponse<MentoringTaskCompletionResponse>> getLatestCompletion(
            @PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskCompletionResponse response = completionService.getLatestCompletion(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin nộp nghiệm thu mới nhất thành công", response));
    }

    @GetMapping("/{taskId}/completions")
    @Operation(summary = "Lấy danh sách lịch sử các lần nộp nghiệm thu của Task (UC110)",
               description = "Trả về toàn bộ các lần nộp kết quả nghiệm thu của Task theo thứ tự mới nhất trước")
    public ResponseEntity<ApiResponse<List<MentoringTaskCompletionResponse>>> getCompletionHistory(
            @PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        List<MentoringTaskCompletionResponse> response = completionService.getCompletionHistory(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử nộp nghiệm thu thành công", response));
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng đăng nhập."));
        return user.getId();
    }
}
