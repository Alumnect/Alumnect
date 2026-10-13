package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái vòng đời của yêu cầu Mentoring (UC100 / UC101), lưu trong cột status của bảng mentoring_requests.
 * Ánh xạ theo chuỗi nghiệp vụ Request → Response → Chat for Task → Deal → Payment → Task:
 * OPEN (đang nhận phản hồi / thương lượng) → MATCHED (đã chốt Deal & Mentor, chờ thanh toán)
 * → CLOSED (thanh toán thành công, Request đã chuyển thành Mentoring Task).
 */
public enum MentoringRequestStatus {
    /** Yêu cầu đang mở: Mentor có thể ACCEPT/DECLINE, các Chat for Task đang thương lượng Deal */
    OPEN,

    /** Học viên đã xác nhận Deal của một Mentor: Mentor được chọn & Deal đã khóa, đang chờ / thử lại thanh toán */
    MATCHED,

    /** Thanh toán thành công, Request đã chuyển thành Mentoring Task (không nhận phản hồi / Deal mới) */
    CLOSED,

    /** Yêu cầu đã bị hủy bởi người tạo */
    CANCELLED
}
