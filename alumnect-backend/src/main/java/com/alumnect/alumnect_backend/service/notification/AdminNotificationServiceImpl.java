package com.alumnect.alumnect_backend.service.notification;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.constant.WebSocketDestinations;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.NotificationDuration;
import com.alumnect.alumnect_backend.common.enums.NotificationType;
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
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.notification.NotificationMapper;
import com.alumnect.alumnect_backend.mapper.notification.SystemNotificationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Triển khai dịch vụ quản lý và xử lý thông báo hệ thống của Admin.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminNotificationServiceImpl implements AdminNotificationService {

    private final SystemNotificationRepository systemNotificationRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SystemNotificationMapper systemNotificationMapper;
    private final NotificationMapper notificationMapper;
    private final SimpMessagingTemplate messagingTemplate;

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Override
    @Transactional(readOnly = true)
    public PageResponse<SystemNotificationResponse> getSystemNotifications(
            String timeFilter,
            SystemNotificationStatus status,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));

        Instant startDate = null;
        Instant endDate = null;
        LocalDate today = LocalDate.now(VN_ZONE);

        if ("TODAY".equalsIgnoreCase(timeFilter)) {
            startDate = today.atStartOfDay(VN_ZONE).toInstant();
            endDate = today.plusDays(1).atStartOfDay(VN_ZONE).toInstant();
        } else if ("THIS_WEEK".equalsIgnoreCase(timeFilter)) {
            LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
            startDate = startOfWeek.atStartOfDay(VN_ZONE).toInstant();
            endDate = endOfWeek.plusDays(1).atStartOfDay(VN_ZONE).toInstant();
        } else if ("THIS_MONTH".equalsIgnoreCase(timeFilter)) {
            LocalDate startOfMonth = today.with(TemporalAdjusters.firstDayOfMonth());
            LocalDate endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());
            startDate = startOfMonth.atStartOfDay(VN_ZONE).toInstant();
            endDate = endOfMonth.plusDays(1).atStartOfDay(VN_ZONE).toInstant();
        }

        org.springframework.data.jpa.domain.Specification<SystemNotification> spec =
                com.alumnect.alumnect_backend.specification.notification.SystemNotificationSpecification.filter(startDate, endDate, status);
        Page<SystemNotification> resultPage = systemNotificationRepository.findAll(spec, pageable);
        List<SystemNotificationResponse> dtoList = resultPage.getContent().stream()
                .map(systemNotificationMapper::toDto)
                .collect(Collectors.toList());

        return PageResponse.<SystemNotificationResponse>builder()
                .content(dtoList)
                .pageNumber(resultPage.getNumber())
                .pageSize(resultPage.getSize())
                .totalElements(resultPage.getTotalElements())
                .totalPages(resultPage.getTotalPages())
                .last(resultPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public SystemNotificationResponse createSystemNotification(String adminEmail, CreateSystemNotificationRequest request) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản quản trị viên."));

        User recipientUser = null;
        if (request.getRecipientType() == RecipientType.SPECIFIC_USER) {
            if (request.getRecipientUserId() == null) {
                throw new BadRequestException("Vui lòng chọn người dùng nhận thông báo.");
            }
            recipientUser = userRepository.findById(request.getRecipientUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + request.getRecipientUserId()));
        } else if (request.getRecipientType() == RecipientType.USER_ROLE) {
            if (request.getRecipientRole() == null || request.getRecipientRole().isBlank()) {
                throw new BadRequestException("Vui lòng chọn nhóm vai trò nhận thông báo.");
            }
        }

        boolean isScheduled = Boolean.TRUE.equals(request.getIsScheduled());
        Instant scheduledAt = request.getScheduledAt();
        Instant now = Instant.now();

        if (isScheduled) {
            if (scheduledAt == null) {
                throw new BadRequestException("Vui lòng chọn thời điểm hẹn giờ gửi.");
            }
            if (scheduledAt.isBefore(now)) {
                throw new BadRequestException("Thời điểm hẹn giờ gửi phải nằm ở tương lai.");
            }
        }

        // Xử lý Expiration: Kiểm tra hợp lệ nếu là CUSTOM
        Instant expiresAt = null;
        if (request.getDurationType() == NotificationDuration.CUSTOM) {
            if (request.getExpiresAt() == null) {
                throw new BadRequestException("Vui lòng chọn ngày và giờ hết hạn cụ thể khi chọn thời hạn tùy chỉnh.");
            }
            Instant effectiveSentTime = isScheduled ? scheduledAt : now;
            if (!request.getExpiresAt().isAfter(effectiveSentTime)) {
                throw new BadRequestException("Thời điểm hết hiệu lực (expiresAt) phải sau thời điểm gửi.");
            }
            expiresAt = request.getExpiresAt();
        } else if (request.getDurationType() != NotificationDuration.FOREVER) {
            Instant effectiveSentTime = isScheduled ? scheduledAt : now;
            expiresAt = calculateExpiresAt(effectiveSentTime, request.getDurationType());
        }

        SystemNotification systemNotification = SystemNotification.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .recipientType(request.getRecipientType())
                .recipientRole(request.getRecipientRole() != null ? request.getRecipientRole().trim().toUpperCase() : null)
                .recipientUser(recipientUser)
                .durationType(request.getDurationType())
                .scheduledAt(isScheduled ? scheduledAt : null)
                .status(isScheduled ? SystemNotificationStatus.SCHEDULED : SystemNotificationStatus.SENT)
                .expiresAt(expiresAt)
                .createdBy(admin)
                .build();

        if (!isScheduled) {
            systemNotification.setSentAt(now);
        }

        systemNotification = systemNotificationRepository.save(systemNotification);

        // Nếu gửi ngay lập tức -> phát hành thông báo và bắn WebSocket realtime ngay
        if (!isScheduled) {
            dispatchSystemNotification(systemNotification, admin);
        }

        return systemNotificationMapper.toDto(systemNotification);
    }

    @Override
    @Transactional
    public void cancelScheduledNotification(String adminEmail, Long notificationId) {
        SystemNotification notification = systemNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo hệ thống ID: " + notificationId));

        if (notification.getStatus() != SystemNotificationStatus.SCHEDULED) {
            throw new BadRequestException("Chỉ có thể hủy thông báo đang ở trạng thái hẹn giờ (SCHEDULED).");
        }

        notification.setStatus(SystemNotificationStatus.CANCELLED);
        systemNotificationRepository.save(notification);
        log.info("Admin {} đã hủy thông báo hệ thống ID: {}", adminEmail, notificationId);
    }

    @Override
    @Transactional
    public void archiveNotification(String adminEmail, Long notificationId) {
        SystemNotification notification = systemNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo hệ thống ID: " + notificationId));

        if (notification.getStatus() == SystemNotificationStatus.SCHEDULED) {
            throw new BadRequestException("Không thể lưu trữ thông báo đang hẹn giờ gửi. Vui lòng hủy lịch nếu không muốn phát hành.");
        }

        if (notification.getStatus() == SystemNotificationStatus.ARCHIVED) {
            throw new BadRequestException("Thông báo này đã được lưu trữ trong kho lưu trữ trước đó.");
        }

        notification.setStatus(SystemNotificationStatus.ARCHIVED);
        notification.setArchivedAt(Instant.now());
        systemNotificationRepository.save(notification);
        log.info("Admin {} đã lưu trữ thông báo hệ thống ID: {} vào kho lưu trữ", adminEmail, notificationId);
    }

    @Override
    @Transactional
    public void executeScheduledNotifications() {
        Instant now = Instant.now();
        List<SystemNotification> dueList = systemNotificationRepository
                .findByStatusAndScheduledAtLessThanEqual(SystemNotificationStatus.SCHEDULED, now);

        if (dueList.isEmpty()) {
            return;
        }

        log.info("Bắt đầu xử lý {} thông báo hệ thống đến lịch hẹn...", dueList.size());
        for (SystemNotification sn : dueList) {
            try {
                // Chuyển sang SENDING
                sn.setStatus(SystemNotificationStatus.SENDING);
                systemNotificationRepository.save(sn);

                Instant sentAt = Instant.now();
                if (sn.getDurationType() != NotificationDuration.CUSTOM && sn.getDurationType() != NotificationDuration.FOREVER) {
                    sn.setExpiresAt(calculateExpiresAt(sentAt, sn.getDurationType()));
                }

                sn.setSentAt(sentAt);
                sn.setStatus(SystemNotificationStatus.SENT);
                systemNotificationRepository.save(sn);

                dispatchSystemNotification(sn, sn.getCreatedBy());
                log.info("Đã phát hành thành công thông báo hẹn giờ ID: {}", sn.getId());
            } catch (Exception e) {
                log.error("Lỗi khi phát hành thông báo hẹn giờ ID {}: {}", sn.getId(), e.getMessage(), e);
            }
        }
    }

    @Override
    @Transactional
    public void expireOverdueNotifications() {
        Instant now = Instant.now();
        List<SystemNotification> overdueList = systemNotificationRepository
                .findByStatusInAndExpiresAtLessThanEqual(List.of(SystemNotificationStatus.SENT, SystemNotificationStatus.ACTIVE), now);

        if (overdueList.isEmpty()) {
            return;
        }

        log.info("Đang chuyển trạng thái EXPIRED cho {} thông báo hệ thống đã hết hạn...", overdueList.size());
        for (SystemNotification sn : overdueList) {
            sn.setStatus(SystemNotificationStatus.EXPIRED);
        }
        systemNotificationRepository.saveAll(overdueList);
    }

    /**
     * Phát hành thông báo tới danh sách người nhận mục tiêu và đẩy WebSocket STOMP.
     */
    private void dispatchSystemNotification(SystemNotification sysNotif, User senderAdmin) {
        List<User> recipients = resolveRecipients(sysNotif);
        if (recipients.isEmpty()) {
            log.warn("Không có người nhận phù hợp cho thông báo hệ thống ID: {}", sysNotif.getId());
            return;
        }

        List<Notification> userNotifications = new ArrayList<>();
        for (User recipient : recipients) {
            Notification n = Notification.builder()
                    .recipient(recipient)
                    .sender(senderAdmin)
                    .type(NotificationType.SYSTEM_BROADCAST)
                    .title(sysNotif.getTitle())
                    .content(sysNotif.getContent())
                    .targetType("SYSTEM")
                    .targetId(String.valueOf(sysNotif.getId()))
                    .senderCount(1)
                    .isRead(false)
                    .expiresAt(sysNotif.getExpiresAt())
                    .systemNotificationId(sysNotif.getId())
                    .build();
            userNotifications.add(n);
        }

        // Lưu bản ghi hàng loạt
        List<Notification> savedList = notificationRepository.saveAll(userNotifications);

        // Phát sóng WebSocket đến từng người nhận
        for (Notification n : savedList) {
            try {
                NotificationResponse dto = notificationMapper.toDto(n);
                messagingTemplate.convertAndSendToUser(
                        n.getRecipient().getId().toString(),
                        WebSocketDestinations.USER_QUEUE_NOTIFICATIONS,
                        dto
                );
            } catch (Exception e) {
                log.error("Lỗi WebSocket khi gửi thông báo tới User ID {}: {}", n.getRecipient().getId(), e.getMessage());
            }
        }
        log.info("Đã gửi thông báo hệ thống ID: {} tới {} người dùng thành công", sysNotif.getId(), savedList.size());
    }

    /**
     * Xác định danh sách User nhận thông báo dựa trên cấu hình RecipientType.
     */
    private List<User> resolveRecipients(SystemNotification sysNotif) {
        if (sysNotif.getRecipientType() == RecipientType.SPECIFIC_USER) {
            if (sysNotif.getRecipientUser() != null) {
                return List.of(sysNotif.getRecipientUser());
            }
            return List.of();
        } else if (sysNotif.getRecipientType() == RecipientType.USER_ROLE) {
            String role = sysNotif.getRecipientRole();
            return userRepository.findByRoleNameAndAccountStatus(role, AccountStatus.ACTIVE);
        } else if (sysNotif.getRecipientType() == RecipientType.ALL_USERS) {
            return userRepository.findByAccountStatus(AccountStatus.ACTIVE);
        }
        return List.of();
    }

    /**
     * Tính toán thời điểm hết hạn dựa trên durationType.
     */
    private Instant calculateExpiresAt(Instant sentAt, NotificationDuration duration) {
        if (duration == null || duration == NotificationDuration.FOREVER) {
            return null;
        }
        switch (duration) {
            case ONE_DAY:
                return sentAt.plus(1, ChronoUnit.DAYS);
            case ONE_WEEK:
                return sentAt.plus(7, ChronoUnit.DAYS);
            case ONE_MONTH:
                return sentAt.plus(30, ChronoUnit.DAYS);
            case ONE_YEAR:
                return sentAt.plus(365, ChronoUnit.DAYS);
            default:
                return null;
        }
    }
}
