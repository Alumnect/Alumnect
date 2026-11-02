package com.alumnect.alumnect_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

/**
 * Cấu hình luồng nền riêng cho kiểm duyệt nội dung.
 * Hàng đợi có giới hạn; khi đầy, luồng gửi sự kiện tự xử lý thay vì làm mất lượt kiểm duyệt.
 */
@Configuration
public class ModerationAsyncConfig {

    /** Tên bean executor dùng cho các listener kiểm duyệt. */
    public static final String MODERATION_EXECUTOR = "moderationTaskExecutor";

    private static final int CORE_POOL_SIZE = 2;
    private static final int MAX_POOL_SIZE = 4;
    private static final int QUEUE_CAPACITY = 500;
    private static final int SHUTDOWN_WAIT_SECONDS = 20;

    /**
     * Tạo executor cho kiểm duyệt nền, chờ các tác vụ dang dở hoàn tất khi ứng dụng tắt.
     *
     * @return Executor đã cấu hình giới hạn luồng và hàng đợi
     */
    @Bean(name = MODERATION_EXECUTOR)
    public ThreadPoolTaskExecutor moderationTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(CORE_POOL_SIZE);
        executor.setMaxPoolSize(MAX_POOL_SIZE);
        executor.setQueueCapacity(QUEUE_CAPACITY);
        executor.setThreadNamePrefix("moderation-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(SHUTDOWN_WAIT_SECONDS);
        return executor;
    }
}
