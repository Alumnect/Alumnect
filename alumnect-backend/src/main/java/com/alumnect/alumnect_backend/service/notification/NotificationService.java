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
}
