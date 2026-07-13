package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái của một bình luận (UC16 - View Post Detail / UC18 - Manage Comments).
 * Dùng để xóa mềm (soft delete) bình luận theo BR-11 thay vì xóa cứng dữ liệu.
 */
public enum CommentStatus {
    /** Bình luận đang hiển thị bình thường. */
    ACTIVE,
    /** Bình luận đã bị xóa mềm — không hiển thị trong luồng bình luận nhưng vẫn giữ trong DB. */
    DELETED
}