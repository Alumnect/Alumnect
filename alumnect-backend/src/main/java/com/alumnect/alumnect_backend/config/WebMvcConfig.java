package com.alumnect.alumnect_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Cấu hình các thiết lập cho Spring Web MVC.
 * Ở đây, chúng ta cấu hình prefix "/api/v1" tự động cho toàn bộ các controller có đánh dấu @RestController.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * Cấu hình khớp đường dẫn (Path Match) để thêm prefix "/api/v1" vào trước endpoint của các RestController.
     */
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        // Tự động thêm tiền tố /api/v1 cho mọi controller được đánh dấu @RestController
        configurer.addPathPrefix("/api/v1", HandlerTypePredicate.forAnnotation(RestController.class));
    }
}
