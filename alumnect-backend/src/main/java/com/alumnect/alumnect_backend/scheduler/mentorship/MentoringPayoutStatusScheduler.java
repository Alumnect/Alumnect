package com.alumnect.alumnect_backend.scheduler.mentorship;

import com.alumnect.alumnect_backend.service.mentorship.MentoringDisbursementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MentoringPayoutStatusScheduler {
    private final MentoringDisbursementService disbursementService;

    @Scheduled(fixedDelayString = "${app.disbursement.sync-delay-ms:60000}")
    public void synchronizePendingPayouts() {
        try {
            disbursementService.synchronizePendingPayouts();
        } catch (Exception ex) {
            log.warn("Không thể đồng bộ trạng thái payout PayOS: {}", ex.getMessage());
        }
    }
}
