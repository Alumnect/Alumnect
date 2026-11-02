package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;

import java.math.BigDecimal;

/**
 * Service quản lý nghiệp vụ chi tiền (Payout thù lao cho Mentor, Refund hoàn tiền cho Student).
 */
public interface MentoringDisbursementService {

    /**
     * Xếp hàng lệnh chi thù lao cho Cố vấn sau khi Task được nghiệm thu (UC105, UC110).
     * Chỉ ghi ledger PENDING trong transaction hiện tại; lệnh được gửi sang PayOS sau khi transaction commit
     * và được scheduler gửi lại/đồng bộ cho tới khi có kết quả cuối cùng.
     *
     * @param currentUserId ID người thực hiện (Admin hoặc hệ thống)
     * @param taskId ID nhiệm vụ MentoringTask
     * @param note Ghi chú chi tiền
     * @return Bản ghi Sổ quỹ (MentoringPaymentLedger) của lệnh chi
     */
    MentoringPaymentLedger disbursePayout(Long currentUserId, Long taskId, String note);

    /**
     * Gửi lệnh chi PAYOUT đã ghi sổ sang PayOS ngay sau khi transaction hiện tại commit.
     * Dùng cho ledger được tạo ở luồng khác (ví dụ phán quyết Ticket UC120).
     */
    void dispatchPayoutAfterCommit(Long ledgerId);

    /**
     * Admin chi lại một lệnh chi đã FAILED (sau khi Mentor sửa tài khoản hoặc nạp thêm số dư Kênh chi).
     */
    MentoringPaymentLedger retryFailedPayout(Long adminUserId, Long ledgerId, String note);

    /**
     * Số dư hiện tại của tài khoản Kênh chi PayOS.
     */
    BigDecimal getPayoutBalance();

    /** Gửi các lệnh chi (thù lao và hoàn tiền) đang chờ và đồng bộ trạng thái các lệnh đã gửi PayOS. */
    void synchronizePendingPayouts();
}
