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
        User currentUser = requireUser(currentUserId);
        String responderRole = isStudent(task, currentUserId) ? "Học viên" : "Mentor";

        Instant now = Instant.now();
        extension.setRespondedBy(currentUser);
        extension.setRespondedAt(now);
        extension.setResponseNote(request.getResponseNote());

        if (Boolean.TRUE.equals(request.getAccept())) {
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
        User currentUser = requireUser(currentUserId);
        User recipient = getOtherParticipant(task, currentUserId);

        BigDecimal additionalAmount = request.getAdditionalAmount() != null
                ? request.getAdditionalAmount()
                : BigDecimal.ZERO;

        if (additionalAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Số tiền bổ sung không được âm.");
        }

        // Đánh dấu các amendment PENDING cũ thành SUPERSEDED
        List<MentoringTaskAmendment> pendingList = amendmentRepository
                .findByTaskIdAndStatus(taskId, MentoringAmendmentStatus.PENDING);
        for (MentoringTaskAmendment oldAmend : pendingList) {
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
        return amendmentRepository.findFirstByTaskIdAndStatusOrderByCreatedAtDesc(task.getId(), MentoringAmendmentStatus.PENDING)
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

        if (total.compareTo(task.getAgreedPrice()) > 0) {
            throw new BadRequestException("Tổng số tiền phân chia (" + formatVnd(total) + ") không được vượt quá tổng quỹ Task (" + formatVnd(task.getAgreedPrice()) + ").");
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
        return task;
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
                || e.getTask().getStatus() == MentoringTaskStatus.IN_PROGRESS;

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
                .build();
    }

    private MentoringTaskAmendmentResponse toAmendmentResponse(
            MentoringTaskAmendment a, Long currentUserId) {

        boolean isRecipient = Objects.equals(a.getRecipient().getId(), currentUserId);
        boolean isPending = a.getStatus() == MentoringAmendmentStatus.PENDING;
        boolean isTaskActive = a.getTask().getStatus() == MentoringTaskStatus.PREPARATION
                || a.getTask().getStatus() == MentoringTaskStatus.IN_PROGRESS;
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
                .canTopUp(isStudent && a.getStatus() == MentoringAmendmentStatus.AWAITING_TOPUP)
                .build();
    }

    private MentoringTaskSettlementProposalResponse toSettlementProposalResponse(
            MentoringTaskSettlementProposal p, Long currentUserId) {

        boolean isRecipient = Objects.equals(p.getRecipient().getId(), currentUserId);
        boolean isPending = p.getStatus() == MentoringSettlementProposalStatus.PENDING;
        boolean isTaskActive = p.getTask().getStatus() == MentoringTaskStatus.PREPARATION
                || p.getTask().getStatus() == MentoringTaskStatus.IN_PROGRESS;

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
                .build();
    }
}
