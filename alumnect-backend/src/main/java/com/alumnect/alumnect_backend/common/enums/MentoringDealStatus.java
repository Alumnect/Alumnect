package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái của Mentoring Deal trong toàn bộ vòng đời thỏa thuận (UC104).
 */
public enum MentoringDealStatus {
    /** Đang đề xuất / thương lượng điều khoản (chưa bên nào xác nhận hoặc vừa có điều chỉnh) */
    PROPOSED,

    /** Học viên (Student) đã xác nhận phiên bản hiện tại, chờ Mentor xác nhận */
    STUDENT_CONFIRMED,

    /** Cố vấn (Mentor) đã xác nhận phiên bản hiện tại, chờ Student xác nhận */
    MENTOR_CONFIRMED,

    /** Cả hai bên đã cùng xác nhận Snapshot. Thỏa thuận đã bị khóa và sẵn sàng thanh toán UC105 */
    DEAL_CONFIRMED,

    /** Thỏa thuận đã bị hủy bỏ bởi một trong hai bên */
    CANCELLED
}
