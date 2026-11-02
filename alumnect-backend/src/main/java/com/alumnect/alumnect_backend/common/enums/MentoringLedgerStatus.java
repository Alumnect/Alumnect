package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái giao dịch trong sổ quỹ Mentoring (mentoring_payment_ledgers).
 */
public enum MentoringLedgerStatus {
    /** Đang chờ xử lý (ví dụ lệnh chi/hoàn tiền bất đồng bộ) */
    PENDING,

    /** Giao dịch đã hoàn tất thành công và được ghi nhận sổ quỹ */
    SUCCEEDED,

    /** Giao dịch thất bại */
    FAILED
}
