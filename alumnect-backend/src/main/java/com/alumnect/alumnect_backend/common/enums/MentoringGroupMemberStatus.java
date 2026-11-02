package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái thành viên trong nhóm Mentoring.
 * PENDING: Đang chờ phản hồi lời mời.
 * JOINED: Đã chấp nhận và là thành viên chính thức.
 * DECLINED: Đã từ chối lời mời.
 * REMOVED: Đã bị loại khỏi nhóm.
 * CANCELLED: Lời mời đã bị Leader hủy.
 * INVITED, ACTIVE: Giữ để tương thích dữ liệu cũ.
 */
public enum MentoringGroupMemberStatus {
    PENDING,
    JOINED,
    DECLINED,
    REMOVED,
    CANCELLED,
    INVITED,
    ACTIVE;

    public boolean isJoined() {
        return this == JOINED || this == ACTIVE;
    }

    public boolean isPending() {
        return this == PENDING || this == INVITED;
    }
}
