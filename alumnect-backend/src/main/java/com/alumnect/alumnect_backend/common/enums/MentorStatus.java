package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái hồ sơ Mentor của Cựu sinh viên (Alumni).
 * Được lưu trong cột mentor_status của bảng mentor_profiles.
 */
public enum MentorStatus {
    INCOMPLETE,       // Hồ sơ lưu nháp hoặc chưa điền đủ các điều kiện hoàn tất
    PAYMENT_PENDING,  // Hồ sơ đã điền đầy đủ và chấp nhận điều khoản UC90, chờ thanh toán gói Mentor (UC92 & UC93)
    ACTIVE,           // Mentor đang hoạt động sau khi thanh toán gói thành công
    EXPIRED           // Gói dịch vụ Mentor đã hết hạn, cần gia hạn
}
