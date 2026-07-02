package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái xét duyệt hồ sơ của cựu sinh viên (Alumni).
 * Được lưu trong cột status của bảng verification_requests.
 */
public enum VerificationStatus {
    PENDING,   // Phiếu mới tạo, chờ Admin xét duyệt
    APPROVED,  // Admin đã duyệt, tài khoản Alumni được ACTIVE
    REJECTED   // Admin đã từ chối hồ sơ
}
