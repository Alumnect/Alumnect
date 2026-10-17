package com.alumnect.alumnect_backend.service.notification;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.notification.NotificationResponse;
import com.alumnect.alumnect_backend.dto.response.notification.UnreadNotificationCountResponse;
import com.alumnect.alumnect_backend.entity.forum.Answer;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.post.Comment;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.user.User;

/**
 * Interface định nghĩa các nghiệp vụ quản lý và gửi thông báo trong toàn bộ hệ thống AlumNect.
 */
public interface NotificationService {

    /**
     * Lấy danh sách thông báo của người dùng đăng nhập hiện tại theo thứ tự mới nhất (phân trang).
     *
     * @param email Email người dùng đăng nhập
     * @param page  Số trang (bắt đầu từ 0)
     * @param size  Số lượng bản ghi trên một trang
     * @return Dữ liệu phân trang danh sách thông báo
     */
    PageResponse<NotificationResponse> getNotifications(String email, int page, int size);

    /**
     * Lấy số lượng thông báo chưa đọc của người dùng hiện tại.
     *
     * @param email Email người dùng đăng nhập
     * @return DTO chứa số lượng thông báo chưa đọc
     */
    UnreadNotificationCountResponse getUnreadCount(String email);

    /**
     * Đánh dấu một thông báo cụ thể là đã đọc.
     *
     * @param email          Email người dùng đăng nhập
     * @param notificationId ID thông báo cần đánh dấu
     */
    void markAsRead(String email, Long notificationId);

    /**
     * Đánh dấu tất cả thông báo chưa đọc của người dùng là đã đọc.
     *
     * @param email Email người dùng đăng nhập
     */
    void markAllAsRead(String email);

    /**
     * Gửi hoặc cập nhật gom nhóm thông báo khi có người thích bài viết (Kịch bản 1).
     *
     * @param liker Người bấm like
     * @param post  Bài viết được like
     */
    void sendLikeNotification(User liker, Post post);

    /**
     * Xử lý giảm số lượng hoặc cập nhật thông báo khi người dùng bỏ thích bài viết.
     *
     * @param unliker Người bấm unlike
     * @param post    Bài viết bị unlike
     */
    void handleUnlikeNotification(User unliker, Post post);

    /**
     * Gửi thông báo khi có người bình luận vào bài viết (Kịch bản 2).
     *
     * @param commenter Người bình luận
     * @param comment   Bình luận mới
     * @param post      Bài viết được bình luận
     */
    void sendCommentNotification(User commenter, Comment comment, Post post);

    /**
     * Gửi thông báo khi có người theo dõi mới (Kịch bản 3).
     *
     * @param follower  Người bấm theo dõi
     * @param following Người được theo dõi
     */
    void sendFollowNotification(User follower, User following);

    /**
     * Gửi thông báo khi có câu trả lời mới cho câu hỏi diễn đàn (Kịch bản 4).
     *
     * @param answerer Người trả lời
     * @param question Câu hỏi được trả lời
     * @param answer   Câu trả lời mới
     */
    void sendAnswerNotification(User answerer, Question question, Answer answer);

    /**
     * Gửi thông báo cho tác giả khi bài viết bị gỡ do vi phạm tiêu chuẩn cộng đồng (Kịch bản 5).
     *
     * @param post Bài viết bị xử lý gỡ
     */
    void sendReportResolvedNotification(Post post);

    /**
     * Gửi thông báo chào mừng khi tài khoản chuyển sang trạng thái ACTIVE (Kịch bản 6).
     *
     * @param user Tài khoản vừa kích hoạt ACTIVE
     */
    void sendWelcomeNotification(User user);

    /** Gửi yêu cầu thuê/cố vấn mới tới Mentor để hiển thị và xử lý theo thời gian thực. */
    void sendMentoringRequestNotification(
            User student,
            User mentor,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest request
    );

    /** Thông báo lại cho học viên khi Mentor nhận hoặc bỏ qua yêu cầu. */
    void sendMentoringRequestResponseNotification(
            User mentor,
            User student,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest request,
            boolean accepted
    );

    /**
     * Gửi một thông báo cần thiết cho mỗi bên khi thanh toán hoàn tất và Task
     * được kích hoạt lần đầu.
     */
    void sendMentoringTaskActivatedNotification(
            com.alumnect.alumnect_backend.entity.user.User student,
            com.alumnect.alumnect_backend.entity.user.User mentor,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringTask task
    );

    /**
     * Gửi một sự kiện Task có định danh duy nhất vào Notification Center.
     * Dùng cho các yêu cầu cần đối phương xác nhận và các mốc hoàn thành Task.
     */
    void sendMentoringTaskEventNotification(
            com.alumnect.alumnect_backend.entity.user.User sender,
            com.alumnect.alumnect_backend.entity.user.User recipient,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringTask task,
            String eventType,
            String eventId,
            String title,
            String content
    );

    /**
     * Thông báo tài khoản Mentoring (request đóng, gói Mentor, chi trả, hoàn tiền).
     * Chống gửi trùng theo (người nhận, targetType, targetId).
     */
    void sendMentoringAccountNotification(
            com.alumnect.alumnect_backend.entity.user.User sender,
            com.alumnect.alumnect_backend.entity.user.User recipient,
            String targetType,
            String targetId,
            String title,
            String content
    );

    void sendMentoringGroupNotification(
            com.alumnect.alumnect_backend.entity.user.User sender,
            com.alumnect.alumnect_backend.entity.user.User recipient,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringGroup group,
            String eventType,
            String eventId,
            String title,
            String content
    );

    /**
     * Gửi thông báo cho học viên khi Mentor tạo/nộp Work Log mới chờ xác nhận (UC107).
     *
     * @param mentor Mentor đã gửi Work Log
     * @param student Học viên nhận thông báo
     * @param task Nhiệm vụ Mentoring tương ứng
     * @param workLog Bản ghi Work Log mới tạo
     */
    void sendMentoringWorkLogNotification(
            com.alumnect.alumnect_backend.entity.user.User mentor,
            com.alumnect.alumnect_backend.entity.user.User student,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringTask task,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog workLog,
            boolean taskJustStarted
    );

    /**
     * Gửi thông báo cho Mentor khi Học viên xác nhận nghiệm thu Work Log (UC108).
     */
    void sendMentoringWorkLogConfirmedNotification(
            com.alumnect.alumnect_backend.entity.user.User student,
            com.alumnect.alumnect_backend.entity.user.User mentor,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringTask task,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog workLog
    );

    /**
     * Gửi thông báo cho Mentor khi Học viên yêu cầu điều chỉnh Work Log (UC108).
     */
    void sendMentoringWorkLogRejectedNotification(
            com.alumnect.alumnect_backend.entity.user.User student,
            com.alumnect.alumnect_backend.entity.user.User mentor,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringTask task,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog workLog,
            String feedback
    );

    /**
     * Gửi thông báo cho Học viên khi Mentor cập nhật lại Work Log theo yêu cầu làm rõ (UC108).
     */
    void sendMentoringWorkLogResubmittedNotification(
            com.alumnect.alumnect_backend.entity.user.User mentor,
            com.alumnect.alumnect_backend.entity.user.User student,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringTask task,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog workLog
    );

    /**
     * Gửi thông báo cho Học viên và Cố vấn khi Quản trị viên tiếp nhận xử lý vé khiếu nại/hòa giải (UC117).
     *
     * @param admin Quản trị viên tiếp nhận
     * @param student Học viên liên quan
     * @param mentor Cố vấn liên quan
     * @param ticket Vé tranh chấp / hòa giải
     */
    void sendMentoringTicketAcceptedNotification(
            com.alumnect.alumnect_backend.entity.user.User admin,
            com.alumnect.alumnect_backend.entity.user.User student,
            com.alumnect.alumnect_backend.entity.user.User mentor,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket ticket
    );

    /**
     * Gửi thông báo cho các bên khi có tin nhắn hoặc đề xuất hòa giải mới trong Ticket (UC119).
     *
     * @param sender Người gửi tin nhắn (Admin, Student, hoặc Mentor)
     * @param recipient Người nhận thông báo
     * @param ticket Vé tranh chấp / hòa giải
     * @param messageType Loại tin nhắn
     * @param content Nội dung tóm tắt
     */
    void sendMentoringTicketMessageNotification(
            com.alumnect.alumnect_backend.entity.user.User sender,
            com.alumnect.alumnect_backend.entity.user.User recipient,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket ticket,
            String messageType,
            String content
    );

    /**
     * Gửi thông báo cho Học viên và Cố vấn khi Quản trị viên ra phán quyết giải quyết Ticket (UC120).
     *
     * @param admin Quản trị viên ra phán quyết
     * @param student Học viên liên quan
     * @param mentor Cố vấn liên quan
     * @param ticket Vé tranh chấp / hòa giải đã giải quyết
     */
    void sendMentoringTicketResolvedNotification(
            com.alumnect.alumnect_backend.entity.user.User admin,
            com.alumnect.alumnect_backend.entity.user.User student,
            com.alumnect.alumnect_backend.entity.user.User mentor,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket ticket
    );
}
