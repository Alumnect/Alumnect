package com.alumnect.alumnect_backend.integration.disbursement;

import lombok.Getter;

/**
 * Lỗi khi gửi lệnh chi tới cổng thanh toán, đã được phân loại theo mức độ chắc chắn
 * để tầng nghiệp vụ quyết định giữ PENDING (thử lại) hay chuyển FAILED.
 */
@Getter
public class DisbursementException extends RuntimeException {

    public enum Kind {
        /** Cổng thanh toán đã từ chối lệnh chi (sai tài khoản, thiếu số dư, vượt hạn mức...). Không tự thử lại. */
        REJECTED,
        /** Lệnh chắc chắn chưa được tiếp nhận (sai cấu hình key, IP chưa whitelist, rate limit). Gửi lại an toàn. */
        NOT_SUBMITTED,
        /** Không xác định được lệnh đã được tiếp nhận hay chưa (timeout, lỗi 5xx). Phải tra cứu trước khi gửi lại. */
        UNKNOWN
    }

    private final Kind kind;
    private final String errorCode;

    public DisbursementException(Kind kind, String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.kind = kind;
        this.errorCode = errorCode;
    }
}
