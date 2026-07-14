package com.alumnect.alumnect_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Ngoại lệ dùng khi dữ liệu đầu vào không hợp lệ → HTTP 400 Bad Request.
 * VD: thiếu trường bắt buộc, mật khẩu yếu, OTP sai định dạng...
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
