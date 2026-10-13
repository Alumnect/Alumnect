package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringConversationResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringChatContextService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller cung cấp ngữ cảnh Chat for Task (Conversation MENTORING) của chuỗi nghiệp vụ
 * Request → Mentor Response → Chat for Task → Deal → Payment → Task.
 */
@RestController
@RequestMapping("/mentoring/conversations")
@RequiredArgsConstructor
@Tag(name = "Mentoring Chat for Task", description = "Ngữ cảnh Chat for Task gắn Request + Student + Mentor (UC103 - UC105)")
public class MentoringConversationController {

    private final MentoringChatContextService chatContextService;
    private final UserRepository userRepository;

    /**
     * API lấy ngữ cảnh đầy đủ của Chat for Task: Request, thành viên, Deal (mọi phiên bản), thanh toán gần nhất,
     * Task, trạng thái chỉ đọc và quyền thao tác của người dùng hiện tại.
     *
     * @param conversationId ID Chat for Task
     * @return Ngữ cảnh Chat for Task (403 nếu người dùng không phải thành viên)
     */
    @GetMapping("/{conversationId}")
    @Operation(summary = "Lấy ngữ cảnh Chat for Task", description = "Chỉ Học viên chủ Request hoặc đúng Mentor của cuộc hội thoại được truy cập")
    public ResponseEntity<ApiResponse<MentoringConversationResponse>> getConversationContext(@PathVariable Long conversationId) {
        MentoringConversationResponse response = chatContextService.getConversationContext(getCurrentUserId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Lấy ngữ cảnh Chat for Task thành công.", response));
    }

    /**
     * API lấy các Chat for Task của một Request (Học viên thấy tất cả Mentor đã ACCEPT, Mentor chỉ thấy cuộc hội thoại của mình).
     *
     * @param requestId ID Mentoring Request
     * @return Danh sách ngữ cảnh Chat for Task
     */
    @GetMapping("/by-request/{requestId}")
    @Operation(summary = "Lấy các Chat for Task của Request", description = "Truy vết Request → Mentor đã ACCEPT → Conversation → Deal → Payment → Task")
    public ResponseEntity<ApiResponse<List<MentoringConversationResponse>>> getConversationsByRequest(@PathVariable Long requestId) {
        List<MentoringConversationResponse> response = chatContextService.getConversationsByRequest(getCurrentUserId(), requestId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Chat for Task của Request thành công.", response));
    }

    /**
     * Lấy ID người dùng đang đăng nhập từ Security Context.
     */
    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng đang đăng nhập."));
        return user.getId();
    }
}
