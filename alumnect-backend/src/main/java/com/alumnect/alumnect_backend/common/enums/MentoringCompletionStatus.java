package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái của lần nộp kết quả nghiệm thu hoàn thành Task (UC110).
 */
public enum MentoringCompletionStatus {
    /** Đang chờ Học viên xem xét và nghiệm thu kết quả */
    PENDING,

    /** Học viên đã nghiệm thu và xác nhận hoàn thành Task */
    CONFIRMED,

    /** Học viên chưa đồng ý nghiệm thu và yêu cầu chỉnh sửa/bổ sung */
    REJECTED,

    /** Bị thay thế bởi lần nộp kết quả mới */
    SUPERSEDED
}
