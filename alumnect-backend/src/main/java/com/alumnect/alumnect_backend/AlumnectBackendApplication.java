package com.alumnect.alumnect_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Lớp khởi chạy chính (Entry Point) của ứng dụng Spring Boot Alumnect Backend.
 * Kích hoạt tính năng tự động lập lịch tác vụ {@link EnableScheduling}.
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
public class AlumnectBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(AlumnectBackendApplication.class, args);
	}



}
