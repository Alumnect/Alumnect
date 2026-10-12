package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái vòng đời của yêu cầu Mentoring chung (UC100).
 * Được lưu trong cột status của bảng mentoring_requests.
 */
public enum MentoringRequestStatus {
    /** Yêu cầu vừa tạo, đang mở tiếp nhận phân phối tới các Mentor phù hợp */
    OPEN,

    /** Yêu cầu đã được Mentor tiếp nhận thành công */
    MATCHED,

    /** Yêu cầu đã hoàn thành hoặc đã đóng */
    CLOSED,

    /** Yêu cầu đã bị hủy bởi người tạo */
    CANCELLED
}
