package com.alumnect.alumnect_backend.scheduler.auth;

import com.alumnect.alumnect_backend.dao.auth.VerificationTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Bộ lập lịch (Scheduler) tự động chạy định kỳ để dọn dẹp các mã xác thực (OTP).
 * Chạy mỗi giờ để giữ bảng verification_tokens luôn gọn nhẹ và tránh làm đầy bộ nhớ.
 */
@Component
public class TokenCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(TokenCleanupScheduler.class);

    private final VerificationTokenRepository tokenRepository;

    public TokenCleanupScheduler(VerificationTokenRepository tokenRepository) {
        this.tokenRepository = tokenRepository;
    }

    /**
     * Dọn dẹp các mã xác thực đã hết hạn hoặc đã được sử dụng thành công.
     * Cấu hình Cron: chạy vào phút thứ 0 của mỗi giờ (VD: 01:00, 02:00, 03:00...).
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredAndUsedTokens() {
        int deleted = tokenRepository.deleteExpiredOrUsed(Instant.now());
        if (deleted > 0) {
            log.info("[TokenCleanup] Purged {} expired/used verification token(s).", deleted);
        } else {
            log.debug("[TokenCleanup] No expired/used tokens found. Nothing to purge.");
        }
    }
}
