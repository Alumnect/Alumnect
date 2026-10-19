package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringAmendmentStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringExtensionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringSettlementProposalStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskAmendmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskDeadlineExtensionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskSettlementProposalRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskAmendment;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskDeadlineExtension;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskSettlementProposal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Đóng các đề xuất còn treo (gia hạn, điều chỉnh, thỏa thuận dừng) khi Task không còn hoạt động
 * (hoàn thành, tranh chấp, dừng): những đề xuất này không thể được phản hồi nữa và link thanh toán
 * bổ sung chưa trả phải bị hủy để Học viên không trả tiền vào một Task đã đóng.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MentoringTaskProposalCleaner {

    private final MentoringTaskDeadlineExtensionRepository extensionRepository;
    private final MentoringTaskAmendmentRepository amendmentRepository;
    private final MentoringTaskSettlementProposalRepository settlementProposalRepository;
    private final MentoringTaskPaymentService taskPaymentService;

    @Transactional
    public int closeOpenProposals(Long taskId, String reason) {
        int closed = 0;
        for (MentoringTaskDeadlineExtension extension : extensionRepository.findByTaskIdAndStatus(taskId, MentoringExtensionStatus.PENDING)) {
            extension.setStatus(MentoringExtensionStatus.CANCELLED);
            extensionRepository.save(extension);
            closed++;
        }
        for (MentoringAmendmentStatus status : List.of(MentoringAmendmentStatus.PENDING, MentoringAmendmentStatus.AWAITING_TOPUP)) {
            for (MentoringTaskAmendment amendment : amendmentRepository.findByTaskIdAndStatus(taskId, status)) {
                if (status == MentoringAmendmentStatus.AWAITING_TOPUP) {
                    taskPaymentService.cancelPendingTopUpPayments(amendment.getId(), reason);
                }
                amendment.setStatus(MentoringAmendmentStatus.CANCELLED);
                amendmentRepository.save(amendment);
                closed++;
            }
        }
        for (MentoringTaskSettlementProposal proposal : settlementProposalRepository.findByTaskIdAndStatus(taskId, MentoringSettlementProposalStatus.PENDING)) {
            proposal.setStatus(MentoringSettlementProposalStatus.CANCELLED);
            settlementProposalRepository.save(proposal);
            closed++;
        }
        if (closed > 0) {
            log.info("Đóng {} đề xuất còn treo của Task id={}: {}", closed, taskId, reason);
        }
        return closed;
    }
}
