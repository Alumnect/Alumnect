package com.alumnect.alumnect_backend.common.enums;

/**
 * Trạng thái quyết toán tài chính dòng tiền (Escrow Payout / Refund) theo UC120 (Rule 5.9 & 289).
 */
public enum MentoringSettlementStatus {
    /** Đang chờ xử lý chuyển tiền */
    PENDING,

    /** Đang trong quá trình xử lý qua cổng thanh toán / ngân hàng */
    PROCESSING,

    /** Đã chi trả hoặc hoàn tiền một phần (khoản còn lại đang chờ hoặc xử lý lại) */
    PARTIALLY_PAID,

    /** Đã quyết toán cân đối hoàn tất 100% (cả payout và refund thành công) */
    SETTLED,

    /** Xử lý thất bại, cần Admin đối soát thủ công */
    FAILED
}
