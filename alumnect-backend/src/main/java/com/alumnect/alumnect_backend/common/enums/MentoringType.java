package com.alumnect.alumnect_backend.common.enums;

/**
 * Loại hình cố vấn của Mentor.
 * Được lưu trong cột mentoring_type của bảng mentor_profiles.
 */
public enum MentoringType {
    INDIVIDUAL, // Hướng dẫn 1-1
    GROUP,      // Hướng dẫn nhóm
    BOTH        // Cả 1-1 và hướng dẫn nhóm
}
