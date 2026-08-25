package com.alumnect.alumnect_backend.common.enums;

/**
 * Loại bài viết hiển thị trên bảng tin cộng đồng (UC15 - View community Feed).
 * Dùng để phân loại và lọc bài viết theo tab trên giao diện Frontend.
 */
public enum PostCategory {
    /** Bài viết thông thường, không thuộc loại đặc biệt nào. */
    GENERAL,
    /** Bài viết chia sẻ thành tựu cá nhân (VD: được thăng chức, hoàn thành dự án). */
    ACHIEVEMENT,
    /** Bài viết tuyển dụng/giới thiệu việc làm. */
    RECRUITMENT,
    /** Bài viết quảng bá sự kiện (hội thảo, họp mặt cựu sinh viên...). */
    EVENT
}
