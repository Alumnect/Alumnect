package com.alumnect.alumnect_backend.integration.disbursement;

import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * Adapter triển khai cổng chi tiền độc lập (Disbursement / Payout / Refund).
 * Đảm bảo:
 * - Xác minh đầy đủ thông tin tài khoản thụ hưởng trước khi lập lệnh chi.
 * - Chỉ cho phép giả lập SUCCEEDED trong môi trường dev/test (qua cấu hình app.disbursement.mock-enabled).
 * - Trong môi trường thật (Production / khi mock bị tắt), lưu lệnh ở trạng thái PENDING và hiển thị trạng thái thực,
 *   tuyệt đối không trả SUCCEEDED giả tạo.
 */
@Slf4j
@Component
public class MockMentoringDisbursementGatewayImpl implements MentoringDisbursementGateway {

    @Value("${app.disbursement.mock-enabled:true}")
    private boolean mockEnabled;

    @Override
    public DisbursementResult processPayout(DisbursementCommand command) {
        log.info("Khởi tạo lệnh Payout thù lao: mentorId={}, amount={}, bankName={}, accNumber={}",
                command.getBeneficiaryUserId(), command.getAmount(), command.getBankName(), command.getBankAccountNumber());

        validateBeneficiaryAccount(command);

        String reference = "PO-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
        Instant now = Instant.now();

        if (mockEnabled) {
            log.info("[MOCK DEV/TEST] Lệnh Payout {} được mô phỏng thành công (SUCCEEDED).", reference);
            return DisbursementResult.builder()
                    .providerReference(reference)
                    .status(MentoringLedgerStatus.SUCCEEDED)
                    .message("Chi trả thù lao thành công qua cổng thanh toán (Mô phỏng Test/Dev).")
                    .transactedAt(now)
                    .build();
        }

        // Môi trường Production / Chưa tích hợp Open Banking tự động: Giữ PENDING đối soát
        log.warn("[PRODUCTION] Chưa kích hoạt tự động qua ngân hàng. Lệnh Payout {} được ghi nhận ở trạng thái PENDING đối soát.", reference);
        return DisbursementResult.builder()
                .providerReference(reference)
                .status(MentoringLedgerStatus.PENDING)
                .message("Lệnh chi tiền đã tiếp nhận và đang chờ đối soát ngân hàng thụ hưởng.")
                .transactedAt(now)
                .build();
    }

    @Override
    public DisbursementResult processRefund(DisbursementCommand command) {
        log.info("Khởi tạo lệnh Refund hoàn tiền: studentId={}, amount={}, origRef={}",
                command.getBeneficiaryUserId(), command.getAmount(), command.getOriginalPaymentReference());

        String reference = "RF-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);
        Instant now = Instant.now();

        if (mockEnabled) {
            log.info("[MOCK DEV/TEST] Lệnh Refund {} được mô phỏng thành công (SUCCEEDED).", reference);
            return DisbursementResult.builder()
                    .providerReference(reference)
                    .status(MentoringLedgerStatus.SUCCEEDED)
                    .message("Hoàn trả tiền cho Học viên thành công (Mô phỏng Test/Dev).")
                    .transactedAt(now)
                    .build();
        }

        log.warn("[PRODUCTION] Lệnh Refund {} được ghi nhận ở trạng thái PENDING chờ hoàn tiền qua cổng PayOS/Ngân hàng.", reference);
        return DisbursementResult.builder()
                .providerReference(reference)
                .status(MentoringLedgerStatus.PENDING)
                .message("Lệnh hoàn tiền đã tiếp nhận và đang chờ xử lý từ cổng thanh toán.")
                .transactedAt(now)
                .build();
    }

    @Override
    public DisbursementResult checkDisbursementStatus(String providerReference) {
        log.info("Tra cứu trạng thái lệnh chi tiền: reference={}", providerReference);
        return DisbursementResult.builder()
                .providerReference(providerReference)
                .status(mockEnabled ? MentoringLedgerStatus.SUCCEEDED : MentoringLedgerStatus.PENDING)
                .message("Trạng thái lệnh chi từ hệ thống đối soát.")
                .transactedAt(Instant.now())
                .build();
    }

    private void validateBeneficiaryAccount(DisbursementCommand command) {
        if (command.getBankName() == null || command.getBankName().isBlank()) {
            throw new BadRequestException("Thiếu thông tin tên ngân hàng thụ hưởng của Cố vấn.");
        }
        if (command.getBankAccountNumber() == null || command.getBankAccountNumber().isBlank()) {
            throw new BadRequestException("Thiếu số tài khoản ngân hàng thụ hưởng của Cố vấn.");
        }
        if (command.getBankAccountHolder() == null || command.getBankAccountHolder().isBlank()) {
            throw new BadRequestException("Thiếu tên chủ tài khoản ngân hàng thụ hưởng của Cố vấn.");
        }
    }
}
