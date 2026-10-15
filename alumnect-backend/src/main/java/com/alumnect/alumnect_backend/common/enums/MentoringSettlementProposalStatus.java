package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái của Thỏa thuận dừng Task giữa Student và Mentor (UC109).
 */
public enum MentoringSettlementProposalStatus {
    /** Đang chờ bên còn lại phản hồi */
    PENDING,

    /** Hai bên đã thống nhất phương án (sẵn sàng chuyển thành Settlement Ticket theo UC111) */
    ACCEPTED,

    /** Một bên từ chối phương án (chuyển sang mở Dispute Ticket theo UC112 nếu không thể thỏa thuận) */
    REJECTED,

    /** Đã bị thay thế bởi đề xuất phân chia khác */
    SUPERSEDED,
    /** Người tạo đã hủy đề xuất, hoặc hệ thống đóng khi Task không còn hoạt động */
    CANCELLED
}
