package com.alumnect.alumnect_backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình tập trung cho toàn bộ module Hướng dẫn & Hỗ trợ (Mentoring).
 * Quản lý phiên bản điều khoản hiện tại và các tham số nghiệp vụ liên quan theo chuẩn UC90.
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "app.mentoring.terms")
public class MentoringProperties {

    /**
     * Phiên bản điều khoản hiện tại áp dụng cho module Mentoring.
     * Mặc định là "1.0", cấu hình qua application.properties: app.mentoring.terms.version.
     */
    private String version = "1.0";
}
