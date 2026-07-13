package com.alumnect.alumnect_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Ngoại lệ dùng khi người dùng ĐÃ xác định danh tính (hoặc là Guest) nhưng KHÔNG có quyền
 * truy cập tài nguyên yêu cầu → HTTP 403 Forbidden.
 * <p>
 * VD ở UC16: Guest (chưa đăng nhập) cố xem chi tiết một bài viết {@code MEMBERS} — theo BR-12
 * chỉ thành viên đã đăng nhập mới xem được, nên trả 403 (khác với 401 "chưa xác thực").
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}