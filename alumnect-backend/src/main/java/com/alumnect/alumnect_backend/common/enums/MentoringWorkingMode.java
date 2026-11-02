package com.alumnect.alumnect_backend.common.enums;

/**
 * Hình thức hướng dẫn/cố vấn của Mentor.
 * Được lưu trong cột working_mode của bảng mentor_profiles.
 */
public enum MentoringWorkingMode {
    ONLINE,   // Hướng dẫn trực tuyến
    OFFLINE,  // Hướng dẫn trực tiếp
    BOTH      // Cả trực tuyến và trực tiếp
}
