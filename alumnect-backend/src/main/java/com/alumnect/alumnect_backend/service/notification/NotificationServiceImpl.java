package com.alumnect.alumnect_backend.service.notification;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.constant.WebSocketDestinations;
import com.alumnect.alumnect_backend.common.enums.NotificationType;
import com.alumnect.alumnect_backend.dao.notification.NotificationRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.notification.NotificationResponse;
import com.alumnect.alumnect_backend.dto.response.notification.UnreadNotificationCountResponse;
import com.alumnect.alumnect_backend.entity.forum.Answer;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.notification.Notification;
import com.alumnect.alumnect_backend.entity.post.Comment;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.notification.NotificationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Lớp triển khai dịch vụ quản lý và gửi thông báo trong toàn bộ hệ thống AlumNect.
 * Quản lý lưu trữ CSDL PostgreSQL và phát sóng thông báo thời gian thực qua WebSocket STOMP.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getNotifications(String email, int page, int size) {
        User user = getUserByEmail(email);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));

        Page<Notification> notifPage = notificationRepository.findValidByRecipientId(user.getId(), Instant.now(), pageable);
        List<NotificationResponse> dtoList = notifPage.getContent().stream()
                .map(notificationMapper::toDto)
                .collect(Collectors.toList());

        return PageResponse.<NotificationResponse>builder()
                .content(dtoList)
                .pageNumber(notifPage.getNumber())
                .pageSize(notifPage.getSize())
                .totalElements(notifPage.getTotalElements())
                .totalPages(notifPage.getTotalPages())
                .last(notifPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UnreadNotificationCountResponse getUnreadCount(String email) {
        User user = getUserByEmail(email);
        long count = notificationRepository.countValidUnreadByRecipientId(user.getId(), Instant.now());
        return UnreadNotificationCountResponse.builder()
                .unreadCount(count)
                .build();
    }

    @Override
    @Transactional
    public void markAsRead(String email, Long notificationId) {
        User user = getUserByEmail(email);
        int updated = notificationRepository.markAsReadByIdAndRecipientId(notificationId, user.getId());
        if (updated == 0) {
            throw new ResourceNotFoundException("Không tìm thấy thông báo hoặc bạn không có quyền thao tác.");
        }
        log.info("Người dùng ID={} đã đánh dấu thông báo ID={} là đã đọc", user.getId(), notificationId);
    }

    @Override
    @Transactional
    public void markAllAsRead(String email) {
        User user = getUserByEmail(email);
        int count = notificationRepository.markAllAsReadByRecipientId(user.getId());
        log.info("Người dùng ID={} đã đánh dấu tất cả {} thông báo là đã đọc", user.getId(), count);
    }

    @Override
    @Transactional
    public void sendLikeNotification(User liker, Post post) {
        if (post == null || post.getAuthor() == null || liker == null) {
            return;
        }
        // Người dùng tự thích bài viết của chính mình -> không gửi thông báo
        if (liker.getId().equals(post.getAuthor().getId())) {
            return;
        }

        User recipient = post.getAuthor();
        String targetType = "POST";
        String targetId = String.valueOf(post.getId());
        String likerName = resolveFullName(liker);

        // Kiểm tra xem đã có thông báo Like chưa đọc trên bài viết này hay chưa để gom nhóm
        Optional<Notification> existingOpt = notificationRepository
                .findFirstByRecipientIdAndTypeAndTargetTypeAndTargetIdAndIsReadFalseOrderByCreatedAtDesc(
                        recipient.getId(),
                        NotificationType.POST_LIKE,
                        targetType,
                        targetId
                );

        Notification notification;
        if (existingOpt.isPresent()) {
            Notification existing = existingOpt.get();
            int newCount = (existing.getSenderCount() != null ? existing.getSenderCount() : 1) + 1;
            existing.setSender(liker);
            existing.setSenderCount(newCount);
            existing.setContent(likerName + " và " + (newCount - 1) + " người khác đã thích bài viết của bạn.");
            existing.setUpdatedAt(Instant.now());
            notification = notificationRepository.save(existing);
        } else {
            notification = Notification.builder()
                    .recipient(recipient)
                    .sender(liker)
                    .type(NotificationType.POST_LIKE)
                    .title("Lượt thích mới")
                    .content(likerName + " đã thích bài viết của bạn.")
                    .targetType(targetType)
                    .targetId(targetId)
                    .senderCount(1)
                    .isRead(false)
                    .build();
            notification = notificationRepository.save(notification);
        }

        pushRealtimeNotification(recipient, notification);
    }

    @Override
    @Transactional
    public void handleUnlikeNotification(User unliker, Post post) {
        if (post == null || post.getAuthor() == null || unliker == null) {
            return;
        }
        if (unliker.getId().equals(post.getAuthor().getId())) {
            return;
        }

        User recipient = post.getAuthor();
        String targetType = "POST";
        String targetId = String.valueOf(post.getId());

        Optional<Notification> existingOpt = notificationRepository
                .findFirstByRecipientIdAndTypeAndTargetTypeAndTargetIdAndIsReadFalseOrderByCreatedAtDesc(
                        recipient.getId(),
                        NotificationType.POST_LIKE,
                        targetType,
                        targetId
                );

        if (existingOpt.isPresent()) {
            Notification notif = existingOpt.get();
            int currentCount = notif.getSenderCount() != null ? notif.getSenderCount() : 1;
            if (currentCount <= 1) {
                notificationRepository.delete(notif);
            } else {
                int newCount = currentCount - 1;
                notif.setSenderCount(newCount);
                if (newCount == 1) {
                    notif.setContent("Một thành viên đã thích bài viết của bạn.");
                } else {
                    notif.setContent("Một thành viên và " + (newCount - 1) + " người khác đã thích bài viết của bạn.");
                }
                notif.setUpdatedAt(Instant.now());
                notificationRepository.save(notif);
            }
        }
    }

    @Override
    @Transactional
    public void sendCommentNotification(User commenter, Comment comment, Post post) {
        if (commenter == null || comment == null || post == null || post.getAuthor() == null) {
            return;
        }
        // Tự bình luận bài viết của mình -> không gửi thông báo
        if (commenter.getId().equals(post.getAuthor().getId())) {
            return;
        }

        User recipient = post.getAuthor();
        String commenterName = resolveFullName(commenter);
        String rawComment = comment.getContent() != null ? comment.getContent().trim() : "";
        String snippet = rawComment.length() > 60 ? rawComment.substring(0, 57) + "..." : rawComment;

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(commenter)
                .type(NotificationType.POST_COMMENT)
                .title("Bình luận mới")
                .content(commenterName + " đã bình luận về bài viết của bạn: \"" + snippet + "\"")
                .targetType("POST")
                .targetId(post.getId() + "#comment-" + comment.getId())
                .senderCount(1)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        pushRealtimeNotification(recipient, notification);
    }

    @Override
    @Transactional
    public void sendFollowNotification(User follower, User following) {
        if (follower == null || following == null) {
            return;
        }
        if (follower.getId().equals(following.getId())) {
            return;
        }

        String followerName = resolveFullName(follower);
        Notification notification = Notification.builder()
                .recipient(following)
                .sender(follower)
                .type(NotificationType.USER_FOLLOW)
                .title("Người theo dõi mới")
                .content(followerName + " đã bắt đầu theo dõi bạn.")
                .targetType("USER")
                .targetId(String.valueOf(follower.getId()))
                .senderCount(1)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        pushRealtimeNotification(following, notification);
    }

    @Override
    @Transactional
    public void sendAnswerNotification(User answerer, Question question, Answer answer) {
        if (answerer == null || question == null || question.getAuthor() == null) {
            return;
        }
        // Tác giả tự trả lời câu hỏi của mình -> không gửi thông báo
        if (answerer.getId().equals(question.getAuthor().getId())) {
            return;
        }

        User recipient = question.getAuthor();
        String answererName = resolveFullName(answerer);
        String rawTitle = question.getTitle() != null ? question.getTitle().trim() : "";
        String snippet = rawTitle.length() > 50 ? rawTitle.substring(0, 47) + "..." : rawTitle;

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(answerer)
                .type(NotificationType.FORUM_ANSWER)
                .title("Câu trả lời mới")
                .content(answererName + " đã trả lời câu hỏi \"" + snippet + "\" của bạn.")
                .targetType("QUESTION")
                .targetId(String.valueOf(question.getId()))
                .senderCount(1)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        pushRealtimeNotification(recipient, notification);
    }

    @Override
    @Transactional
    public void sendReportResolvedNotification(Post post) {
        if (post == null || post.getAuthor() == null) {
            return;
        }

        User recipient = post.getAuthor();
        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(null) // Hệ thống gửi
                .type(NotificationType.REPORT_RESOLVED)
                .title("Thông báo vi phạm tiêu chuẩn cộng đồng")
                .content("Bài viết của bạn đã bị gỡ do vi phạm tiêu chuẩn cộng đồng.")
                .targetType("POST")
                .targetId(String.valueOf(post.getId()))
                .senderCount(1)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        pushRealtimeNotification(recipient, notification);
    }

    @Override
    @Transactional
    public void sendWelcomeNotification(User user) {
        if (user == null) {
            return;
        }

        // Kiểm tra tránh gửi lặp thông báo chào mừng
        Optional<Notification> existing = notificationRepository
                .findFirstByRecipientIdAndTypeAndTargetTypeAndTargetIdAndIsReadFalseOrderByCreatedAtDesc(
                        user.getId(),
                        NotificationType.WELCOME,
                        "SYSTEM",
                        "WELCOME"
                );
        if (existing.isPresent()) {
            return;
        }

        Notification notification = Notification.builder()
                .recipient(user)
                .sender(null) // Hệ thống gửi
                .type(NotificationType.WELCOME)
                .title("Chào mừng đến với AlumNect! 🎉")
                .content("Chào mừng bạn đến với AlumNect! Khám phá mạng lưới kết nối cựu sinh viên và sinh viên ngay.")
                .targetType("SYSTEM")
                .targetId("WELCOME")
                .senderCount(1)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        pushRealtimeNotification(user, notification);
    }

    @Override
    @Transactional
    public void sendMentoringWorkLogNotification(
            User mentor,
            User student,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringTask task,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog workLog
    ) {
        if (mentor == null || student == null || task == null || workLog == null) {
            return;
        }

        String mentorName = resolveFullName(mentor);
        String taskTitle = task.getTaskTitle() != null ? task.getTaskTitle().trim() : "Nhiệm vụ Mentoring";
        String snippet = taskTitle.length() > 50 ? taskTitle.substring(0, 47) + "..." : taskTitle;

        Notification notification = Notification.builder()
                .recipient(student)
                .sender(mentor)
                .type(NotificationType.MENTORING_WORK_LOG)
                .title("Cập nhật nhật ký công việc Mentoring")
                .content(mentorName + " đã cập nhật nhật ký công việc cho nhiệm vụ \"" + snippet + "\" và đang chờ bạn xác nhận.")
                .targetType("MENTORING_TASK")
                .targetId(String.valueOf(task.getId()))
                .senderCount(1)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        pushRealtimeNotification(student, notification);
        log.info("Đã gửi thông báo Work Log id={} từ Mentor id={} tới Student id={}",
                workLog.getId(), mentor.getId(), student.getId());
    }

    @Override
    @Transactional
    public void sendMentoringWorkLogConfirmedNotification(
            User student,
            User mentor,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringTask task,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog workLog
    ) {
        if (mentor == null || student == null || task == null || workLog == null) {
            return;
        }

        String studentName = resolveFullName(student);
        String taskTitle = task.getTaskTitle() != null ? task.getTaskTitle().trim() : "Nhiệm vụ Mentoring";
        String snippet = taskTitle.length() > 50 ? taskTitle.substring(0, 47) + "..." : taskTitle;

        Notification notification = Notification.builder()
                .recipient(mentor)
                .sender(student)
                .type(NotificationType.MENTORING_WORK_LOG)
                .title("Học viên đã nghiệm thu Work Log")
                .content(studentName + " đã xác nhận nghiệm thu nhật ký công việc ngày " + workLog.getLogDate() + " cho nhiệm vụ \"" + snippet + "\".")
                .targetType("MENTORING_TASK")
                .targetId(String.valueOf(task.getId()))
                .senderCount(1)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        pushRealtimeNotification(mentor, notification);
        log.info("Đã gửi thông báo Work Log id={} được nghiệm thu tới Mentor id={}", workLog.getId(), mentor.getId());
    }

    @Override
    @Transactional
    public void sendMentoringWorkLogRejectedNotification(
            User student,
            User mentor,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringTask task,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog workLog,
            String feedback
    ) {
        if (mentor == null || student == null || task == null || workLog == null) {
            return;
        }

        String studentName = resolveFullName(student);
        String taskTitle = task.getTaskTitle() != null ? task.getTaskTitle().trim() : "Nhiệm vụ Mentoring";
        String snippet = taskTitle.length() > 50 ? taskTitle.substring(0, 47) + "..." : taskTitle;

        Notification notification = Notification.builder()
                .recipient(mentor)
                .sender(student)
                .type(NotificationType.MENTORING_WORK_LOG)
                .title("Yêu cầu điều chỉnh Work Log")
                .content(studentName + " yêu cầu điều chỉnh nhật ký công việc ngày " + workLog.getLogDate() + " cho nhiệm vụ \"" + snippet + "\": " + (feedback != null ? feedback : ""))
                .targetType("MENTORING_TASK")
                .targetId(String.valueOf(task.getId()))
                .senderCount(1)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        pushRealtimeNotification(mentor, notification);
        log.info("Đã gửi thông báo yêu cầu điều chỉnh Work Log id={} tới Mentor id={}", workLog.getId(), mentor.getId());
    }

    @Override
    @Transactional
    public void sendMentoringWorkLogResubmittedNotification(
            User mentor,
            User student,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringTask task,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog workLog
    ) {
        if (mentor == null || student == null || task == null || workLog == null) {
            return;
        }

        String mentorName = resolveFullName(mentor);
        String taskTitle = task.getTaskTitle() != null ? task.getTaskTitle().trim() : "Nhiệm vụ Mentoring";
        String snippet = taskTitle.length() > 50 ? taskTitle.substring(0, 47) + "..." : taskTitle;

        Notification notification = Notification.builder()
                .recipient(student)
                .sender(mentor)
                .type(NotificationType.MENTORING_WORK_LOG)
                .title("Work Log đã được cập nhật")
                .content(mentorName + " đã cập nhật Work Log theo yêu cầu làm rõ cho nhiệm vụ \"" + snippet + "\". Vui lòng xem lại.")
                .targetType("MENTORING_TASK")
                .targetId(String.valueOf(task.getId()))
                .senderCount(1)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        pushRealtimeNotification(student, notification);
        log.info("Đã gửi thông báo cập nhật lại Work Log id={} tới Student id={}", workLog.getId(), student.getId());
    }

    @Override
    @Transactional
    public void sendMentoringTicketAcceptedNotification(
            User admin,
            User student,
            User mentor,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket ticket
    ) {
        if (ticket == null) {
            return;
        }

        String adminName = resolveFullName(admin);
        String taskTitle = (ticket.getTask() != null && ticket.getTask().getTaskTitle() != null)
                ? ticket.getTask().getTaskTitle().trim()
                : "Nhiệm vụ Mentoring";
        String snippet = taskTitle.length() > 50 ? taskTitle.substring(0, 47) + "..." : taskTitle;
        String ticketCode = ticket.getTicketCode() != null ? ticket.getTicketCode() : ("#" + ticket.getId());

        String messageContent = String.format("Quản trị viên %s đã tiếp nhận xử lý vé %s cho nhiệm vụ \"%s\".",
                adminName, ticketCode, snippet);

        // Gửi thông báo cho Student
        if (student != null) {
            Notification notifStudent = Notification.builder()
                    .recipient(student)
                    .sender(admin)
                    .type(NotificationType.MENTORING_TASK)
                    .title("Vé " + ticketCode + " đã được tiếp nhận xử lý")
                    .content(messageContent)
                    .targetType("MENTORING_TICKET")
                    .targetId(String.valueOf(ticket.getId()))
                    .senderCount(1)
                    .isRead(false)
                    .build();
            notifStudent = notificationRepository.save(notifStudent);
            pushRealtimeNotification(student, notifStudent);
            log.info("Đã gửi thông báo tiếp nhận vé id={} tới Student id={}", ticket.getId(), student.getId());
        }

        // Gửi thông báo cho Mentor
        if (mentor != null) {
            Notification notifMentor = Notification.builder()
                    .recipient(mentor)
                    .sender(admin)
                    .type(NotificationType.MENTORING_TASK)
                    .title("Vé " + ticketCode + " đã được tiếp nhận xử lý")
                    .content(messageContent)
                    .targetType("MENTORING_TICKET")
                    .targetId(String.valueOf(ticket.getId()))
                    .senderCount(1)
                    .isRead(false)
                    .build();
            notifMentor = notificationRepository.save(notifMentor);
            pushRealtimeNotification(mentor, notifMentor);
        }
    }

    @Override
    @Transactional
    public void sendMentoringTicketMessageNotification(
            User sender,
            User recipient,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket ticket,
            String messageType,
            String content
    ) {
        if (recipient == null || sender == null || ticket == null) {
            return;
        }

        // Không gửi thông báo cho chính người gửi
        if (recipient.getId().equals(sender.getId())) {
            return;
        }

        String senderName = resolveFullName(sender);
        String ticketCode = ticket.getTicketCode() != null ? ticket.getTicketCode() : ("#" + ticket.getId());
        String title;
        String notifContent;

        if ("MEDIATION_OFFER".equalsIgnoreCase(messageType)) {
            title = "Đề xuất hòa giải mới trên vé " + ticketCode;
            notifContent = senderName + " vừa đưa ra đề xuất phân bổ tiền hòa giải cho nhiệm vụ \""
                    + (ticket.getTask() != null ? ticket.getTask().getTaskTitle() : "") + "\".";
        } else if ("DEADLINE_REQUEST".equalsIgnoreCase(messageType)) {
            title = "Yêu cầu phản hồi trước hạn trên vé " + ticketCode;
            notifContent = senderName + " yêu cầu bổ sung thông tin/bằng chứng cho nhiệm vụ \""
                    + (ticket.getTask() != null ? ticket.getTask().getTaskTitle() : "") + "\".";
        } else {
            title = "Tin nhắn mới trên vé " + ticketCode;
            String preview = (content != null && content.length() > 60)
                    ? content.substring(0, 57) + "..."
                    : (content != null ? content : "");
            notifContent = senderName + ": \"" + preview + "\"";
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .type(NotificationType.MENTORING_TASK)
                .title(title)
                .content(notifContent)
                .targetType("MENTORING_TICKET")
                .targetId(String.valueOf(ticket.getId()))
                .senderCount(1)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        pushRealtimeNotification(recipient, notification);
        log.info("Đã gửi thông báo Ticket message tới User id={}", recipient.getId());
    }

    @Override
    @Transactional
    public void sendMentoringTicketResolvedNotification(
            User admin,
            User student,
            User mentor,
            com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket ticket
    ) {
        if (ticket == null || admin == null) {
            return;
        }

        String adminName = resolveFullName(admin);
        String ticketCode = ticket.getTicketCode() != null ? ticket.getTicketCode() : ("#" + ticket.getId());
        String taskTitle = ticket.getTask() != null ? ticket.getTask().getTaskTitle() : "";
        String decisionText = ticket.getDecision() != null ? ticket.getDecision().name() : "RESOLVED";

        String title = "Phán quyết giải quyết vé " + ticketCode;
        String content = "Quản trị viên " + adminName + " đã ban hành phán quyết chính thức cho nhiệm vụ \""
                + taskTitle + "\" (" + decisionText + "). Vui lòng kiểm tra chi tiết kết quả phân bổ tài chính.";

        if (student != null) {
            Notification notifStudent = Notification.builder()
                    .recipient(student)
                    .sender(admin)
                    .type(NotificationType.MENTORING_TASK)
                    .title(title)
                    .content(content)
                    .targetType("MENTORING_TICKET")
                    .targetId(String.valueOf(ticket.getId()))
                    .senderCount(1)
                    .isRead(false)
                    .build();
            notifStudent = notificationRepository.save(notifStudent);
            pushRealtimeNotification(student, notifStudent);
        }

        if (mentor != null) {
            Notification notifMentor = Notification.builder()
                    .recipient(mentor)
                    .sender(admin)
                    .type(NotificationType.MENTORING_TASK)
                    .title(title)
                    .content(content)
                    .targetType("MENTORING_TICKET")
                    .targetId(String.valueOf(ticket.getId()))
                    .senderCount(1)
                    .isRead(false)
                    .build();
            notifMentor = notificationRepository.save(notifMentor);
            pushRealtimeNotification(mentor, notifMentor);
        }
    }


    /**
     * Đẩy thông báo thời gian thực đến người nhận qua WebSocket STOMP cá nhân.
     */
    private void pushRealtimeNotification(User recipient, Notification notification) {
        if (recipient == null || notification == null) {
            return;
        }
        try {
            NotificationResponse responseDto = notificationMapper.toDto(notification);
            messagingTemplate.convertAndSendToUser(
                    recipient.getId().toString(),
                    WebSocketDestinations.USER_QUEUE_NOTIFICATIONS,
                    responseDto
            );
            log.info("Đã đẩy thông báo WebSocket thành công tới User ID: {}", recipient.getId());
        } catch (Exception e) {
            log.error("Lỗi khi đẩy thông báo WebSocket tới User ID {}: {}", recipient.getId(), e.getMessage());
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    private String resolveFullName(User user) {
        if (user != null && user.getProfile() != null && user.getProfile().getFullName() != null && !user.getProfile().getFullName().isBlank()) {
            return user.getProfile().getFullName().trim();
        }
        return "Một thành viên";
    }
}
