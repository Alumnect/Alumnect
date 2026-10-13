package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái của Task Amendment Ticket (UC109 - Điều chỉnh Deal/bổ sung tiền).
 */
public enum MentoringAmendmentStatus {
    /** Đang chờ bên còn lại phản hồi xác nhận */
    PENDING,

    /** Hai bên đã đồng thuận tăng tiền, đang chờ Student thanh toán bổ sung (UC105 top-up) */
    AWAITING_TOPUP,

    /** Đã kích hoạt áp dụng thành công vào Task (thay đổi phạm vi, kết quả, tiền và deadline) */
    APPLIED,

    /** Đề xuất bị từ chối */
    REJECTED,

    /** Đã bị thay thế bởi phiên bản điều chỉnh mới hơn */
    SUPERSEDED,

    /** Bị hủy bỏ do phiên thanh toán top-up thất bại hoặc quá hạn */
    CANCELLED
}
