package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;

/**
 * Service quản lý nghiệp vụ chi tiền (Payout thù lao cho Mentor, Refund hoàn tiền cho Student).
 */
public interface MentoringDisbursementService {

    /**
     * Thực hiện chi trả thù lao nhiệm vụ cho Cố vấn sau khi nghiệm thu hoàn tất (UC105, UC118).
     *
     * @param currentUserId ID người thực hiện (Admin hoặc hệ thống)
     * @param taskId ID nhiệm vụ MentoringTask
     * @param note Ghi chú chi tiền
     * @return Bản ghi Sổ quỹ (MentoringPaymentLedger) đã được tạo
     */
    MentoringPaymentLedger disbursePayout(Long currentUserId, Long taskId, String note);

    /**
     * Thực hiện hoàn trả tiền cho Học viên khi hủy bỏ hoặc xử lý tranh chấp (UC105, UC118).
     *
     * @param currentUserId ID người thực hiện (Admin)
     * @param requestId ID yêu cầu MentoringRequest
     * @param reason Lý do hoàn tiền
     * @return Bản ghi Sổ quỹ (MentoringPaymentLedger) đã được tạo
     */
    MentoringPaymentLedger disburseRefund(Long currentUserId, Long requestId, String reason);
}
