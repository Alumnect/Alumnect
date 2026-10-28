package com.alumnect.alumnect_backend.unit;

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
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.notification.NotificationMapper;
import com.alumnect.alumnect_backend.scheduler.notification.NotificationScheduler;
import com.alumnect.alumnect_backend.service.notification.AdminNotificationService;
import com.alumnect.alumnect_backend.service.notification.NotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-28 Manage Notifications (View & Manage Notifications).
 * Report sheet : FE-28 (Report5_Unit_Test.xlsx)
 * Functions    : NotificationServiceImpl, NotificationScheduler
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-28 Manage Notifications (View & Manage Notifications)")
class FE28_ManageNotificationsTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationMapper notificationMapper;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private AdminNotificationService adminNotificationService;

    // ===== Systems under test =====
    private NotificationServiceImpl notificationService;
    private NotificationScheduler notificationScheduler;

    // ===== Test data =====
    private static final String USER_EMAIL = "user@fpt.edu.vn";
    private static final String GHOST_EMAIL = "ghost@fpt.edu.vn";

    private User recipient;
    private User actor;
    private Post post5;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationServiceImpl(
                notificationRepository,
                userRepository,
                notificationMapper,
                messagingTemplate
        );

        notificationScheduler = new NotificationScheduler(adminNotificationService);

        recipient = User.builder()
                .id(1L)
                .email(USER_EMAIL)
                .profile(UserProfile.builder().fullName("Tran Recipient").build())
                .build();

        actor = User.builder()
                .id(2L)
                .email("actor@fpt.edu.vn")
                .profile(UserProfile.builder().fullName("Nguyen Actor").build())
                .build();

        post5 = Post.builder()
                .id(5L)
                .author(recipient)
                .build();
    }

    // ================= getNotifications() =================

    @Test
    @DisplayName("UTCID01 - User has 2 valid notifications -> PageResponse with 2 NotificationResponse")
    void utcid01_getNotifications_ok() {
        // Given
        Notification n1 = Notification.builder().id(101L).recipient(recipient).build();
        Notification n2 = Notification.builder().id(102L).recipient(recipient).build();
        Page<Notification> notifPage = new PageImpl<>(List.of(n1, n2), PageRequest.of(0, 10), 2);

        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(recipient));
        when(notificationRepository.findValidByRecipientId(eq(1L), any(Instant.class), eq(PageRequest.of(0, 10))))
                .thenReturn(notifPage);
        when(notificationMapper.toDto(n1)).thenReturn(NotificationResponse.builder().id(101L).build());
        when(notificationMapper.toDto(n2)).thenReturn(NotificationResponse.builder().id(102L).build());

        // When
        PageResponse<NotificationResponse> response = notificationService.getNotifications(USER_EMAIL, 0, 10);

        // Then
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getTotalElements()).isEqualTo(2);
        verify(notificationRepository).findValidByRecipientId(eq(1L), any(Instant.class), any(Pageable.class));
    }

    @Test
    @DisplayName("UTCID02 - Invalid paging page = -5, size = 0 -> Clamped to page 0, size 1")
    void utcid02_getNotifications_okClampedPaging() {
        // Given
        Page<Notification> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 1), 0);
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(recipient));
        when(notificationRepository.findValidByRecipientId(eq(1L), any(Instant.class), eq(PageRequest.of(0, 1))))
                .thenReturn(emptyPage);

        // When
        PageResponse<NotificationResponse> response = notificationService.getNotifications(USER_EMAIL, -5, 0);

        // Then
        assertThat(response.getPageNumber()).isZero();
        assertThat(response.getPageSize()).isEqualTo(1);
    }

    @Test
    @DisplayName("UTCID03 - No account for email -> ResourceNotFoundException")
    void utcid03_getNotifications_notFound() {
        // Given
        when(userRepository.findByEmail(GHOST_EMAIL)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> notificationService.getNotifications(GHOST_EMAIL, 0, 10))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng với email: " + GHOST_EMAIL);
    }

    // ================= getUnreadCount() =================

    @Test
    @DisplayName("UTCID04 - User has 7 valid unread notifications -> UnreadNotificationCountResponse(unreadCount = 7)")
    void utcid04_getUnreadCount_ok() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(recipient));
        when(notificationRepository.countValidUnreadByRecipientId(eq(1L), any(Instant.class)))
                .thenReturn(7L);

        // When
        UnreadNotificationCountResponse response = notificationService.getUnreadCount(USER_EMAIL);

        // Then
        assertThat(response.getUnreadCount()).isEqualTo(7L);
    }

    // ================= markAsRead() =================

    @Test
    @DisplayName("UTCID05 - Notification 9 belongs to user -> markAsReadByIdAndRecipientId returns 1")
    void utcid05_markAsRead_ok() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(recipient));
        when(notificationRepository.markAsReadByIdAndRecipientId(9L, 1L)).thenReturn(1);

        // When
        notificationService.markAsRead(USER_EMAIL, 9L);

        // Then
        verify(notificationRepository).markAsReadByIdAndRecipientId(9L, 1L);
    }

    @Test
    @DisplayName("UTCID06 - Notification 404 does not exist or not owned -> ResourceNotFoundException")
    void utcid06_markAsRead_notFound() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(recipient));
        when(notificationRepository.markAsReadByIdAndRecipientId(404L, 1L)).thenReturn(0);

        // When + Then
        assertThatThrownBy(() -> notificationService.markAsRead(USER_EMAIL, 404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy thông báo hoặc bạn không có quyền thao tác.");
    }

    // ================= markAllAsRead() =================

    @Test
    @DisplayName("UTCID07 - User has unread notifications -> markAllAsReadByRecipientId executed")
    void utcid07_markAllAsRead_ok() {
        // Given
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(recipient));
        when(notificationRepository.markAllAsReadByRecipientId(1L)).thenReturn(5);

        // When
        notificationService.markAllAsRead(USER_EMAIL);

        // Then
        verify(notificationRepository).markAllAsReadByRecipientId(1L);
    }

    // ================= sendLikeNotification() =================

    @Test
    @DisplayName("UTCID08 - New like notification -> POST_LIKE created with senderCount 1 and pushed via WS")
    void utcid08_sendLikeNotification_okNew() {
        // Given
        when(notificationRepository.findFirstByRecipientIdAndTypeAndTargetTypeAndTargetIdAndIsReadFalseOrderByCreatedAtDesc(
                1L, NotificationType.POST_LIKE, "POST", "5"))
                .thenReturn(Optional.empty());

        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        notificationService.sendLikeNotification(actor, post5);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getContent()).isEqualTo("Nguyen Actor đã thích bài viết của bạn.");
        assertThat(saved.getSenderCount()).isEqualTo(1);
        assertThat(saved.getRecipient()).isEqualTo(recipient);
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq(WebSocketDestinations.USER_QUEUE_NOTIFICATIONS), any());
    }

    @Test
    @DisplayName("UTCID09 - Unread like notification exists -> senderCount incremented to 2 and content grouped")
    void utcid09_sendLikeNotification_okGrouped() {
        // Given
        Notification existing = Notification.builder()
                .id(20L)
                .recipient(recipient)
                .senderCount(1)
                .type(NotificationType.POST_LIKE)
                .isRead(false)
                .build();

        when(notificationRepository.findFirstByRecipientIdAndTypeAndTargetTypeAndTargetIdAndIsReadFalseOrderByCreatedAtDesc(
                1L, NotificationType.POST_LIKE, "POST", "5"))
                .thenReturn(Optional.of(existing));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        notificationService.sendLikeNotification(actor, post5);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getSenderCount()).isEqualTo(2);
        assertThat(saved.getContent()).isEqualTo("Nguyen Actor và 1 người khác đã thích bài viết của bạn.");
    }

    @Test
    @DisplayName("UTCID10 - Author likes own post -> No notification created")
    void utcid10_sendLikeNotification_okSelfLike() {
        // When
        notificationService.sendLikeNotification(recipient, post5);

        // Then
        verify(notificationRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSendToUser(any(), any(), any());
    }

    @Test
    @DisplayName("UTCID11 - liker is null -> No-op without exception")
    void utcid11_sendLikeNotification_okNullLiker() {
        // When
        notificationService.sendLikeNotification(null, post5);

        // Then
        verify(notificationRepository, never()).save(any());
    }

    // ================= handleUnlikeNotification() =================

    @Test
    @DisplayName("UTCID12 - senderCount = 1 -> Notification row deleted")
    void utcid12_handleUnlikeNotification_okDelete() {
        // Given
        Notification existing = Notification.builder()
                .id(20L)
                .recipient(recipient)
                .senderCount(1)
                .build();

        when(notificationRepository.findFirstByRecipientIdAndTypeAndTargetTypeAndTargetIdAndIsReadFalseOrderByCreatedAtDesc(
                1L, NotificationType.POST_LIKE, "POST", "5"))
                .thenReturn(Optional.of(existing));

        // When
        notificationService.handleUnlikeNotification(actor, post5);

        // Then
        verify(notificationRepository).delete(existing);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID13 - senderCount = 2 -> senderCount decremented to 1 and content updated")
    void utcid13_handleUnlikeNotification_okDecrementedToOne() {
        // Given
        Notification existing = Notification.builder()
                .id(20L)
                .recipient(recipient)
                .senderCount(2)
                .build();

        when(notificationRepository.findFirstByRecipientIdAndTypeAndTargetTypeAndTargetIdAndIsReadFalseOrderByCreatedAtDesc(
                1L, NotificationType.POST_LIKE, "POST", "5"))
                .thenReturn(Optional.of(existing));

        // When
        notificationService.handleUnlikeNotification(actor, post5);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getSenderCount()).isEqualTo(1);
        assertThat(saved.getContent()).isEqualTo("Một thành viên đã thích bài viết của bạn.");
    }

    @Test
    @DisplayName("UTCID14 - senderCount = 4 -> senderCount decremented to 3 and content updated")
    void utcid14_handleUnlikeNotification_okDecrementedToMultiple() {
        // Given
        Notification existing = Notification.builder()
                .id(20L)
                .recipient(recipient)
                .senderCount(4)
                .build();

        when(notificationRepository.findFirstByRecipientIdAndTypeAndTargetTypeAndTargetIdAndIsReadFalseOrderByCreatedAtDesc(
                1L, NotificationType.POST_LIKE, "POST", "5"))
                .thenReturn(Optional.of(existing));

        // When
        notificationService.handleUnlikeNotification(actor, post5);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getSenderCount()).isEqualTo(3);
        assertThat(saved.getContent()).isEqualTo("Một thành viên và 2 người khác đã thích bài viết của bạn.");
    }

    // ================= sendCommentNotification() =================

    @Test
    @DisplayName("UTCID15 - Comment on author post -> POST_COMMENT notification created with targetId 5#comment-8")
    void utcid15_sendCommentNotification_ok() {
        // Given
        Comment comment = Comment.builder().id(8L).content("Great post").build();
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        notificationService.sendCommentNotification(actor, comment, post5);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(NotificationType.POST_COMMENT);
        assertThat(saved.getTargetId()).isEqualTo("5#comment-8");
        assertThat(saved.getContent()).contains("Nguyen Actor đã bình luận về bài viết của bạn: \"Great post\"");
    }

    @Test
    @DisplayName("UTCID16 - Comment length = 60 -> Whole text shown without truncation")
    void utcid16_sendCommentNotification_okMaxLen() {
        // Given
        String text60 = "a".repeat(60);
        Comment comment = Comment.builder().id(8L).content(text60).build();
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        notificationService.sendCommentNotification(actor, comment, post5);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getContent()).contains("\"" + text60 + "\"");
        assertThat(captor.getValue().getContent()).doesNotContain("...");
    }

    @Test
    @DisplayName("UTCID17 - Comment length = 61 -> Text truncated to 57 chars plus '...'")
    void utcid17_sendCommentNotification_okTruncated() {
        // Given
        String text61 = "a".repeat(61);
        Comment comment = Comment.builder().id(8L).content(text61).build();
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        notificationService.sendCommentNotification(actor, comment, post5);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        String expectedSnippet = "a".repeat(57) + "...";
        assertThat(captor.getValue().getContent()).contains("\"" + expectedSnippet + "\"");
    }

    @Test
    @DisplayName("UTCID18 - Author comments on own post -> No notification created")
    void utcid18_sendCommentNotification_okSelfComment() {
        // Given
        Comment comment = Comment.builder().id(8L).content("Self comment").build();

        // When
        notificationService.sendCommentNotification(recipient, comment, post5);

        // Then
        verify(notificationRepository, never()).save(any());
    }

    // ================= sendFollowNotification() =================

    @Test
    @DisplayName("UTCID19 - Actor follows author -> USER_FOLLOW notification created and pushed")
    void utcid19_sendFollowNotification_ok() {
        // Given
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        notificationService.sendFollowNotification(actor, recipient);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(NotificationType.USER_FOLLOW);
        assertThat(saved.getTargetType()).isEqualTo("USER");
        assertThat(saved.getTargetId()).isEqualTo("2");
        assertThat(saved.getContent()).isEqualTo("Nguyen Actor đã bắt đầu theo dõi bạn.");
        verify(messagingTemplate).convertAndSendToUser(eq("1"), eq(WebSocketDestinations.USER_QUEUE_NOTIFICATIONS), any());
    }

    @Test
    @DisplayName("UTCID20 - Follower equals following -> No notification created")
    void utcid20_sendFollowNotification_okSelfFollow() {
        // When
        notificationService.sendFollowNotification(recipient, recipient);

        // Then
        verify(notificationRepository, never()).save(any());
    }

    // ================= sendAnswerNotification() =================

    @Test
    @DisplayName("UTCID21 - Question title 60 chars -> Truncated to 47 chars plus '...' (limit 50)")
    void utcid21_sendAnswerNotification_ok() {
        // Given
        String title60 = "b".repeat(60);
        Question question = Question.builder().id(30L).author(recipient).title(title60).build();
        Answer answer = Answer.builder().id(40L).author(actor).build();
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        notificationService.sendAnswerNotification(actor, question, answer);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(NotificationType.FORUM_ANSWER);
        String expectedSnippet = "b".repeat(47) + "...";
        assertThat(saved.getContent()).contains("\"" + expectedSnippet + "\"");
    }

    @Test
    @DisplayName("UTCID22 - Author answers own question -> No notification created")
    void utcid22_sendAnswerNotification_okSelfAnswer() {
        // Given
        Question question = Question.builder().id(30L).author(recipient).title("Question?").build();
        Answer answer = Answer.builder().id(40L).author(recipient).build();

        // When
        notificationService.sendAnswerNotification(recipient, question, answer);

        // Then
        verify(notificationRepository, never()).save(any());
    }

    // ================= sendReportResolvedNotification() =================

    @Test
    @DisplayName("UTCID23 - Post removed -> REPORT_RESOLVED notification sent by system (sender null)")
    void utcid23_sendReportResolvedNotification_ok() {
        // Given
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        notificationService.sendReportResolvedNotification(post5);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(NotificationType.REPORT_RESOLVED);
        assertThat(saved.getSender()).isNull();
        assertThat(saved.getContent()).isEqualTo("Bài viết của bạn đã bị gỡ do vi phạm tiêu chuẩn cộng đồng.");
    }

    // ================= sendWelcomeNotification() =================

    @Test
    @DisplayName("UTCID24 - New user without welcome notification -> WELCOME created and pushed")
    void utcid24_sendWelcomeNotification_ok() {
        // Given
        when(notificationRepository.findFirstByRecipientIdAndTypeAndTargetTypeAndTargetIdAndIsReadFalseOrderByCreatedAtDesc(
                1L, NotificationType.WELCOME, "SYSTEM", "WELCOME"))
                .thenReturn(Optional.empty());
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        notificationService.sendWelcomeNotification(recipient);

        // Then
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertThat(saved.getType()).isEqualTo(NotificationType.WELCOME);
        assertThat(saved.getTargetType()).isEqualTo("SYSTEM");
        assertThat(saved.getTargetId()).isEqualTo("WELCOME");
    }

    @Test
    @DisplayName("UTCID25 - Unread WELCOME notification already exists -> No duplicate created")
    void utcid25_sendWelcomeNotification_okAlreadyExists() {
        // Given
        Notification existing = Notification.builder().id(99L).build();
        when(notificationRepository.findFirstByRecipientIdAndTypeAndTargetTypeAndTargetIdAndIsReadFalseOrderByCreatedAtDesc(
                1L, NotificationType.WELCOME, "SYSTEM", "WELCOME"))
                .thenReturn(Optional.of(existing));

        // When
        notificationService.sendWelcomeNotification(recipient);

        // Then
        verify(notificationRepository, never()).save(any());
    }

    // ================= pushRealtimeNotification() error handling =================

    @Test
    @DisplayName("UTCID26 - WebSocket throws error -> Suppressed and notification still saved")
    void utcid26_sendFollowNotification_okWsErrorSuppressed() {
        // Given
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("WebSocket broker down"))
                .when(messagingTemplate).convertAndSendToUser(any(), any(), any());

        // When + Then
        notificationService.sendFollowNotification(actor, recipient);

        verify(notificationRepository).save(any(Notification.class));
    }

    // ================= NotificationScheduler =================

    @Test
    @DisplayName("UTCID27 - Cron tick -> executeScheduledNotifications and expireOverdueNotifications invoked")
    void utcid27_processScheduled_ok() {
        // When
        notificationScheduler.processScheduledAndExpiredNotifications();

        // Then
        verify(adminNotificationService).executeScheduledNotifications();
        verify(adminNotificationService).expireOverdueNotifications();
    }

    @Test
    @DisplayName("UTCID28 - executeScheduledNotifications throws -> Logged and expireOverdueNotifications still runs")
    void utcid28_processScheduled_exceptionHandled() {
        // Given
        doThrow(new RuntimeException("DB timeout")).when(adminNotificationService).executeScheduledNotifications();

        // When
        notificationScheduler.processScheduledAndExpiredNotifications();

        // Then
        verify(adminNotificationService).executeScheduledNotifications();
        verify(adminNotificationService).expireOverdueNotifications();
    }
}
