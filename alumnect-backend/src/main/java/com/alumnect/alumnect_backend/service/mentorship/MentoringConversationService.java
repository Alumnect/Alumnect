package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;

import java.util.Optional;

/**
 * Dịch vụ hạ tầng cho Chat for Task (Conversation loại MENTORING) trong chuỗi nghiệp vụ
 * Request → Mentor Response → Chat for Task → Deal → Payment → Task.
 * Tái sử dụng hạ tầng Direct Messaging nhưng mỗi cuộc hội thoại thuộc duy nhất bộ (Request, Student, Mentor).
 */
public interface MentoringConversationService {

    /**
     * Lấy hoặc tạo mới (idempotent) Chat for Task của bộ (Request, Student, Mentor).
     * Mô tả chi tiết: nếu đã tồn tại thì trả về cuộc hội thoại cũ, không tạo cuộc hội thoại thứ hai;
     * nếu chưa có thì tạo Conversation MENTORING (task_id = null) cùng 2 thành viên Student và Mentor.
     *
     * @param request Request sở hữu cuộc hội thoại (Student được suy ra từ Request)
     * @param mentor Tài khoản người dùng của Mentor đã ACCEPT
     * @return Chat for Task tương ứng
     */
    Conversation getOrCreateConversation(MentoringRequest request, User mentor);

    /**
     * Tìm Chat for Task của bộ (Request, Mentor) nếu đã tồn tại.
     *
     * @param requestId ID của Request
     * @param mentorUserId ID tài khoản người dùng của Mentor
     * @return Cuộc hội thoại MENTORING nếu có
     */
    Optional<Conversation> findConversation(Long requestId, Long mentorUserId);

    /**
     * Lấy Chat for Task và xác thực người dùng hiện tại là thành viên (Student chủ Request hoặc đúng Mentor của cuộc hội thoại).
     * Không tin conversationId do client gửi lên: Mentor A không thể truy cập cuộc hội thoại của Mentor B.
     *
     * @param currentUserId ID người dùng đang đăng nhập
     * @param conversationId ID cuộc hội thoại
     * @return Cuộc hội thoại MENTORING đã được xác thực quyền truy cập
     */
    Conversation requireParticipantConversation(Long currentUserId, Long conversationId);

    /**
     * Xác định lý do Chat for Task ở chế độ chỉ đọc theo trạng thái nghiệp vụ trong cơ sở dữ liệu.
     *
     * @param conversation Cuộc hội thoại MENTORING
     * @return Lý do chỉ đọc (tiếng Việt) hoặc null nếu cuộc hội thoại vẫn hoạt động
     */
    String resolveReadOnlyReason(Conversation conversation);

    /**
     * Ném lỗi nếu Chat for Task đang ở chế độ chỉ đọc (dùng chung cho gửi tin nhắn và thao tác Deal).
     *
     * @param conversation Cuộc hội thoại MENTORING
     */
    void assertWritable(Conversation conversation);

    /**
     * Gửi tin nhắn hệ thống (SYSTEM) vào Chat for Task và đẩy WebSocket tới các thành viên sau khi transaction commit.
     * Tin nhắn hệ thống chỉ mang tính thông báo, không phải nguồn sự thật cho trạng thái nghiệp vụ.
     *
     * @param conversation Cuộc hội thoại nhận tin nhắn
     * @param sender Người dùng được ghi nhận là người gửi
     * @param content Nội dung tin nhắn hệ thống
     */
    void postSystemMessage(Conversation conversation, User sender, String content);

    /**
     * Gửi tin nhắn văn bản thường (TEXT) do người dùng viết vào Chat for Task, ví dụ lời nhắn khi Mentor đồng ý trao đổi.
     */
    void postUserMessage(Conversation conversation, User sender, String content);

    /**
     * Lấy tên hiển thị của người dùng (họ tên trong hồ sơ hoặc email dự phòng).
     *
     * @param user Người dùng
     * @return Tên hiển thị
     */
    String displayName(User user);
}
