package com.alumnect.alumnect_backend.scheduler.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.service.mentorship.MentorEligibilityService;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Optional;

/**
 * Theo dõi hạn gói Mentor: nhắc gia hạn trước khi hết hạn và chuyển hồ sơ sang EXPIRED khi gói đã hết hạn,
 * để Mentor hết hạn không còn được phân phối / nhận Request mới.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MentorSubscriptionExpiryScheduler {

    private static final Duration REMIND_BEFORE = Duration.ofDays(3);
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final MentorProfileRepository mentorProfileRepository;
    private final MentorSubscriptionRepository subscriptionRepository;
    private final MentorEligibilityService eligibilityService;
    private final NotificationService notificationService;

    @Scheduled(cron = "${app.mentoring.subscription-expiry-cron:0 10 * * * *}")
    public void checkSubscriptions() {
        Instant now = Instant.now();
        for (MentorProfile profile : mentorProfileRepository.findByMentorStatus(MentorStatus.ACTIVE)) {
            try {
                Optional<MentorSubscription> current = subscriptionRepository
                        .findByMentorProfileIdOrderByCreatedAtDesc(profile.getId()).stream()
                        .filter(s -> (s.getStatus() == MentorSubscriptionStatus.ACTIVE || s.getStatus() == MentorSubscriptionStatus.PAID)
                                && s.getEndDate() != null && s.getEndDate().isAfter(now))
                        .max(Comparator.comparing(MentorSubscription::getEndDate));

                if (current.isEmpty()) {
                    MentorStatus status = eligibilityService.recalculateMentorStatus(profile.getId());
                    if (status != MentorStatus.ACTIVE) {
                        notificationService.sendMentoringAccountNotification(null, profile.getUser(), "MENTOR_SUBSCRIPTION",
                                profile.getId() + ":EXPIRED:" + now.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toLocalDate(),
                                "Gói Mentor đã hết hạn",
                                "Gói Mentor của bạn đã hết hạn. Bạn tạm thời không nhận được yêu cầu mới cho tới khi gia hạn.");
                        log.info("Mentor profileId={} hết hạn gói, chuyển trạng thái {}", profile.getId(), status);
                    }
                } else if (current.get().getEndDate().isBefore(now.plus(REMIND_BEFORE))) {
                    MentorSubscription sub = current.get();
                    notificationService.sendMentoringAccountNotification(null, profile.getUser(), "MENTOR_SUBSCRIPTION",
                            sub.getId() + ":EXPIRING",
                            "Gói Mentor sắp hết hạn",
                            "Gói Mentor của bạn sẽ hết hạn vào " + DATE.format(sub.getEndDate())
                                    + ". Gia hạn để tiếp tục nhận yêu cầu Mentoring.");
                }
            } catch (Exception ex) {
                log.warn("Không thể kiểm tra gói Mentor profileId={}: {}", profile.getId(), ex.getMessage());
            }
        }
    }
}
