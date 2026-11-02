package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.constant.WebSocketDestinations;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.NotificationDuration;
import com.alumnect.alumnect_backend.common.enums.RecipientType;
import com.alumnect.alumnect_backend.common.enums.SystemNotificationStatus;
import com.alumnect.alumnect_backend.dao.notification.NotificationRepository;
import com.alumnect.alumnect_backend.dao.notification.SystemNotificationRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.notification.CreateSystemNotificationRequest;
import com.alumnect.alumnect_backend.dto.response.notification.NotificationResponse;
import com.alumnect.alumnect_backend.dto.response.notification.SystemNotificationResponse;
import com.alumnect.alumnect_backend.entity.notification.Notification;
import com.alumnect.alumnect_backend.entity.notification.SystemNotification;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.notification.NotificationMapper;
import com.alumnect.alumnect_backend.mapper.notification.SystemNotificationMapper;
import com.alumnect.alumnect_backend.service.notification.AdminNotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-19_Broadcast & System Notifications Management.
 * Report sheet : FE-19 (Report5_Unit_Test.xlsx)
 * Functions    : AdminNotificationServiceImpl.getSystemNotifications(),
 *                AdminNotificationServiceImpl.createSystemNotification(),
 *                AdminNotificationServiceImpl.cancelScheduledNotification(),
 *                AdminNotificationServiceImpl.archiveNotification(),
 *                AdminNotificationServiceImpl.executeScheduledNotifications(),
 *                AdminNotificationServiceImpl.expireOverdueNotifications()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-19 Broadcast & System Notifications Management")
class FE19_BroadcastNotificationTest {

    @Mock
    private SystemNotificationRepository systemNotificationRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SystemNotificationMapper systemNotificationMapper;

    @Mock
    private NotificationMapper notificationMapper;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private AdminNotificationServiceImpl adminNotificationService;

    private User admin;
    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        admin = User.builder()
                .id(1L)
                .email("admin@fpt.edu.vn")
                .role(Role.builder().name("ADMIN").build())
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        user1 = User.builder()
                .id(11L)
                .email("user1@fpt.edu.vn")
                .role(Role.builder().name("STUDENT").build())
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        user2 = User.builder()
                .id(12L)
                .email("user2@fpt.edu.vn")
                .role(Role.builder().name("ALUMNI").build())
                .accountStatus(AccountStatus.ACTIVE)
                .build();
    }

    // ================= createSystemNotification =================

    @Test
    @DisplayName("UTCID01 - create instant broadcast -> trims title/content, SENT status, sentAt set, 2 notifications pushed")
    void utcid01_create_instantAllUsers() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));
        when(userRepository.findByAccountStatus(AccountStatus.ACTIVE)).thenReturn(List.of(user1, user2));

        doAnswer(inv -> {
            SystemNotification sn = inv.getArgument(0);
            sn.setId(100L);
            return sn;
        }).when(systemNotificationRepository).save(any(SystemNotification.class));

        doAnswer(inv -> inv.getArgument(0)).when(notificationRepository).saveAll(anyList());
        when(systemNotificationMapper.toDto(any(SystemNotification.class))).thenReturn(SystemNotificationResponse.builder().id(100L).build());

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .title("  Server Maintenance  ")
                .content("  Scheduled tonight  ")
                .recipientType(RecipientType.ALL_USERS)
                .durationType(NotificationDuration.ONE_DAY)
                .isScheduled(false)
                .build();

        // When
        SystemNotificationResponse response = adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<SystemNotification> snCaptor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(snCaptor.capture());
        SystemNotification savedSn = snCaptor.getValue();
        assertThat(savedSn.getTitle()).isEqualTo("Server Maintenance");
        assertThat(savedSn.getContent()).isEqualTo("Scheduled tonight");
        assertThat(savedSn.getStatus()).isEqualTo(SystemNotificationStatus.SENT);
        assertThat(savedSn.getSentAt()).isNotNull();
        assertThat(savedSn.getExpiresAt()).isNotNull();

        verify(notificationRepository).saveAll(anyList());
        verify(messagingTemplate, times(2)).convertAndSendToUser(any(), eq(WebSocketDestinations.USER_QUEUE_NOTIFICATIONS), any());
    }

    @Test
    @DisplayName("UTCID02 - recipientType=USER_ROLE, recipientRole=' alumni ' -> role ALUMNI, ONE_WEEK duration")
    void utcid02_create_userRoleCaseInsensitive() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));
        when(userRepository.findByRoleNameAndAccountStatus("ALUMNI", AccountStatus.ACTIVE)).thenReturn(List.of(user2));

        doAnswer(inv -> {
            SystemNotification sn = inv.getArgument(0);
            sn.setId(101L);
            return sn;
        }).when(systemNotificationRepository).save(any(SystemNotification.class));
        doAnswer(inv -> inv.getArgument(0)).when(notificationRepository).saveAll(anyList());
        when(systemNotificationMapper.toDto(any(SystemNotification.class))).thenReturn(SystemNotificationResponse.builder().id(101L).build());

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .title("Alumni Announcement")
                .content("Welcome alumni")
                .recipientType(RecipientType.USER_ROLE)
                .recipientRole(" alumni ")
                .durationType(NotificationDuration.ONE_WEEK)
                .isScheduled(false)
                .build();

        // When
        adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req);

        // Then
        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        assertThat(captor.getValue().getRecipientRole()).isEqualTo("ALUMNI");
        verify(userRepository).findByRoleNameAndAccountStatus("ALUMNI", AccountStatus.ACTIVE);
    }

    @Test
    @DisplayName("UTCID03 - recipientType=SPECIFIC_USER -> exactly one notification saved for user 11")
    void utcid03_create_specificUser() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));
        when(userRepository.findById(11L)).thenReturn(Optional.of(user1));

        doAnswer(inv -> {
            SystemNotification sn = inv.getArgument(0);
            sn.setId(102L);
            return sn;
        }).when(systemNotificationRepository).save(any(SystemNotification.class));
        doAnswer(inv -> inv.getArgument(0)).when(notificationRepository).saveAll(anyList());
        when(systemNotificationMapper.toDto(any(SystemNotification.class))).thenReturn(SystemNotificationResponse.builder().id(102L).build());

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .title("Personal Notice")
                .content("Dear student")
                .recipientType(RecipientType.SPECIFIC_USER)
                .recipientUserId(11L)
                .durationType(NotificationDuration.ONE_DAY)
                .isScheduled(false)
                .build();

        // When
        adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req);

        // Then
        ArgumentCaptor<List<Notification>> listCaptor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository).saveAll(listCaptor.capture());
        assertThat(listCaptor.getValue()).hasSize(1);
        assertThat(listCaptor.getValue().get(0).getRecipient().getId()).isEqualTo(11L);
    }

    @Test
    @DisplayName("UTCID04 - isScheduled=true -> SCHEDULED status, sentAt=null, nothing dispatched")
    void utcid04_create_scheduled() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));
        Instant scheduledAt = Instant.now().plus(2, ChronoUnit.HOURS);

        doAnswer(inv -> inv.getArgument(0)).when(systemNotificationRepository).save(any(SystemNotification.class));
        when(systemNotificationMapper.toDto(any(SystemNotification.class))).thenReturn(SystemNotificationResponse.builder().build());

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .title("Scheduled Event")
                .content("Starts soon")
                .recipientType(RecipientType.ALL_USERS)
                .durationType(NotificationDuration.ONE_DAY)
                .isScheduled(true)
                .scheduledAt(scheduledAt)
                .build();

        // When
        adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req);

        // Then
        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        SystemNotification sn = captor.getValue();
        assertThat(sn.getStatus()).isEqualTo(SystemNotificationStatus.SCHEDULED);
        assertThat(sn.getSentAt()).isNull();
        assertThat(sn.getExpiresAt()).isNotNull();
        verify(notificationRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("UTCID05 - durationType=FOREVER -> expiresAt is null")
    void utcid05_create_foreverDuration() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));
        when(userRepository.findByAccountStatus(AccountStatus.ACTIVE)).thenReturn(List.of(user1));

        doAnswer(inv -> inv.getArgument(0)).when(systemNotificationRepository).save(any(SystemNotification.class));
        when(systemNotificationMapper.toDto(any(SystemNotification.class))).thenReturn(SystemNotificationResponse.builder().build());

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .title("Permanent")
                .content("Rules")
                .recipientType(RecipientType.ALL_USERS)
                .durationType(NotificationDuration.FOREVER)
                .isScheduled(false)
                .build();

        // When
        adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req);

        // Then
        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        assertThat(captor.getValue().getExpiresAt()).isNull();
    }

    @Test
    @DisplayName("UTCID06 - durationType=CUSTOM -> expiresAt kept as provided")
    void utcid06_create_customDuration() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));
        when(userRepository.findByAccountStatus(AccountStatus.ACTIVE)).thenReturn(List.of(user1));

        Instant customExpires = Instant.now().plus(3, ChronoUnit.DAYS);
        doAnswer(inv -> inv.getArgument(0)).when(systemNotificationRepository).save(any(SystemNotification.class));
        when(systemNotificationMapper.toDto(any(SystemNotification.class))).thenReturn(SystemNotificationResponse.builder().build());

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .title("Custom Duration")
                .content("Text")
                .recipientType(RecipientType.ALL_USERS)
                .durationType(NotificationDuration.CUSTOM)
                .expiresAt(customExpires)
                .isScheduled(false)
                .build();

        // When
        adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req);

        // Then
        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        assertThat(captor.getValue().getExpiresAt()).isEqualTo(customExpires);
    }

    @Test
    @DisplayName("UTCID07 - No admin account -> ResourceNotFoundException")
    void utcid07_create_adminNotFound() {
        // Given
        when(userRepository.findByEmail("ghost@fpt.edu.vn")).thenReturn(Optional.empty());

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder().build();

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.createSystemNotification("ghost@fpt.edu.vn", req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản quản trị viên.");
    }

    @Test
    @DisplayName("UTCID08 - SPECIFIC_USER with recipientUserId=null -> BadRequestException")
    void utcid08_create_specificUserNullId() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .recipientType(RecipientType.SPECIFIC_USER)
                .recipientUserId(null)
                .build();

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vui lòng chọn người dùng nhận thông báo.");
    }

    @Test
    @DisplayName("UTCID09 - SPECIFIC_USER user 404 not found -> ResourceNotFoundException")
    void utcid09_create_specificUserNotFound() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));
        when(userRepository.findById(404L)).thenReturn(Optional.empty());

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .recipientType(RecipientType.SPECIFIC_USER)
                .recipientUserId(404L)
                .build();

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng với ID: 404");
    }

    @Test
    @DisplayName("UTCID10 - USER_ROLE with blank role -> BadRequestException")
    void utcid10_create_blankRole() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .recipientType(RecipientType.USER_ROLE)
                .recipientRole("  ")
                .build();

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vui lòng chọn nhóm vai trò nhận thông báo.");
    }

    @Test
    @DisplayName("UTCID11 - isScheduled=true but scheduledAt=null -> BadRequestException")
    void utcid11_create_scheduledAtNull() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .recipientType(RecipientType.ALL_USERS)
                .isScheduled(true)
                .scheduledAt(null)
                .build();

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vui lòng chọn thời điểm hẹn giờ gửi.");
    }

    @Test
    @DisplayName("UTCID12 - isScheduled=true with past scheduledAt -> BadRequestException")
    void utcid12_create_scheduledAtInPast() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .recipientType(RecipientType.ALL_USERS)
                .isScheduled(true)
                .scheduledAt(Instant.now().minusSeconds(5))
                .build();

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thời điểm hẹn giờ gửi phải nằm ở tương lai.");
    }

    @Test
    @DisplayName("UTCID13 - durationType=CUSTOM with expiresAt=null -> BadRequestException")
    void utcid13_create_customExpiresAtNull() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .recipientType(RecipientType.ALL_USERS)
                .durationType(NotificationDuration.CUSTOM)
                .expiresAt(null)
                .build();

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vui lòng chọn ngày và giờ hết hạn cụ thể khi chọn thời hạn tùy chỉnh.");
    }

    @Test
    @DisplayName("UTCID14 - CUSTOM expiresAt not after effective sent time -> BadRequestException")
    void utcid14_create_expiresAtNotAfterSentTime() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));
        Instant scheduledAt = Instant.now().plus(1, ChronoUnit.HOURS);

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .recipientType(RecipientType.ALL_USERS)
                .isScheduled(true)
                .scheduledAt(scheduledAt)
                .durationType(NotificationDuration.CUSTOM)
                .expiresAt(scheduledAt)
                .build();

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thời điểm hết hiệu lực (expiresAt) phải sau thời điểm gửi.");
    }

    @Test
    @DisplayName("UTCID15 - No active recipients for target role -> SystemNotification SENT but no Notification created")
    void utcid15_create_noActiveRecipients() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));
        when(userRepository.findByRoleNameAndAccountStatus("STUDENT", AccountStatus.ACTIVE)).thenReturn(Collections.emptyList());

        doAnswer(inv -> {
            SystemNotification sn = inv.getArgument(0);
            sn.setId(500L);
            return sn;
        }).when(systemNotificationRepository).save(any(SystemNotification.class));
        when(systemNotificationMapper.toDto(any(SystemNotification.class))).thenReturn(SystemNotificationResponse.builder().id(500L).build());

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .title("Role Notice")
                .content("Content")
                .recipientType(RecipientType.USER_ROLE)
                .recipientRole("STUDENT")
                .durationType(NotificationDuration.ONE_DAY)
                .isScheduled(false)
                .build();

        // When
        adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req);

        // Then
        verify(notificationRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("UTCID16 - WebSocket push throws for recipient -> notifications still saved, no exception propagated")
    void utcid16_create_webSocketErrorHandled() {
        // Given
        when(userRepository.findByEmail("admin@fpt.edu.vn")).thenReturn(Optional.of(admin));
        when(userRepository.findByAccountStatus(AccountStatus.ACTIVE)).thenReturn(List.of(user1));

        doAnswer(inv -> {
            SystemNotification sn = inv.getArgument(0);
            sn.setId(103L);
            return sn;
        }).when(systemNotificationRepository).save(any(SystemNotification.class));

        Notification notif = Notification.builder().id(201L).recipient(user1).build();
        when(notificationRepository.saveAll(anyList())).thenReturn(List.of(notif));
        when(notificationMapper.toDto(notif)).thenReturn(NotificationResponse.builder().build());

        doThrow(new RuntimeException("WebSocket broken")).when(messagingTemplate).convertAndSendToUser(any(), any(), any());
        when(systemNotificationMapper.toDto(any(SystemNotification.class))).thenReturn(SystemNotificationResponse.builder().id(103L).build());

        CreateSystemNotificationRequest req = CreateSystemNotificationRequest.builder()
                .title("Notice")
                .content("Content")
                .recipientType(RecipientType.ALL_USERS)
                .durationType(NotificationDuration.ONE_DAY)
                .isScheduled(false)
                .build();

        // When
        SystemNotificationResponse res = adminNotificationService.createSystemNotification("admin@fpt.edu.vn", req);

        // Then
        assertThat(res).isNotNull();
        verify(notificationRepository).saveAll(anyList());
    }

    // ================= cancelScheduledNotification =================

    @Test
    @DisplayName("UTCID17 - SCHEDULED notification 7 -> cancelled successfully")
    void utcid17_cancelScheduled_success() {
        // Given
        SystemNotification sn = SystemNotification.builder().id(7L).status(SystemNotificationStatus.SCHEDULED).build();
        when(systemNotificationRepository.findById(7L)).thenReturn(Optional.of(sn));

        // When
        adminNotificationService.cancelScheduledNotification("admin@fpt.edu.vn", 7L);

        // Then
        assertThat(sn.getStatus()).isEqualTo(SystemNotificationStatus.CANCELLED);
        verify(systemNotificationRepository).save(sn);
    }

    @Test
    @DisplayName("UTCID18 - SENT notification 7 -> cannot cancel, BadRequestException")
    void utcid18_cancelScheduled_alreadySent() {
        // Given
        SystemNotification sn = SystemNotification.builder().id(7L).status(SystemNotificationStatus.SENT).build();
        when(systemNotificationRepository.findById(7L)).thenReturn(Optional.of(sn));

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.cancelScheduledNotification("admin@fpt.edu.vn", 7L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Chỉ có thể hủy thông báo đang ở trạng thái hẹn giờ (SCHEDULED).");
    }

    @Test
    @DisplayName("UTCID19 - Notification 404 not found -> ResourceNotFoundException")
    void utcid19_cancelScheduled_notFound() {
        // Given
        when(systemNotificationRepository.findById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.cancelScheduledNotification("admin@fpt.edu.vn", 404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy thông báo hệ thống ID: 404");
    }

    // ================= archiveNotification =================

    @Test
    @DisplayName("UTCID20 - SENT notification 7 -> archived successfully with archivedAt")
    void utcid20_archive_success() {
        // Given
        SystemNotification sn = SystemNotification.builder().id(7L).status(SystemNotificationStatus.SENT).build();
        when(systemNotificationRepository.findById(7L)).thenReturn(Optional.of(sn));

        // When
        adminNotificationService.archiveNotification("admin@fpt.edu.vn", 7L);

        // Then
        assertThat(sn.getStatus()).isEqualTo(SystemNotificationStatus.ARCHIVED);
        assertThat(sn.getArchivedAt()).isNotNull();
        verify(systemNotificationRepository).save(sn);
    }

    @Test
    @DisplayName("UTCID21 - SCHEDULED notification 7 -> cannot archive, BadRequestException")
    void utcid21_archive_scheduledCannotArchive() {
        // Given
        SystemNotification sn = SystemNotification.builder().id(7L).status(SystemNotificationStatus.SCHEDULED).build();
        when(systemNotificationRepository.findById(7L)).thenReturn(Optional.of(sn));

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.archiveNotification("admin@fpt.edu.vn", 7L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Không thể lưu trữ thông báo đang hẹn giờ gửi. Vui lòng hủy lịch nếu không muốn phát hành.");
    }

    @Test
    @DisplayName("UTCID22 - ARCHIVED notification 7 -> already archived, BadRequestException")
    void utcid22_archive_alreadyArchived() {
        // Given
        SystemNotification sn = SystemNotification.builder().id(7L).status(SystemNotificationStatus.ARCHIVED).build();
        when(systemNotificationRepository.findById(7L)).thenReturn(Optional.of(sn));

        // When + Then
        assertThatThrownBy(() -> adminNotificationService.archiveNotification("admin@fpt.edu.vn", 7L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thông báo này đã được lưu trữ trong kho lưu trữ trước đó.");
    }

    // ================= executeScheduledNotifications =================

    @Test
    @DisplayName("UTCID23 - SCHEDULED notification due -> becomes SENT and delivered to all active users")
    void utcid23_executeScheduled_dueProcessed() {
        // Given
        SystemNotification sn = SystemNotification.builder()
                .id(1L)
                .title("Due")
                .content("Now")
                .recipientType(RecipientType.ALL_USERS)
                .durationType(NotificationDuration.ONE_DAY)
                .status(SystemNotificationStatus.SCHEDULED)
                .createdBy(admin)
                .build();

        when(systemNotificationRepository.findByStatusAndScheduledAtLessThanEqual(eq(SystemNotificationStatus.SCHEDULED), any(Instant.class)))
                .thenReturn(List.of(sn));
        when(userRepository.findByAccountStatus(AccountStatus.ACTIVE)).thenReturn(List.of(user1));

        // When
        adminNotificationService.executeScheduledNotifications();

        // Then
        assertThat(sn.getStatus()).isEqualTo(SystemNotificationStatus.SENT);
        assertThat(sn.getSentAt()).isNotNull();
        assertThat(sn.getExpiresAt()).isNotNull();
        verify(notificationRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("UTCID24 - No scheduled notification is due -> nothing saved or dispatched")
    void utcid24_executeScheduled_noDueNotifications() {
        // Given
        when(systemNotificationRepository.findByStatusAndScheduledAtLessThanEqual(eq(SystemNotificationStatus.SCHEDULED), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        // When
        adminNotificationService.executeScheduledNotifications();

        // Then
        verify(notificationRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("UTCID25 - Two due notifications, first one fails -> second one is still processed")
    void utcid25_executeScheduled_partialFailure() {
        // Given
        SystemNotification sn1 = SystemNotification.builder()
                .id(1L)
                .title("Fail")
                .recipientType(RecipientType.ALL_USERS)
                .durationType(NotificationDuration.ONE_DAY)
                .status(SystemNotificationStatus.SCHEDULED)
                .createdBy(admin)
                .build();

        SystemNotification sn2 = SystemNotification.builder()
                .id(2L)
                .title("Success")
                .recipientType(RecipientType.ALL_USERS)
                .durationType(NotificationDuration.ONE_DAY)
                .status(SystemNotificationStatus.SCHEDULED)
                .createdBy(admin)
                .build();

        when(systemNotificationRepository.findByStatusAndScheduledAtLessThanEqual(eq(SystemNotificationStatus.SCHEDULED), any(Instant.class)))
                .thenReturn(List.of(sn1, sn2));

        // First call to findByAccountStatus throws, second succeeds
        when(userRepository.findByAccountStatus(AccountStatus.ACTIVE))
                .thenThrow(new RuntimeException("DB glitch"))
                .thenReturn(List.of(user1));

        // When
        adminNotificationService.executeScheduledNotifications();

        // Then
        assertThat(sn2.getStatus()).isEqualTo(SystemNotificationStatus.SENT);
    }

    // ================= expireOverdueNotifications =================

    @Test
    @DisplayName("UTCID26 - Overdue notifications marked EXPIRED and saved via saveAll")
    void utcid26_expireOverdue_savedAll() {
        // Given
        SystemNotification sn1 = SystemNotification.builder().id(1L).status(SystemNotificationStatus.SENT).build();
        SystemNotification sn2 = SystemNotification.builder().id(2L).status(SystemNotificationStatus.ACTIVE).build();
        when(systemNotificationRepository.findByStatusInAndExpiresAtLessThanEqual(anyList(), any(Instant.class)))
                .thenReturn(List.of(sn1, sn2));

        // When
        adminNotificationService.expireOverdueNotifications();

        // Then
        assertThat(sn1.getStatus()).isEqualTo(SystemNotificationStatus.EXPIRED);
        assertThat(sn2.getStatus()).isEqualTo(SystemNotificationStatus.EXPIRED);
        verify(systemNotificationRepository).saveAll(List.of(sn1, sn2));
    }

    @Test
    @DisplayName("UTCID27 - No overdue notifications -> saveAll not called")
    void utcid27_expireOverdue_emptySkipsSaveAll() {
        // Given
        when(systemNotificationRepository.findByStatusInAndExpiresAtLessThanEqual(anyList(), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        // When
        adminNotificationService.expireOverdueNotifications();

        // Then
        verify(systemNotificationRepository, never()).saveAll(anyList());
    }

    // ================= getSystemNotifications =================

    @Test
    @DisplayName("UTCID28 - Filter 'THIS_WEEK' matches 2 notifications -> PageResponse with 2 DTOs")
    @SuppressWarnings("unchecked")
    void utcid28_getSystemNotifications_twoMatches() {
        // Given
        SystemNotification sn1 = SystemNotification.builder().id(1L).build();
        SystemNotification sn2 = SystemNotification.builder().id(2L).build();
        Page<SystemNotification> page = new PageImpl<>(List.of(sn1, sn2), Pageable.ofSize(10), 2);
        when(systemNotificationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        SystemNotificationResponse r1 = SystemNotificationResponse.builder().id(1L).build();
        SystemNotificationResponse r2 = SystemNotificationResponse.builder().id(2L).build();
        when(systemNotificationMapper.toDto(sn1)).thenReturn(r1);
        when(systemNotificationMapper.toDto(sn2)).thenReturn(r2);

        // When
        PageResponse<SystemNotificationResponse> result = adminNotificationService.getSystemNotifications(
                "THIS_WEEK", SystemNotificationStatus.SENT, 0, 10
        );

        // Then
        assertThat(result.getContent()).hasSize(2);
    }

    @Test
    @DisplayName("UTCID29 - Invalid paging (-1, 0) clamped to page 0 size 1 -> empty PageResponse without exception")
    @SuppressWarnings("unchecked")
    void utcid29_getSystemNotifications_clampedPaging() {
        // Given
        Page<SystemNotification> emptyPage = new PageImpl<>(Collections.emptyList(), Pageable.ofSize(1), 0);
        when(systemNotificationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        // When
        PageResponse<SystemNotificationResponse> result = adminNotificationService.getSystemNotifications(
                "TODAY", null, -1, 0
        );

        // Then
        assertThat(result.getContent()).isEmpty();
    }
}
