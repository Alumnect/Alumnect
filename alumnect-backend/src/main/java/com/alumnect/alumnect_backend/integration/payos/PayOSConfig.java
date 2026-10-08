package com.alumnect.alumnect_backend.integration.payos;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

    /**
     * Khởi tạo PayOS client chính thức.
     *
     * @return Đối tượng PayOS sẵn sàng gọi API PayOS SDK 2.0.1
     */
    @Bean
    public PayOS payOS() {
        return new PayOS(clientId, apiKey, checksumKey);
    }
}
