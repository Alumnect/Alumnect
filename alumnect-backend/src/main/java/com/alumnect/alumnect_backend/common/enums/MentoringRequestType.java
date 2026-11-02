package com.alumnect.alumnect_backend.common.enums;

/**
 * Loại yêu cầu Mentoring trong hệ thống AlumNect:
 * - GENERAL: Yêu cầu mở chung, phân phối tự động tới các Mentor phù hợp (UC100).
 * - DIRECT: Yêu cầu gửi trực tiếp tới một Mentor cụ thể (UC101).
 */
public enum MentoringRequestType {
    /** Yêu cầu Mentoring chung, hệ thống tự matching và phân phối (UC100) */
    GENERAL,

    /** Yêu cầu Mentoring gửi trực tiếp tới Mentor được chỉ định cụ thể (UC101) */
    DIRECT
}
