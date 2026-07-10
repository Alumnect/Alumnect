package com.alumnect.alumnect_backend.exception;

import lombok.Getter;

/**
 * Ngoại lệ ném ra khi đăng nhập bằng Google nhưng tài khoản chưa tồn tại trên hệ thống.
 * Chứa thông tin email và họ tên lấy từ Google để chuyển tiếp sang trang đăng ký.
 */
@Getter
public class GoogleUserNotFoundException extends RuntimeException {

    private final String email;
    private final String fullName;
    private final String providerUserId;

    public GoogleUserNotFoundException(String email, String fullName, String providerUserId, String message) {
        super(message);
        this.email = email;
        this.fullName = fullName;
        this.providerUserId = providerUserId;
    }
}
