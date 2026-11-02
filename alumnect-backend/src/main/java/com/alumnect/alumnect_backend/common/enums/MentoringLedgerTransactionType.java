package com.alumnect.alumnect_backend.common.enums;

/**
 * Loại giao dịch ghi nhận trong sổ quỹ Mentoring (UC105, UC118 - Escrow, Payout, Refund).
 */
public enum MentoringLedgerTransactionType {
    /** Thu tiền tạm giữ từ Học viên qua cổng thanh toán (Ký quỹ / Inflow) */
    ESCROW_COLLECTION,

    /** Chi trả thù lao nhiệm vụ cho Cố vấn (Payout) */
    PAYOUT,

    /** Hoàn tiền lại cho Học viên khi hủy hoặc phát sinh tranh chấp (Refund) */
    REFUND
}
