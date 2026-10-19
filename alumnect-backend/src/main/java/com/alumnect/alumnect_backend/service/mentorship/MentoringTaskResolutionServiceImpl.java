package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringAmendmentStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringExtensionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringSettlementProposalStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskAmendmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskDeadlineExtensionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskSettlementProposalRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.*;
import com.alumnect.alumnect_backend.dto.response.mentorship.*;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskAmendment;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskDeadlineExtension;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskSettlementProposal;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringTaskResolutionServiceImpl implements MentoringTaskResolutionService {

    private final MentoringTaskRepository taskRepository;
    private final MentoringTaskDeadlineExtensionRepository extensionRepository;
    private final MentoringTaskAmendmentRepository amendmentRepository;
    private final MentoringTaskSettlementProposalRepository settlementProposalRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final MentoringConversationService mentoringConversationService;
    private final NotificationService notificationService;
    private final MentoringTaskPaymentService taskPaymentService;
    private final MentoringRules mentoringRules;
    private final com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository ledgerRepository;
    private final MentoringTicketService ticketService;
    private final RefundAccountResolver refundAccountResolver;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    // =========================================================================
    // 1. DEADLINE EXTENSION TICKET (UC109)
    // =========================================================================

    @Override
    @Transactional
    public MentoringTaskDeadlineExtensionResponse createDeadlineExtension(
            Long currentUserId, Long taskId, CreateDeadlineExtensionRequest request) {

        MentoringTask task = requireActiveTask(taskId, currentUserId);
        requireMentor(task, currentUserId, "đề xuất gia hạn Deadline");
        User currentUser = requireUser(currentUserId);

        Instant proposedDeadline = request.getProposedDeadline();
        if (proposedDeadline.isBefore(task.getDeadline()) || proposedDeadline.equals(task.getDeadline())) {
            throw new BadRequestException("Hạn chót đề xuất phải sau hạn chót hiện tại (" + formatDateTime(task.getDeadline()) + ").");
        }
        if (proposedDeadline.isBefore(Instant.now())) {
            throw new BadRequestException("Hạn chót đề xuất phải ở trong tương lai.");
        }

        User recipient = getOtherParticipant(task, currentUserId);

        // Đánh dấu các ticket gia hạn PENDING cũ của Task này là SUPERSEDED
        List<MentoringTaskDeadlineExtension> pendingExtensions = extensionRepository
                .findByTaskIdAndStatus(taskId, MentoringExtensionStatus.PENDING);
        for (MentoringTaskDeadlineExtension oldExt : pendingExtensions) {
            oldExt.setStatus(MentoringExtensionStatus.SUPERSEDED);
            extensionRepository.save(oldExt);
        }

        MentoringTaskDeadlineExtension extension = MentoringTaskDeadlineExtension.builder()
                .task(task)
                .conversation(task.getConversation())
                .createdBy(currentUser)
                .recipient(recipient)
                .currentDeadline(task.getDeadline())
                .proposedDeadline(proposedDeadline)
                .reason(request.getReason().trim())
                .status(MentoringExtensionStatus.PENDING)
                .build();

        MentoringTaskDeadlineExtension saved = extensionRepository.save(extension);

        // Gửi tin nhắn hệ thống vào Chat for Task
        String senderRole = isStudent(task, currentUserId) ? "Học viên" : "Mentor";
        String msg = String.format("📅 [%s] đã gửi Ticket đề xuất gia hạn Deadline đến %s.\nLý do: %s",
                senderRole, formatDateTime(proposedDeadline), request.getReason().trim());
        mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);

        notificationService.sendMentoringTaskEventNotification(
                currentUser, recipient, task,
                "EXTENSION_CONFIRM", String.valueOf(saved.getId()),
                "Cần xác nhận gia hạn Task",
                "Đối phương đã đề xuất thời hạn mới. Vui lòng xem và phản hồi.");

        return toExtensionResponse(saved, currentUserId);
    }

    @Override
    @Transactional
    public MentoringTaskDeadlineExtensionResponse respondDeadlineExtension(
            Long currentUserId, Long extensionId, RespondDeadlineExtensionRequest request) {

        MentoringTaskDeadlineExtension extension = extensionRepository.findById(extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Ticket gia hạn (ID: " + extensionId + ")."));

        if (!Objects.equals(extension.getRecipient().getId(), currentUserId)) {
            throw new ForbiddenException("Bạn không phải người nhận của Ticket gia hạn này.");
        }

        if (extension.getStatus() != MentoringExtensionStatus.PENDING) {
            throw new ConflictException("Ticket gia hạn này đã được xử lý hoặc không còn hiệu lực.");
        }

        MentoringTask task = extension.getTask();
        requireTaskOpenForProposals(task);
        User currentUser = requireUser(currentUserId);
        String responderRole = isStudent(task, currentUserId) ? "Học viên" : "Mentor";

        Instant now = Instant.now();
        extension.setRespondedBy(currentUser);
        extension.setRespondedAt(now);
        extension.setResponseNote(request.getResponseNote());

        if (Boolean.TRUE.equals(request.getAccept())) {
            if (!extension.getProposedDeadline().isAfter(Instant.now())) {
                throw new ConflictException("Hạn chót đề xuất đã qua. Mentor cần gửi đề xuất gia hạn mới.");
            }
            // Kiểm tra deadline hiện tại của Task có còn khớp với thời điểm tạo ticket không
            if (!task.getDeadline().equals(extension.getCurrentDeadline())) {
                throw new ConflictException("Hạn chót hiện tại của Task đã bị thay đổi trước đó, không thể áp dụng Ticket này.");
            }

            // Cập nhật Deadline mới cho Task
            task.setDeadline(extension.getProposedDeadline());
            taskRepository.save(task);

            extension.setStatus(MentoringExtensionStatus.CONFIRMED);

            String msg = String.format("✅ [%s] đã CHẤP NHẬN đề xuất gia hạn Deadline. Thời hạn hoàn thành mới của Task: %s.",
                    responderRole, formatDateTime(extension.getProposedDeadline()));
            mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);
        } else {
            extension.setStatus(MentoringExtensionStatus.REJECTED);

            String note = (request.getResponseNote() != null && !request.getResponseNote().isBlank())
                    ? request.getResponseNote().trim() : "Không có lý do kèm theo";
            String msg = String.format("❌ [%s] đã TỪ CHỐI đề xuất gia hạn Deadline. Hạn chót vẫn giữ nguyên: %s.\nLý do: %s",
                    responderRole, formatDateTime(extension.getCurrentDeadline()), note);
            mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);
        }

        MentoringTaskDeadlineExtension saved = extensionRepository.save(extension);
        notificationService.sendMentoringTaskEventNotification(
                currentUser, extension.getCreatedBy(), task,
                "EXTENSION_RESPONSE", String.valueOf(saved.getId()),
                Boolean.TRUE.equals(request.getAccept()) ? "Đã chấp nhận gia hạn Task" : "Đã từ chối gia hạn Task",
                "Đề xuất gia hạn của bạn đã được đối phương phản hồi.");
        return toExtensionResponse(saved, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringTaskDeadlineExtensionResponse> getDeadlineExtensions(Long currentUserId, Long taskId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        return extensionRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                .map(e -> toExtensionResponse(e, currentUserId))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringTaskDeadlineExtensionResponse getActiveExtension(Long currentUserId, Long taskId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        return extensionRepository.findFirstByTaskIdAndStatusOrderByCreatedAtDesc(task.getId(), MentoringExtensionStatus.PENDING)
                .map(e -> toExtensionResponse(e, currentUserId))
                .orElse(null);
    }

    // =========================================================================
    // 2. TASK AMENDMENT TICKET (UC109, mục 5.8)
    // =========================================================================

    @Override
    @Transactional
    public MentoringTaskAmendmentResponse createTaskAmendment(
            Long currentUserId, Long taskId, CreateTaskAmendmentRequest request) {

        MentoringTask task = requireActiveTask(taskId, currentUserId);
        requireMentor(task, currentUserId, "đề xuất điều chỉnh phạm vi và bổ sung tiền");
        User currentUser = requireUser(currentUserId);
        User recipient = getOtherParticipant(task, currentUserId);

        BigDecimal additionalAmount = request.getAdditionalAmount() != null
                ? request.getAdditionalAmount()
                : BigDecimal.ZERO;

        if (additionalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Số tiền bổ sung không được âm.");
        }
        if (additionalAmount.signum() > 0) {
            mentoringRules.requirePayableAmount(additionalAmount, "Số tiền bổ sung");
        }
        String requestedScope = request.getNewScope() != null && !request.getNewScope().isBlank() ? request.getNewScope().trim() : null;
        String requestedResult = request.getNewExpectedResult() != null && !request.getNewExpectedResult().isBlank()
                ? request.getNewExpectedResult().trim() : null;
        Instant requestedDeadline = request.getNewDeadline();
        if (requestedDeadline != null && !requestedDeadline.isAfter(Instant.now())) {
            throw new BadRequestException("Hạn chót mới phải ở trong tương lai.");
        }
        boolean changesSomething = additionalAmount.signum() > 0
                || (requestedScope != null && !requestedScope.equals(task.getTaskScope()))
                || (requestedResult != null && !requestedResult.equals(task.getExpectedResult()))
                || (requestedDeadline != null && !requestedDeadline.equals(task.getDeadline()));
        if (!changesSomething) {
            throw new BadRequestException("Đề xuất điều chỉnh chưa có thay đổi nào so với Task hiện tại.");
        }

        // Đánh dấu các amendment PENDING cũ thành SUPERSEDED
        List<MentoringTaskAmendment> pendingList = new java.util.ArrayList<>(amendmentRepository
                .findByTaskIdAndStatus(taskId, MentoringAmendmentStatus.PENDING));
        pendingList.addAll(amendmentRepository.findByTaskIdAndStatus(taskId, MentoringAmendmentStatus.AWAITING_TOPUP));
        for (MentoringTaskAmendment oldAmend : pendingList) {
            // Ticket cũ đang chờ top-up bị thay thế: hủy link thanh toán chưa trả để tiền không vào nhầm Ticket cũ
            if (oldAmend.getStatus() == MentoringAmendmentStatus.AWAITING_TOPUP) {
                taskPaymentService.cancelPendingTopUpPayments(oldAmend.getId(), "Ticket điều chỉnh đã được thay thế bằng phiên bản mới");
            }
            oldAmend.setStatus(MentoringAmendmentStatus.SUPERSEDED);
            amendmentRepository.save(oldAmend);
        }

        int version = (int) amendmentRepository.countByTaskId(taskId) + 1;

        MentoringTaskAmendment amendment = MentoringTaskAmendment.builder()
                .task(task)
                .conversation(task.getConversation())
                .createdBy(currentUser)
                .recipient(recipient)
                .version(version)
                .previousScope(task.getTaskScope())
                .newScope(request.getNewScope() != null && !request.getNewScope().isBlank() ? request.getNewScope().trim() : task.getTaskScope())
                .previousExpectedResult(task.getExpectedResult())
                .newExpectedResult(request.getNewExpectedResult() != null && !request.getNewExpectedResult().isBlank() ? request.getNewExpectedResult().trim() : task.getExpectedResult())
                .additionalAmount(additionalAmount)
                .previousDeadline(task.getDeadline())
                .newDeadline(request.getNewDeadline() != null ? request.getNewDeadline() : task.getDeadline())
                .reason(request.getReason().trim())
                .status(MentoringAmendmentStatus.PENDING)
                .build();

        MentoringTaskAmendment saved = amendmentRepository.save(amendment);

        String senderRole = isStudent(task, currentUserId) ? "Học viên" : "Mentor";
        String amountText = additionalAmount.compareTo(BigDecimal.ZERO) > 0
                ? " (Bổ sung thêm: " + formatVnd(additionalAmount) + ")"
                : "";
        String msg = String.format("📝 [%s] đã gửi Ticket điều chỉnh Task (Phiên bản v%d)%s.\nLý do: %s",
                senderRole, version, amountText, request.getReason().trim());
        mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);

        notificationService.sendMentoringTaskEventNotification(
                currentUser, recipient, task,
                "AMENDMENT_CONFIRM", String.valueOf(saved.getId()),
                "Cần xác nhận điều chỉnh Task",
                "Đối phương đã gửi đề xuất điều chỉnh. Vui lòng xem và phản hồi.");

        return toAmendmentResponse(saved, currentUserId);
    }

    @Override
    @Transactional
    public MentoringTaskAmendmentResponse respondTaskAmendment(
            Long currentUserId, Long amendmentId, RespondTaskAmendmentRequest request) {

        MentoringTaskAmendment amendment = amendmentRepository.findById(amendmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Ticket điều chỉnh Task (ID: " + amendmentId + ")."));

        if (!Objects.equals(amendment.getRecipient().getId(), currentUserId)) {
            throw new ForbiddenException("Bạn không phải người nhận của Ticket điều chỉnh này.");
        }

        if (amendment.getStatus() != MentoringAmendmentStatus.PENDING) {
            throw new ConflictException("Ticket điều chỉnh này đã được xử lý hoặc không còn hiệu lực.");
        }

        MentoringTask task = amendment.getTask();
        requireTaskOpenForProposals(task);
        if (Boolean.TRUE.equals(request.getAccept()) && amendment.getNewDeadline() != null
                && !amendment.getNewDeadline().equals(amendment.getPreviousDeadline())
                && !amendment.getNewDeadline().isAfter(Instant.now())) {
            throw new ConflictException("Hạn chót trong đề xuất điều chỉnh đã qua. Mentor cần gửi đề xuất mới.");
        }
        User currentUser = requireUser(currentUserId);
        String responderRole = isStudent(task, currentUserId) ? "Học viên" : "Mentor";

        Instant now = Instant.now();
        amendment.setRespondedBy(currentUser);
        amendment.setRespondedAt(now);

        if (Boolean.TRUE.equals(request.getAccept())) {
            if (amendment.getAdditionalAmount().compareTo(BigDecimal.ZERO) > 0) {
                // Có tăng tiền: Chờ học viên thanh toán bổ sung (UC105 top-up)
                amendment.setStatus(MentoringAmendmentStatus.AWAITING_TOPUP);
                String msg = String.format("🤝 [%s] đã CHẤP NHẬN điều chỉnh Task (v%d). Đang chờ Học viên thanh toán bổ sung %s để áp dụng chính thức vào Task.",
                        responderRole, amendment.getVersion(), formatVnd(amendment.getAdditionalAmount()));
                mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);
            } else {
                // Không tăng tiền: Áp dụng trực tiếp ngay lập tức
                amendment.setStatus(MentoringAmendmentStatus.APPLIED);
                if (amendment.getNewScope() != null) task.setTaskScope(amendment.getNewScope());
                if (amendment.getNewExpectedResult() != null) task.setExpectedResult(amendment.getNewExpectedResult());
                if (amendment.getNewDeadline() != null) task.setDeadline(amendment.getNewDeadline());
                taskRepository.save(task);

                String msg = String.format("✅ [%s] đã CHẤP NHẬN điều chỉnh Task (v%d). Nội dung điều chỉnh đã chính thức có hiệu lực.",
                        responderRole, amendment.getVersion());
                mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);
            }
        } else {
            amendment.setStatus(MentoringAmendmentStatus.REJECTED);
            String note = (request.getResponseNote() != null && !request.getResponseNote().isBlank())
                    ? request.getResponseNote().trim() : "Không có lý do kèm theo";
            String msg = String.format("❌ [%s] đã TỪ CHỐI điều chỉnh Task (v%d).\nLý do: %s",
                    responderRole, amendment.getVersion(), note);
            mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);
        }

        MentoringTaskAmendment saved = amendmentRepository.save(amendment);
        notificationService.sendMentoringTaskEventNotification(
                currentUser, amendment.getCreatedBy(), task,
                "AMENDMENT_RESPONSE", String.valueOf(saved.getId()),
                Boolean.TRUE.equals(request.getAccept()) ? "Đã chấp nhận điều chỉnh Task" : "Đã từ chối điều chỉnh Task",
                amendment.getStatus() == MentoringAmendmentStatus.AWAITING_TOPUP
                        ? "Đề xuất đã được chấp nhận và đang chờ thanh toán bổ sung."
                        : "Đề xuất điều chỉnh của bạn đã được đối phương phản hồi.");
        return toAmendmentResponse(saved, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringTaskAmendmentResponse> getTaskAmendments(Long currentUserId, Long taskId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        return amendmentRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                .map(a -> toAmendmentResponse(a, currentUserId))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringTaskAmendmentResponse getActiveAmendment(Long currentUserId, Long taskId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        // Ticket đang chờ phản hồi, hoặc đã được chấp nhận và đang chờ Học viên thanh toán bổ sung
        return amendmentRepository.findFirstByTaskIdAndStatusOrderByCreatedAtDesc(task.getId(), MentoringAmendmentStatus.PENDING)
                .or(() -> amendmentRepository.findFirstByTaskIdAndStatusOrderByCreatedAtDesc(task.getId(), MentoringAmendmentStatus.AWAITING_TOPUP))
                .map(a -> toAmendmentResponse(a, currentUserId))
                .orElse(null);
    }

    // =========================================================================
    // 3. TASK SETTLEMENT PROPOSAL (UC109, mục 5.6 & 5.7)
    // =========================================================================

    @Override
    @Transactional
    public MentoringTaskSettlementProposalResponse createSettlementProposal(
            Long currentUserId, Long taskId, CreateSettlementProposalRequest request) {

        MentoringTask task = requireActiveTask(taskId, currentUserId);
        User currentUser = requireUser(currentUserId);
        User recipient = getOtherParticipant(task, currentUserId);

        BigDecimal mentorAmount = request.getMentorAmount() != null ? request.getMentorAmount() : BigDecimal.ZERO;
        BigDecimal studentRefund = request.getStudentRefund() != null ? request.getStudentRefund() : BigDecimal.ZERO;
        BigDecimal total = mentorAmount.add(studentRefund);
        mentoringRules.requireWholeVnd(mentorAmount, "Số tiền cho Mentor");
        mentoringRules.requireWholeVnd(studentRefund, "Số tiền hoàn cho Học viên");

        if (isStudent(task, currentUserId) && studentRefund.signum() > 0) {
            requireRefundAccount(currentUserId);
        }

        // Phải chia hết đúng số tiền đang giữ trong quỹ ký quỹ của Task (không để thừa / thiếu tiền)
        BigDecimal escrowBalance = mentoringRules.escrowBalance(task.getId());
        if (total.compareTo(escrowBalance) != 0) {
            throw new BadRequestException("Tổng số tiền phân chia (" + formatVnd(total) + ") phải bằng đúng số tiền đang giữ trong quỹ Task ("
                    + formatVnd(escrowBalance) + ").");
        }

        // Đánh dấu các đề xuất dừng Task PENDING cũ là SUPERSEDED
        settlementProposalRepository.findFirstByTaskIdAndStatusOrderByCreatedAtDesc(taskId, MentoringSettlementProposalStatus.PENDING)
                .ifPresent(oldProp -> {
                    oldProp.setStatus(MentoringSettlementProposalStatus.SUPERSEDED);
                    settlementProposalRepository.save(oldProp);
                });

        MentoringTaskSettlementProposal proposal = MentoringTaskSettlementProposal.builder()
                .task(task)
                .conversation(task.getConversation())
                .createdBy(currentUser)
                .recipient(recipient)
                .mentorAmount(mentorAmount)
                .studentRefund(studentRefund)
                .totalAmount(total)
                .reason(request.getReason().trim())
                .status(MentoringSettlementProposalStatus.PENDING)
                .build();

        MentoringTaskSettlementProposal saved = settlementProposalRepository.save(proposal);

        String senderRole = isStudent(task, currentUserId) ? "Học viên" : "Mentor";
        String msg = String.format("⚖️ [%s] đã gửi đề xuất dừng Task và phân chia tiền:\n- Mentor nhận: %s\n- Học viên hoàn trả: %s\nLý do: %s",
                senderRole, formatVnd(mentorAmount), formatVnd(studentRefund), request.getReason().trim());
        mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);

        notificationService.sendMentoringTaskEventNotification(
                currentUser, recipient, task,
                "SETTLEMENT_CONFIRM", String.valueOf(saved.getId()),
                "Cần xác nhận thỏa thuận Task",
                "Đối phương đã gửi đề xuất dừng Task và phân chia quỹ. Vui lòng phản hồi.");

        return toSettlementProposalResponse(saved, currentUserId);
    }

    @Override
    @Transactional
    public MentoringTaskSettlementProposalResponse respondSettlementProposal(
            Long currentUserId, Long proposalId, RespondSettlementProposalRequest request) {

        MentoringTaskSettlementProposal proposal = settlementProposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Đề xuất phân chia tiền (ID: " + proposalId + ")."));

        if (!Objects.equals(proposal.getRecipient().getId(), currentUserId)) {
            throw new ForbiddenException("Bạn không phải người nhận của đề xuất này.");
        }

        if (proposal.getStatus() != MentoringSettlementProposalStatus.PENDING) {
            throw new ConflictException("Đề xuất này đã được xử lý hoặc không còn hiệu lực.");
        }

        MentoringTask task = proposal.getTask();
        requireTaskOpenForProposals(task);
        if (Boolean.TRUE.equals(request.getAccept()) && isStudent(task, currentUserId)
                && proposal.getStudentRefund() != null && proposal.getStudentRefund().signum() > 0) {
            requireRefundAccount(currentUserId);
        }
        User currentUser = requireUser(currentUserId);
        String responderRole = isStudent(task, currentUserId) ? "Học viên" : "Mentor";

        Instant now = Instant.now();
        proposal.setRespondedBy(currentUser);
        proposal.setRespondedAt(now);

        if (Boolean.TRUE.equals(request.getAccept())) {
            proposal.setStatus(MentoringSettlementProposalStatus.ACCEPTED);

            String msg = String.format("🤝 Cả hai bên đã ĐỒNG THUẬN dừng Task và phân chia số tiền:\n- Mentor nhận: %s\n- Học viên hoàn trả: %s.\nHệ thống sẵn sàng gửi Settlement Ticket (UC111) để Admin tiến hành thanh toán & hoàn tiền.",
                    formatVnd(proposal.getMentorAmount()), formatVnd(proposal.getStudentRefund()));
            mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);
        } else {
            proposal.setStatus(MentoringSettlementProposalStatus.REJECTED);

            String note = (request.getResponseNote() != null && !request.getResponseNote().isBlank())
                    ? request.getResponseNote().trim() : "Không đồng ý phân chia theo tỷ lệ này";
            String msg = String.format("❌ [%s] đã TỪ CHỐI đề xuất dừng Task và phân chia tiền.\nLý do: %s.\nHai bên có thể thương lượng lại hoặc gửi Dispute Ticket (UC112) cho Admin phân xử.",
                    responderRole, note);
            mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);
        }

        MentoringTaskSettlementProposal saved = settlementProposalRepository.save(proposal);
        if (saved.getStatus() == MentoringSettlementProposalStatus.ACCEPTED) {
            // Dừng Task ngay khi hai bên đồng thuận: gửi Settlement Ticket cho Admin, Task không còn nhận Work Log
            ticketService.submitSettlementTicket(currentUserId, task.getId(),
                    com.alumnect.alumnect_backend.dto.request.mentorship.SubmitSettlementTicketRequest.builder()
                            .proposalId(saved.getId())
                            .note("Tự động gửi khi hai bên đồng thuận dừng Task.")
                            .build());
        }
        notificationService.sendMentoringTaskEventNotification(
                currentUser, proposal.getCreatedBy(), task,
                "SETTLEMENT_RESPONSE", String.valueOf(saved.getId()),
                Boolean.TRUE.equals(request.getAccept()) ? "Đã đồng ý thỏa thuận Task" : "Đã từ chối thỏa thuận Task",
                "Đề xuất dừng Task và phân chia quỹ của bạn đã được phản hồi.");
        return toSettlementProposalResponse(saved, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringTaskSettlementProposalResponse> getSettlementProposals(Long currentUserId, Long taskId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        return settlementProposalRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                .map(p -> toSettlementProposalResponse(p, currentUserId))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringTaskSettlementProposalResponse getActiveSettlementProposal(Long currentUserId, Long taskId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        return settlementProposalRepository.findFirstByTaskIdAndStatusOrderByCreatedAtDesc(task.getId(), MentoringSettlementProposalStatus.PENDING)
                .map(p -> toSettlementProposalResponse(p, currentUserId))
                .orElse(null);
    }

    // =========================================================================
    // HỦY / TỪ CHỐI ĐỀ XUẤT
    // =========================================================================

    @Override
    @Transactional
    public MentoringTaskDeadlineExtensionResponse cancelDeadlineExtension(Long currentUserId, Long extensionId) {
        MentoringTaskDeadlineExtension extension = extensionRepository.findById(extensionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Ticket gia hạn (ID: " + extensionId + ")."));
        if (!Objects.equals(extension.getCreatedBy().getId(), currentUserId)) {
            throw new ForbiddenException("Chỉ người tạo mới được hủy đề xuất gia hạn này.");
        }
        if (extension.getStatus() != MentoringExtensionStatus.PENDING) {
            throw new ConflictException("Đề xuất gia hạn đã được xử lý, không thể hủy.");
        }
        MentoringTask task = extension.getTask();
        User currentUser = requireUser(currentUserId);
        extension.setStatus(MentoringExtensionStatus.CANCELLED);
        MentoringTaskDeadlineExtension saved = extensionRepository.save(extension);

        mentoringConversationService.postSystemMessage(task.getConversation(), currentUser,
                "↩️ Mentor đã HỦY đề xuất gia hạn Deadline. Hạn chót vẫn giữ nguyên: " + formatDateTime(task.getDeadline()) + ".");
        notificationService.sendMentoringTaskEventNotification(currentUser, extension.getRecipient(), task,
                "EXTENSION_CANCELLED", String.valueOf(saved.getId()),
                "Đề xuất gia hạn đã bị hủy", "Mentor đã rút lại đề xuất gia hạn Deadline.");
        return toExtensionResponse(saved, currentUserId);
    }

    @Override
    @Transactional
    public MentoringTaskAmendmentResponse cancelTaskAmendment(Long currentUserId, Long amendmentId, String reason) {
        MentoringTaskAmendment amendment = amendmentRepository.findByIdForUpdate(amendmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Ticket điều chỉnh Task (ID: " + amendmentId + ")."));
        MentoringTask task = amendment.getTask();
        User currentUser = requireUser(currentUserId);
        boolean isCreator = Objects.equals(amendment.getCreatedBy().getId(), currentUserId);
        boolean isStudentRecipient = Objects.equals(amendment.getRecipient().getId(), currentUserId) && isStudent(task, currentUserId);
        String note = reason != null && !reason.isBlank() ? reason.trim() : null;
        boolean awaitingTopUp = amendment.getStatus() == MentoringAmendmentStatus.AWAITING_TOPUP;

        String message;
        String title;
        if (isCreator && (amendment.getStatus() == MentoringAmendmentStatus.PENDING || awaitingTopUp)) {
            amendment.setStatus(MentoringAmendmentStatus.CANCELLED);
            title = "Đề xuất điều chỉnh đã bị hủy";
            message = String.format("↩️ Mentor đã HỦY đề xuất điều chỉnh Task (v%d). Task giữ nguyên phạm vi, giá và deadline hiện tại.%s",
                    amendment.getVersion(), note != null ? "\nLý do: " + note : "");
        } else if (isStudentRecipient && awaitingTopUp) {
            amendment.setStatus(MentoringAmendmentStatus.REJECTED);
            amendment.setRespondedBy(currentUser);
            amendment.setRespondedAt(Instant.now());
            title = "Học viên từ chối thanh toán bổ sung";
            message = String.format("❌ Học viên đã TỪ CHỐI thanh toán bổ sung %s cho điều chỉnh Task (v%d). Task giữ nguyên phạm vi, giá và deadline hiện tại.%s",
                    formatVnd(amendment.getAdditionalAmount()), amendment.getVersion(), note != null ? "\nLý do: " + note : "");
        } else {
            throw new ConflictException("Bạn không thể hủy đề xuất điều chỉnh này ở trạng thái hiện tại.");
        }

        if (awaitingTopUp) {
            // Hủy link thanh toán bổ sung chưa trả để Học viên không trả tiền cho đề xuất đã đóng
            taskPaymentService.cancelPendingTopUpPayments(amendment.getId(), "Đề xuất điều chỉnh đã bị hủy");
        }
        MentoringTaskAmendment saved = amendmentRepository.save(amendment);
        mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, message);
        User other = getOtherParticipant(task, currentUserId);
        notificationService.sendMentoringTaskEventNotification(currentUser, other, task,
                "AMENDMENT_CLOSED", String.valueOf(saved.getId()), title, message.replaceFirst("^\\S+ ", ""));
        return toAmendmentResponse(saved, currentUserId);
    }

    @Override
    @Transactional
    public MentoringTaskSettlementProposalResponse cancelSettlementProposal(Long currentUserId, Long proposalId) {
        MentoringTaskSettlementProposal proposal = settlementProposalRepository.findById(proposalId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Đề xuất phân chia tiền (ID: " + proposalId + ")."));
        if (!Objects.equals(proposal.getCreatedBy().getId(), currentUserId)) {
            throw new ForbiddenException("Chỉ người tạo mới được hủy đề xuất dừng Task này.");
        }
        if (proposal.getStatus() != MentoringSettlementProposalStatus.PENDING) {
            throw new ConflictException("Đề xuất dừng Task đã được xử lý, không thể hủy.");
        }
        MentoringTask task = proposal.getTask();
        User currentUser = requireUser(currentUserId);
        proposal.setStatus(MentoringSettlementProposalStatus.CANCELLED);
        MentoringTaskSettlementProposal saved = settlementProposalRepository.save(proposal);

        String role = isStudent(task, currentUserId) ? "Học viên" : "Mentor";
        mentoringConversationService.postSystemMessage(task.getConversation(), currentUser,
                "↩️ " + role + " đã HỦY đề xuất dừng Task. Task tiếp tục thực hiện bình thường.");
        notificationService.sendMentoringTaskEventNotification(currentUser, proposal.getRecipient(), task,
                "SETTLEMENT_CANCELLED", String.valueOf(saved.getId()),
                "Đề xuất dừng Task đã bị hủy", role + " đã rút lại đề xuất dừng Task.");
        return toSettlementProposalResponse(saved, currentUserId);
    }

    // =========================================================================
    // HELPER & MAPPING METHODS
    // =========================================================================

    private MentoringTask requireActiveTask(Long taskId, Long currentUserId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        if (task.getStatus() == MentoringTaskStatus.COMPLETED) {
            throw new BadRequestException("Task đã hoàn thành, không thể thao tác.");
        }
        if (task.getStatus() == MentoringTaskStatus.CANCELLED) {
            throw new BadRequestException("Task đã bị hủy, không thể thao tác.");
        }
        if (task.getStatus() == MentoringTaskStatus.DISPUTED) {
            throw new BadRequestException("Task đang trong trạng thái tranh chấp, mọi thay đổi đều bị khóa.");
        }
        if (task.getStatus() == MentoringTaskStatus.RESOLVED) {
            throw new BadRequestException("Task đã được Ban Quản Trị giải quyết, không thể thao tác.");
        }
        return task;
    }

    private boolean isTaskOpenForProposals(MentoringTask task) {
        return task.getStatus() == MentoringTaskStatus.PREPARATION
                || task.getStatus() == MentoringTaskStatus.IN_PROGRESS
                || task.getStatus() == MentoringTaskStatus.SUBMITTED;
    }

    /** Đề xuất chỉ được phản hồi khi Task còn đang thực hiện. */
    private void requireTaskOpenForProposals(MentoringTask task) {
        if (!isTaskOpenForProposals(task)) {
            throw new ConflictException("Task không còn ở trạng thái thực hiện nên không thể phản hồi đề xuất này.");
        }
    }

    /** Học viên phải khai báo tài khoản nhận hoàn tiền trước khi thỏa thuận dừng Task có hoàn tiền. */
    private void requireRefundAccount(Long studentId) {
        if (!refundAccountResolver.exists(studentId)) {
            throw new BadRequestException("Vui lòng khai báo tài khoản nhận hoàn tiền (mục Hoàn tiền) trước khi gửi hoặc đồng ý thỏa thuận dừng Task có hoàn tiền.");
        }
    }

    /** Gia hạn và điều chỉnh/tăng tiền do Mentor (người được thuê) đề xuất; Học viên chỉ phản hồi. */
    private void requireMentor(MentoringTask task, Long currentUserId, String action) {
        if (!Objects.equals(task.getMentor().getId(), currentUserId)) {
            throw new ForbiddenException("Chỉ Mentor của Task mới có quyền " + action + ". Học viên có thể phản hồi, thỏa thuận dừng Task hoặc mở khiếu nại.");
        }
    }

    private MentoringTask requireParticipantTask(Long taskId, Long currentUserId) {
        MentoringTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Task với ID: " + taskId));
        boolean isStudent = Objects.equals(task.getStudent().getId(), currentUserId);
        boolean isMentor = Objects.equals(task.getMentor().getId(), currentUserId);
        if (!isStudent && !isMentor) {
            throw new ForbiddenException("Bạn không phải người tham gia (Student/Mentor) của Task này.");
        }
        return task;
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
    }

    private boolean isStudent(MentoringTask task, Long userId) {
        return Objects.equals(task.getStudent().getId(), userId);
    }

    private User getOtherParticipant(MentoringTask task, Long currentUserId) {
        return isStudent(task, currentUserId) ? task.getMentor() : task.getStudent();
    }

    private String getDisplayName(User user) {
        if (user == null) return "Người dùng";
        UserProfile p = userProfileRepository.findById(user.getId()).orElse(null);
        if (p != null && p.getFullName() != null && !p.getFullName().isBlank()) {
            return p.getFullName();
        }
        return user.getEmail();
    }

    private String getAvatarUrl(User user) {
        if (user == null) return null;
        UserProfile p = userProfileRepository.findById(user.getId()).orElse(null);
        return p != null ? p.getAvatarUrl() : null;
    }

    private String formatDateTime(Instant instant) {
        if (instant == null) return "";
        return DATE_TIME_FORMATTER.format(instant);
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) return "0đ";
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        return nf.format(amount) + "đ";
    }

    private MentoringTaskDeadlineExtensionResponse toExtensionResponse(
            MentoringTaskDeadlineExtension e, Long currentUserId) {

        boolean isRecipient = Objects.equals(e.getRecipient().getId(), currentUserId);
        boolean isPending = e.getStatus() == MentoringExtensionStatus.PENDING;
        boolean isTaskActive = e.getTask().getStatus() == MentoringTaskStatus.PREPARATION
                || e.getTask().getStatus() == MentoringTaskStatus.IN_PROGRESS
                || e.getTask().getStatus() == MentoringTaskStatus.SUBMITTED;

        return MentoringTaskDeadlineExtensionResponse.builder()
                .id(e.getId())
                .taskId(e.getTask().getId())
                .conversationId(e.getConversation() != null ? e.getConversation().getId() : null)
                .createdById(e.getCreatedBy().getId())
                .createdByName(getDisplayName(e.getCreatedBy()))
                .createdByAvatar(getAvatarUrl(e.getCreatedBy()))
                .createdByRole(isStudent(e.getTask(), e.getCreatedBy().getId()) ? "Học viên" : "Mentor")
                .recipientId(e.getRecipient().getId())
                .recipientName(getDisplayName(e.getRecipient()))
                .recipientAvatar(getAvatarUrl(e.getRecipient()))
                .currentDeadline(e.getCurrentDeadline())
                .proposedDeadline(e.getProposedDeadline())
                .reason(e.getReason())
                .status(e.getStatus())
                .respondedById(e.getRespondedBy() != null ? e.getRespondedBy().getId() : null)
                .respondedByName(e.getRespondedBy() != null ? getDisplayName(e.getRespondedBy()) : null)
                .respondedAt(e.getRespondedAt())
                .responseNote(e.getResponseNote())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .canConfirm(isRecipient && isPending && isTaskActive)
                .canReject(isRecipient && isPending && isTaskActive)
                .canCancel(Objects.equals(e.getCreatedBy().getId(), currentUserId) && isPending && isTaskActive)
                .build();
    }

    private MentoringTaskAmendmentResponse toAmendmentResponse(
            MentoringTaskAmendment a, Long currentUserId) {

        boolean isRecipient = Objects.equals(a.getRecipient().getId(), currentUserId);
        boolean isPending = a.getStatus() == MentoringAmendmentStatus.PENDING;
        boolean isTaskActive = a.getTask().getStatus() == MentoringTaskStatus.PREPARATION
                || a.getTask().getStatus() == MentoringTaskStatus.IN_PROGRESS
                || a.getTask().getStatus() == MentoringTaskStatus.SUBMITTED;
        boolean isStudent = isStudent(a.getTask(), currentUserId);

        return MentoringTaskAmendmentResponse.builder()
                .id(a.getId())
                .taskId(a.getTask().getId())
                .conversationId(a.getConversation() != null ? a.getConversation().getId() : null)
                .version(a.getVersion())
                .createdById(a.getCreatedBy().getId())
                .createdByName(getDisplayName(a.getCreatedBy()))
                .createdByAvatar(getAvatarUrl(a.getCreatedBy()))
                .createdByRole(isStudent(a.getTask(), a.getCreatedBy().getId()) ? "Học viên" : "Mentor")
                .recipientId(a.getRecipient().getId())
                .recipientName(getDisplayName(a.getRecipient()))
                .recipientAvatar(getAvatarUrl(a.getRecipient()))
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
                .respondedByName(a.getRespondedBy() != null ? getDisplayName(a.getRespondedBy()) : null)
                .respondedAt(a.getRespondedAt())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .canConfirm(isRecipient && isPending && isTaskActive)
                .canReject(isRecipient && isPending && isTaskActive)
                .canTopUp(isStudent && a.getStatus() == MentoringAmendmentStatus.AWAITING_TOPUP && isTaskActive)
                .canCancel(Objects.equals(a.getCreatedBy().getId(), currentUserId) && isTaskActive
                        && (isPending || a.getStatus() == MentoringAmendmentStatus.AWAITING_TOPUP))
                .canDeclineTopUp(isStudent && isRecipient && a.getStatus() == MentoringAmendmentStatus.AWAITING_TOPUP)
                .build();
    }

    private MentoringTaskSettlementProposalResponse toSettlementProposalResponse(
            MentoringTaskSettlementProposal p, Long currentUserId) {

        boolean isRecipient = Objects.equals(p.getRecipient().getId(), currentUserId);
        boolean isPending = p.getStatus() == MentoringSettlementProposalStatus.PENDING;
        boolean isTaskActive = p.getTask().getStatus() == MentoringTaskStatus.PREPARATION
                || p.getTask().getStatus() == MentoringTaskStatus.IN_PROGRESS
                || p.getTask().getStatus() == MentoringTaskStatus.SUBMITTED;

        return MentoringTaskSettlementProposalResponse.builder()
                .id(p.getId())
                .taskId(p.getTask().getId())
                .conversationId(p.getConversation() != null ? p.getConversation().getId() : null)
                .createdById(p.getCreatedBy().getId())
                .createdByName(getDisplayName(p.getCreatedBy()))
                .createdByAvatar(getAvatarUrl(p.getCreatedBy()))
                .createdByRole(isStudent(p.getTask(), p.getCreatedBy().getId()) ? "Học viên" : "Mentor")
                .recipientId(p.getRecipient().getId())
                .recipientName(getDisplayName(p.getRecipient()))
                .recipientAvatar(getAvatarUrl(p.getRecipient()))
                .mentorAmount(p.getMentorAmount())
                .studentRefund(p.getStudentRefund())
                .totalAmount(p.getTotalAmount())
                .reason(p.getReason())
                .status(p.getStatus())
                .respondedById(p.getRespondedBy() != null ? p.getRespondedBy().getId() : null)
                .respondedByName(p.getRespondedBy() != null ? getDisplayName(p.getRespondedBy()) : null)
                .respondedAt(p.getRespondedAt())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .canAccept(isRecipient && isPending && isTaskActive)
                .canReject(isRecipient && isPending && isTaskActive)
                .canCancel(Objects.equals(p.getCreatedBy().getId(), currentUserId) && isPending && isTaskActive)
                .refundAccountRequired(isRecipient && isPending && isStudent(p.getTask(), currentUserId)
                        && p.getStudentRefund() != null && p.getStudentRefund().signum() > 0
                        && !refundAccountResolver.exists(currentUserId))
                .build();
    }
}
