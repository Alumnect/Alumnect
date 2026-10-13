package com.alumnect.alumnect_backend.integration.disbursement;

/**
 * Interface cổng chi tiền độc lập (Payout cho Mentor / Refund cho Học viên).
 * Tách biệt hoàn toàn với cổng thu tiền (PayOSGateway), phục vụ nghiệp vụ giải ngân và đối soát sổ quỹ.
 */
public interface MentoringDisbursementGateway {

    /**
     * Thực hiện chi trả thù lao (Payout) cho Mentor sau khi hoàn thành nhiệm vụ và nghiệm thu.
     *
     * @param command Lệnh chi tiền kèm thông tin thụ hưởng
     * @return Kết quả giao dịch (chứa providerReference, status PENDING/SUCCEEDED/FAILED)
     */
    DisbursementResult processPayout(DisbursementCommand command);

    /**
     * Thực hiện hoàn trả tiền (Refund) cho Học viên khi hủy bỏ hoặc phát sinh tranh chấp được chấp thuận.
     *
     * @param command Lệnh hoàn tiền
     * @return Kết quả giao dịch
     */
    DisbursementResult processRefund(DisbursementCommand command);

    /**
     * Tra cứu trạng thái lệnh chi tiền từ phía nhà cung cấp/ngân hàng.
     *
     * @param providerReference Mã tham chiếu lệnh chi
     * @return Trạng thái cập nhật
     */
    DisbursementResult checkDisbursementStatus(String providerReference);
}
