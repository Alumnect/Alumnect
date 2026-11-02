package com.alumnect.alumnect_backend.common.enums;

/**
 * Loại Ticket gửi lên Ban Quản Trị (Admin) trong Mentorship (UC111 & UC112).
 */
public enum MentoringTicketType {
    /** Thỏa thuận dừng Task đã được Student và Mentor đồng thuận phương án phân chia tiền (UC111) */
    SETTLEMENT,

    /** Tranh chấp, khiếu nại giữa Student và Mentor không thể tự thương lượng (UC112) */
    DISPUTE
}
