package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái của một bình luận (UC16 - View Post Detail / UC18 - Manage Comments).
 * UC20 xóa cứng bình luận khỏi DB thay vì chuyển sang DELETED.
 */
public enum CommentStatus {
    /** Bình luận đang hiển thị bình thường. */
    ACTIVE,
    /** Bình luận đã bị xóa (không còn được set bởi UC20 — giữ lại enum để tương thích ngược với dữ liệu cũ). */
    DELETED
}