package com.alumnect.alumnect_backend.common.enums;

/**
 * Phương án giải quyết Ticket tranh chấp / hòa giải của Ban Quản Trị (UC120).
 */
public enum MentoringTicketDecision {
    /** Chi trả toàn bộ thù lao cho Cố vấn (Mentor) */
    FULL_MENTOR_PAYMENT,

    /** Hòa giải: Phân chia một phần cho Cố vấn và hoàn lại một phần cho Học viên */
    PARTIAL_SPLIT,

    /** Hoàn trả toàn bộ học phí / chi phí cho Học viên (Student) */
    FULL_STUDENT_REFUND
}
