package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái xử lý của Ticket tranh chấp / giải quyết tài chính (UC111 & UC112 & UC116 - UC120).
 */
public enum MentoringTicketStatus {
    /** Mới tạo, chờ Ban Quản Trị tiếp nhận (UC111, UC112) */
    OPEN,

    /** Đã được Admin tiếp nhận và đang trong quá trình xem xét / đối soát bằng chứng (UC117) */
    IN_REVIEW,

    /** Đã được Admin phán quyết và giải quyết thành công (UC120) */
    RESOLVED,

    /** Bị Admin từ chối do không hợp lệ hoặc thiếu căn cứ */
    REJECTED,

    /** Bị người tạo hoặc hệ thống hủy bỏ */
    CANCELLED
}
