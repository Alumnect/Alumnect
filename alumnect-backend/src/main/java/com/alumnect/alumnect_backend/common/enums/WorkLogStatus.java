package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái của nhật ký công việc (Work Log) trong Mentoring Task (UC107 & UC108).
 */
public enum WorkLogStatus {
    /** Đang chờ học viên xem và xác nhận kết quả công việc */
    PENDING_CONFIRMATION,

    /** Học viên đã đồng ý và xác nhận nghiệm thu phần công việc này */
    CONFIRMED,

    /** Học viên từ chối hoặc yêu cầu điều chỉnh lại nội dung/minh chứng */
    REJECTED
}
