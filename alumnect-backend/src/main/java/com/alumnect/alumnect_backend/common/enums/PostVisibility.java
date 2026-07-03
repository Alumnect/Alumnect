package com.alumnect.alumnect_backend.common.enums;

/**
 * Phạm vi hiển thị của một bài viết trên bảng tin cộng đồng.
 * Dùng để áp dụng quy tắc nghiệp vụ BR-12 (UC15): Guest (khách vãng lai,
 * chưa đăng nhập) chỉ được xem các bài viết PUBLIC, không thấy bài viết MEMBERS.
 */
public enum PostVisibility {
    /** Công khai — mọi người kể cả Guest chưa đăng nhập đều xem được. */
    PUBLIC,
    /** Chỉ dành cho thành viên đã đăng nhập (Student/Alumni/Admin). */
    MEMBERS
}
