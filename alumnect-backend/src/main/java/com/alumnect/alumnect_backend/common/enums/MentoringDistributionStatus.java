package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái phân phối yêu cầu tới từng Mentor (UC100).
 * Được lưu trong cột status của bảng mentoring_request_distributions.
 */
public enum MentoringDistributionStatus {
    /** Yêu cầu đã được phân phối tới hộp thư của Mentor, đang chờ xem xét */
    PENDING,

    /** Mentor đã chấp nhận yêu cầu hỗ trợ */
    ACCEPTED,

    /** Mentor đã từ chối yêu cầu hỗ trợ */
    REJECTED,

    /** Yêu cầu phân phối đã quá hạn phản hồi */
    EXPIRED
}
