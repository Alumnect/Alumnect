package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringConversationResponse;

import java.util.List;

/**
 * Dịch vụ truy vấn ngữ cảnh Chat for Task, phục vụ hiển thị và truy vết end-to-end
 * Request → Response → Conversation → Deal → Payment → Task.
 */
public interface MentoringChatContextService {

    /**
     * Lấy ngữ cảnh đầy đủ của một Chat for Task cho thành viên của cuộc hội thoại.
     *
     * @param currentUserId ID người dùng đang đăng nhập (Học viên chủ Request hoặc đúng Mentor của cuộc hội thoại)
     * @param conversationId ID Chat for Task
     * @return Ngữ cảnh cuộc hội thoại
     */
    MentoringConversationResponse getConversationContext(Long currentUserId, Long conversationId);

    /**
     * Lấy các Chat for Task của một Request: Học viên chủ Request thấy tất cả, Mentor chỉ thấy cuộc hội thoại của mình.
     *
     * @param currentUserId ID người dùng đang đăng nhập
     * @param requestId ID Mentoring Request
     * @return Danh sách ngữ cảnh Chat for Task
     */
    List<MentoringConversationResponse> getConversationsByRequest(Long currentUserId, Long requestId);
}
