package com.alumnect.alumnect_backend.scheduler.mentorship;

import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRequestLifecycleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

/** Tự đóng các Request Mentoring đã quá thời hạn mong muốn mà chưa kích hoạt Task. */
@Slf4j
@Component
@RequiredArgsConstructor
public class MentoringRequestExpiryScheduler {

    private final MentoringRequestRepository requestRepository;
    private final MentoringRequestLifecycleService lifecycleService;

    @Scheduled(cron = "${app.mentoring.request-expiry-cron:0 5 * * * *}")
    public void expireOverdueRequests() {
        for (Long requestId : requestRepository.findOpenRequestIdsPastDeadline(Instant.now())) {
            try {
                lifecycleService.expireIfOverdue(requestId);
            } catch (Exception ex) {
                log.warn("Không thể đóng Request hết hạn id={}: {}", requestId, ex.getMessage());
            }
        }
    }
}
