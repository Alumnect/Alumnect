package com.alumnect.alumnect_backend.integration.payos;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import vn.payos.PayOS;

/**
 * Cấu hình khởi tạo Bean PayOS SDK cho toàn bộ ứng dụng.
 * Đọc thông tin xác thực từ tệp cấu hình application.properties.
 */
@Configuration
public class PayOSConfig {

    @Value("${app.payos.client-id:test-client-id}")
    private String clientId;

    @Value("${app.payos.api-key:test-api-key}")
    private String apiKey;

    @Value("${app.payos.checksum-key:test-checksum-key}")
    private String checksumKey;

    @Value("${app.payos.payout.client-id:}")
    private String payoutClientId;

    @Value("${app.payos.payout.api-key:}")
    private String payoutApiKey;

    @Value("${app.payos.payout.checksum-key:}")
    private String payoutChecksumKey;

    /**
     * Khởi tạo PayOS client chính thức.
     *
     * @return Đối tượng PayOS sẵn sàng gọi API PayOS SDK 2.0.1
     */
    @Bean
    @Primary
    public PayOS payOS() {
        return new PayOS(clientId, apiKey, checksumKey);
    }

    /** Client riêng của Kênh chi vì checksum key payout khác Kênh thu. */
    @Bean("payoutPayOS")
    public PayOS payoutPayOS() {
        if (payoutClientId.isBlank() || payoutApiKey.isBlank() || payoutChecksumKey.isBlank()) {
            throw new IllegalStateException("Thiếu cấu hình PayOS Kênh chi");
        }
        return new PayOS(payoutClientId, payoutApiKey, payoutChecksumKey);
    }
}
