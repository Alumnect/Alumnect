package com.alumnect.alumnect_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Ngoại lệ dùng khi không tìm thấy tài nguyên trong cơ sở dữ liệu → HTTP 404 Not Found.
 * VD: không tìm thấy vai trò, chuyên ngành, mã OTP theo ID/token truyền vào.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
