package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.*;
import com.alumnect.alumnect_backend.dao.mentorship.*;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.*;
import com.alumnect.alumnect_backend.entity.mentorship.*;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.*;

/**
 * Triển khai dịch vụ quản lý Quỹ Task, Sổ quỹ giao dịch và lịch sử tài chính cho Admin (UC121 & Mục 5.7).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringFinanceServiceImpl implements MentoringFinanceService {

    private final MentoringTaskRepository taskRepository;
    private final MentoringPaymentLedgerRepository ledgerRepository;
    private final MentoringTaskDeadlineExtensionRepository extensionRepository;
    private final MentoringTaskAmendmentRepository amendmentRepository;
    private final MentoringDisputeTicketRepository ticketRepository;
    private final MentoringTicketEvidenceRepository evidenceRepository;
    private final UserRepository userRepository;
    private final MentoringDisbursementService disbursementService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminTaskFundSummaryResponse> getTaskFunds(
            Long adminUserId,
            String keyword,
            String status,
            String settlementStatus,
            Pageable pageable
    ) {
        log.info("Admin {} tra cứu danh sách Quỹ Task: keyword={}, status={}, settlementStatus={}",
                adminUserId, keyword, status, settlementStatus);

        requireAdmin(adminUserId);

        Specification<MentoringTask> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
                try {
                    MentoringTaskStatus taskStatus = MentoringTaskStatus.valueOf(status.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("status"), taskStatus));
                } catch (IllegalArgumentException ignored) {}
            }

            if (keyword != null && !keyword.isBlank()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                Predicate titlePred = cb.like(cb.lower(root.get("taskTitle")), kw);
                Predicate idPred = null;
                try {
                    Long tid = Long.parseLong(keyword.trim().replaceAll("[^0-9]", ""));
                    idPred = cb.equal(root.get("id"), tid);
                } catch (Exception ignored) {}

                if (idPred != null) {
                    predicates.add(cb.or(titlePred, idPred));
                } else {
                    predicates.add(titlePred);
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<MentoringTask> pageData = taskRepository.findAll(spec, pageable);

        List<AdminTaskFundSummaryResponse> summaries = pageData.getContent().stream()
                .map(this::computeTaskFundSummary)
                .filter(s -> {
                    if (settlementStatus == null || settlementStatus.isBlank() || "ALL".equalsIgnoreCase(settlementStatus)) {
                        return true;
                    }
                    return settlementStatus.equalsIgnoreCase(s.getSettlementStatus());
                })
                .toList();

        return PageResponse.<AdminTaskFundSummaryResponse>builder()
                .content(summaries)
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .pageSize(pageData.getSize())
                .pageNumber(pageData.getNumber())
                .last(pageData.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminTaskFundDetailResponse getTaskFundDetail(Long adminUserId, Long taskId) {
        log.info("Admin {} yêu cầu xem chi tiết Sổ quỹ và lịch sử Task ID: {}", adminUserId, taskId);

        requireAdmin(adminUserId);

        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhiệm vụ Mentoring Task với ID: " + taskId));

        // 1. Tóm tắt quỹ
        AdminTaskFundSummaryResponse summary = computeTaskFundSummary(task);

        // 2. Danh sách toàn bộ các giao dịch ghi trong sổ quỹ
        List<MentoringPaymentLedgerResponse> ledgers = ledgerRepository.findByTaskId(task.getId()).stream()
                .sorted(Comparator.comparing(MentoringPaymentLedger::getCreatedAt))
                .map(this::toLedgerResponse)
                .toList();

        // 3. Lịch sử gia hạn thời hạn (UC109)
        List<MentoringTaskDeadlineExtensionResponse> extensions = extensionRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                .map(this::toExtensionResponse)
                .toList();

        // 4. Lịch sử đề xuất điều chỉnh phạm vi & bổ sung tiền (UC109)
        List<MentoringTaskAmendmentResponse> amendments = amendmentRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                .map(this::toAmendmentResponse)
                .toList();

        // 5. Lịch sử Dispute / Settlement Tickets (UC111, UC112, UC120)
        List<MentoringDisputeTicketResponse> tickets = ticketRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                .map(this::toTicketResponse)
                .toList();

        return AdminTaskFundDetailResponse.builder()
                .summary(summary)
                .ledgers(ledgers)
                .extensionHistory(extensions)
                .amendmentHistory(amendments)
                .disputeTickets(tickets)
                .build();
    }

    /**
     * Tính toán bảng cân đối quỹ dòng tiền theo Task (Mục 5.7 & 5.9).
     */
    private AdminTaskFundSummaryResponse computeTaskFundSummary(MentoringTask task) {
        List<MentoringPaymentLedger> ledgers = ledgerRepository.findByTaskId(task.getId());

        // Tổng tiền thu vào qua ký quỹ (Escrow Inflow)
        BigDecimal totalCollected = ledgers.stream()
                .filter(l -> l.getTransactionType() == MentoringLedgerTransactionType.ESCROW_COLLECTION
                        && l.getStatus() == MentoringLedgerStatus.SUCCEEDED)
                .map(MentoringPaymentLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal initialPrice = task.getAgreedPrice() != null ? task.getAgreedPrice() : BigDecimal.ZERO;

        // Tổng tiền thu bổ sung qua Task Amendments đã thanh toán thành công (APPLIED)
        BigDecimal totalTopUp = amendmentRepository.findByTaskIdAndStatus(task.getId(), MentoringAmendmentStatus.APPLIED).stream()
                .map(MentoringTaskAmendment::getAdditionalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tổng tiền chi cho Mentor (Payout)
        BigDecimal totalPayout = ledgers.stream()
                .filter(l -> l.getTransactionType() == MentoringLedgerTransactionType.PAYOUT
                        && l.getStatus() == MentoringLedgerStatus.SUCCEEDED)
                .map(MentoringPaymentLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tổng tiền hoàn cho Student (Refund)
        BigDecimal totalRefund = ledgers.stream()
                .filter(l -> l.getTransactionType() == MentoringLedgerTransactionType.REFUND
                        && l.getStatus() == MentoringLedgerStatus.SUCCEEDED)
                .map(MentoringPaymentLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Phí xử lý tranh chấp / Phí nền tảng (nếu có từ phán quyết vé)
        BigDecimal platformFee = ticketRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                .filter(t -> t.getStatus() == MentoringTicketStatus.RESOLVED && t.getDisputeFee() != null)
                .map(MentoringDisputeTicket::getDisputeFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tiền đang giữ trong quỹ Escrow khả dụng = Tổng thu - Payout - Refund - Phí
        BigDecimal escrowHolding = totalCollected.subtract(totalPayout).subtract(totalRefund).subtract(platformFee);
        if (escrowHolding.compareTo(BigDecimal.ZERO) < 0) {
            escrowHolding = BigDecimal.ZERO;
        }

        // Tiền đang khóa / chờ chi
        BigDecimal lockedAmount = BigDecimal.ZERO;
        if (task.getStatus() == MentoringTaskStatus.DISPUTED) {
            lockedAmount = escrowHolding;
        }

        // Trạng thái quyết toán tiền (Mục 5.9 & 289)
        String settlementStatus;
        if (task.getStatus() == MentoringTaskStatus.COMPLETED ||
                task.getStatus() == MentoringTaskStatus.CANCELLED ||
                task.getStatus() == MentoringTaskStatus.RESOLVED) {
            if (escrowHolding.compareTo(BigDecimal.ZERO) == 0 && (totalPayout.compareTo(BigDecimal.ZERO) > 0 || totalRefund.compareTo(BigDecimal.ZERO) > 0)) {
                settlementStatus = "SETTLED";
            } else if (totalPayout.compareTo(BigDecimal.ZERO) > 0 || totalRefund.compareTo(BigDecimal.ZERO) > 0) {
                settlementStatus = "PARTIALLY_SETTLED";
            } else {
                settlementStatus = "UNSETTLED";
            }
        } else {
            settlementStatus = "HOLDING_ESCROW";
        }

        // Lấy vé Dispute / Settlement mới nhất của Task (nếu có)
        MentoringDisputeTicket activeTicket = ticketRepository.findFirstByTaskIdOrderByCreatedAtDesc(task.getId()).orElse(null);

        return AdminTaskFundSummaryResponse.builder()
                .taskId(task.getId())
                .taskTitle(task.getTaskTitle())
                .taskStatus(task.getStatus())
                .requestId(task.getRequest() != null ? task.getRequest().getId() : (task.getDeal() != null && task.getDeal().getRequest() != null ? task.getDeal().getRequest().getId() : null))
                .student(toParticipantResponse(task.getStudent(), "STUDENT"))
                .mentor(toParticipantResponse(task.getMentor(), "MENTOR"))
                .initialPrice(initialPrice)
                .totalTopUpAmount(totalTopUp)
                .totalCollected(totalCollected)
                .escrowHoldingAmount(escrowHolding)
                .lockedAmount(lockedAmount)
                .platformFee(platformFee)
                .totalPayout(totalPayout)
                .totalRefund(totalRefund)
                .currentDeadline(task.getDeadline())
                .settlementStatus(settlementStatus)
                .activeTicketId(activeTicket != null ? activeTicket.getId() : null)
                .activeTicketCode(activeTicket != null ? activeTicket.getTicketCode() : null)
                .activeTicketStatus(activeTicket != null ? activeTicket.getStatus().name() : null)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    @Override
    public MentoringPaymentLedgerResponse retryFailedPayout(Long adminUserId, Long ledgerId, String note) {
        return toLedgerResponse(disbursementService.retryFailedPayout(adminUserId, ledgerId, note));
    }

    @Override
    public BigDecimal getPayoutBalance() {
        return disbursementService.getPayoutBalance();
    }

    private MentoringPaymentLedgerResponse toLedgerResponse(MentoringPaymentLedger l) {
        if (l == null) return null;
        return MentoringPaymentLedgerResponse.builder()
                .id(l.getId())
                .paymentId(l.getPayment() != null ? l.getPayment().getId() : null)
                .taskId(l.getTask() != null ? l.getTask().getId() : null)
                .requestId(l.getRequest() != null ? l.getRequest().getId() : null)
                .dealId(l.getDeal() != null ? l.getDeal().getId() : null)
                .student(toParticipantResponse(l.getStudent(), "STUDENT"))
                .mentor(toParticipantResponse(l.getMentor(), "MENTOR"))
                .amount(l.getAmount())
                .transactionType(l.getTransactionType())
                .status(l.getStatus())
                .providerReference(l.getProviderReference())
                .providerStatus(l.getProviderStatus())
                .failureCode(l.getFailureCode())
                .transactedAt(l.getTransactedAt())
                .deadlineSnapshot(l.getDeadlineSnapshot())
                .note(l.getNote())
                .createdAt(l.getCreatedAt())
                .updatedAt(l.getUpdatedAt())
                .build();
    }

    private MentoringTaskDeadlineExtensionResponse toExtensionResponse(MentoringTaskDeadlineExtension ext) {
        if (ext == null) return null;
        String createdByRole = ext.getTask() != null && ext.getCreatedBy() != null && ext.getTask().getMentor() != null &&
                Objects.equals(ext.getCreatedBy().getId(), ext.getTask().getMentor().getId())
                ? "Mentor"
                : "Student";

        return MentoringTaskDeadlineExtensionResponse.builder()
                .id(ext.getId())
                .taskId(ext.getTask() != null ? ext.getTask().getId() : null)
                .conversationId(ext.getConversation() != null ? ext.getConversation().getId() : null)
                .createdById(ext.getCreatedBy() != null ? ext.getCreatedBy().getId() : null)
                .createdByName(resolveName(ext.getCreatedBy()))
                .createdByAvatar(resolveAvatar(ext.getCreatedBy()))
                .createdByRole(createdByRole)
                .recipientId(ext.getRecipient() != null ? ext.getRecipient().getId() : null)
                .recipientName(resolveName(ext.getRecipient()))
                .recipientAvatar(resolveAvatar(ext.getRecipient()))
                .currentDeadline(ext.getCurrentDeadline())
                .proposedDeadline(ext.getProposedDeadline())
                .reason(ext.getReason())
                .status(ext.getStatus())
                .respondedById(ext.getRespondedBy() != null ? ext.getRespondedBy().getId() : null)
                .respondedByName(resolveName(ext.getRespondedBy()))
                .respondedAt(ext.getRespondedAt())
                .responseNote(ext.getResponseNote())
                .createdAt(ext.getCreatedAt())
                .updatedAt(ext.getUpdatedAt())
                .build();
    }

    private MentoringTaskAmendmentResponse toAmendmentResponse(MentoringTaskAmendment a) {
        if (a == null) return null;
        String createdByRole = a.getTask() != null && a.getCreatedBy() != null && a.getTask().getMentor() != null &&
                Objects.equals(a.getCreatedBy().getId(), a.getTask().getMentor().getId())
                ? "Mentor"
                : "Student";

        return MentoringTaskAmendmentResponse.builder()
                .id(a.getId())
                .taskId(a.getTask() != null ? a.getTask().getId() : null)
                .conversationId(a.getConversation() != null ? a.getConversation().getId() : null)
                .version(a.getVersion())
                .createdById(a.getCreatedBy() != null ? a.getCreatedBy().getId() : null)
                .createdByName(resolveName(a.getCreatedBy()))
                .createdByAvatar(resolveAvatar(a.getCreatedBy()))
                .createdByRole(createdByRole)
                .recipientId(a.getRecipient() != null ? a.getRecipient().getId() : null)
                .recipientName(resolveName(a.getRecipient()))
                .recipientAvatar(resolveAvatar(a.getRecipient()))
                .previousScope(a.getPreviousScope())
                .newScope(a.getNewScope())
                .previousExpectedResult(a.getPreviousExpectedResult())
                .newExpectedResult(a.getNewExpectedResult())
                .additionalAmount(a.getAdditionalAmount())
                .previousDeadline(a.getPreviousDeadline())
                .newDeadline(a.getNewDeadline())
                .reason(a.getReason())
                .status(a.getStatus())
                .respondedById(a.getRespondedBy() != null ? a.getRespondedBy().getId() : null)
                .respondedByName(resolveName(a.getRespondedBy()))
                .respondedAt(a.getRespondedAt())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }

    private MentoringDisputeTicketResponse toTicketResponse(MentoringDisputeTicket t) {
        if (t == null) return null;
        List<MentoringTicketEvidenceResponse> evidences = evidenceRepository != null
                ? evidenceRepository.findByTicketIdOrderByCreatedAtAsc(t.getId()).stream()
                    .map(ev -> MentoringTicketEvidenceResponse.builder()
                            .id(ev.getId())
                            .ticketId(t.getId())
                            .title(ev.getTitle())
                            .description(ev.getDescription())
                            .fileUrl(ev.getFileUrl())
                            .fileName(ev.getFileName())
                            .fileSize(ev.getFileSize())
                            .fileType(ev.getFileType())
                            .createdAt(ev.getCreatedAt())
                            .build())
                    .toList()
                : Collections.emptyList();

        return MentoringDisputeTicketResponse.builder()
                .id(t.getId())
                .ticketCode(t.getTicketCode())
                .ticketType(t.getTicketType())
                .taskId(t.getTask() != null ? t.getTask().getId() : null)
                .taskTitle(t.getTask() != null ? t.getTask().getTaskTitle() : null)
                .title(t.getTitle())
                .description(t.getDescription())
                .disputeReason(t.getDisputeReason())
                .desiredSolution(t.getDesiredSolution())
                .evidences(evidences)
                .mentorAmount(t.getMentorAmount())
                .studentRefund(t.getStudentRefund())
                .totalAmount(t.getTotalAmount())
                .status(t.getStatus())
                .decision(t.getDecision())
                .disputeFee(t.getDisputeFee())
                .settlementStatus(t.getSettlementStatus())
                .mentorPayoutLedgerId(t.getMentorPayoutLedger() != null ? t.getMentorPayoutLedger().getId() : null)
                .studentRefundLedgerId(t.getStudentRefundLedger() != null ? t.getStudentRefundLedger().getId() : null)
                .handledBy(toParticipantResponse(t.getHandledBy(), "ADMIN"))
                .acceptedAt(t.getAcceptedAt())
                .resolvedAt(t.getResolvedAt())
                .resolutionNote(t.getResolutionNote())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private MentoringParticipantResponse toParticipantResponse(User u, String defaultRole) {
        if (u == null) return null;
        String name = resolveName(u);
        String avatar = resolveAvatar(u);
        return MentoringParticipantResponse.builder()
                .id(u.getId())
                .fullName(name)
                .email(u.getEmail())
                .avatarUrl(avatar)
                .role(u.getRole() != null ? u.getRole().getName() : defaultRole)
                .build();
    }

    private String resolveName(User u) {
        if (u == null) return "";
        if (u.getProfile() != null && u.getProfile().getFullName() != null && !u.getProfile().getFullName().isBlank()) {
            return u.getProfile().getFullName().trim();
        }
        return u.getEmail();
    }

    private String resolveAvatar(User u) {
        if (u == null || u.getProfile() == null) return null;
        return u.getProfile().getAvatarUrl();
    }

    private void requireAdmin(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
        boolean isAdmin = user.getRole() != null &&
                ("ADMIN".equalsIgnoreCase(user.getRole().getName()) || "ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName()));
        if (!isAdmin) {
            throw new ForbiddenException("Chỉ Quản trị viên mới có quyền tra cứu Sổ quỹ và Lịch sử tài chính Mentoring");
        }
    }
}
