package com.alumnect.alumnect_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Ngoại lệ dùng khi tài nguyên đã tồn tại trong hệ thống → HTTP 409 Conflict.
 * VD: email đăng ký bị trùng với tài khoản đã có.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
