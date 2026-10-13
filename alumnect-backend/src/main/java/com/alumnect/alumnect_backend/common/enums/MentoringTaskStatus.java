package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái của Mentoring Task theo tiến trình thực hiện (UC105 & Flow 3, 4).
 */
public enum MentoringTaskStatus {
    /** Giai đoạn chuẩn bị (vừa thanh toán xong, hai bên trao đổi tài liệu, môi trường chuẩn bị) */
    PREPARATION,

    /** Đang trong quá trình thực hiện công việc hướng dẫn */
    IN_PROGRESS,

    /** Đã nộp kết quả / sản phẩm chờ nghiệm thu */
    SUBMITTED,

    /** Đã hoàn thành và nghiệm thu thành công */
    COMPLETED,

    /** Nhiệm vụ bị hủy bỏ */
    CANCELLED
}
