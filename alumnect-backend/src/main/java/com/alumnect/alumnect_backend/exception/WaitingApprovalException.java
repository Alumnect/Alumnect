package com.alumnect.alumnect_backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Ngoại lệ xảy ra khi người dùng đăng nhập nhưng tài khoản đang ở trạng thái chờ duyệt.
 * Không kích hoạt rollback giao dịch để trạng thái WAITING_APPROVAL được lưu xuống DB.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class WaitingApprovalException extends BadRequestException {
    public WaitingApprovalException(String message) {
        super(message);
    }
}
