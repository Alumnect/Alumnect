package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.*;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDisputeTicketRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskCompletionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskDeadlineExtensionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskSettlementProposalRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTicketEvidenceRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringWorkLogRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.AdminResolveTicketRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateDisputeTicketRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.SubmitSettlementTicketRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.TicketEvidenceRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.*;
import com.alumnect.alumnect_backend.entity.mentorship.*;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringWorkLogMapper;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTicketMessageRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringTicketMessageRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTicketMessageResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Triển khai dịch vụ quản lý các Ticket gửi Admin (UC111 & UC112).
 * Xử lý tạo Settlement Ticket cho phương án thỏa thuận dừng Task đã đồng thuận,
 * bảo đảm tính toàn vẹn số tiền và tích hợp tin nhắn hệ thống vào Chat for Task.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringTicketServiceImpl implements MentoringTicketService {

    private final MentoringDisputeTicketRepository ticketRepository;
    private final MentoringTaskRepository taskRepository;
    private final MentoringTaskSettlementProposalRepository proposalRepository;
    private final MentoringTicketEvidenceRepository evidenceRepository;
    private final MentoringTicketMessageRepository messageRepository;
    private final MentoringPaymentLedgerRepository ledgerRepository;
    private final UserRepository userRepository;
    private final MentoringConversationService mentoringConversationService;
    private final NotificationService notificationService;
    private final MentoringTaskDeadlineExtensionRepository extensionRepository;
    private final MentoringWorkLogRepository workLogRepository;
    private final MentoringTaskCompletionRepository completionRepository;
    private final MentoringWorkLogMapper workLogMapper;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
    private final SimpMessagingTemplate messagingTemplate;

    private static final List<MentoringTicketStatus> ACTIVE_TICKET_STATUSES =
            List.of(MentoringTicketStatus.OPEN, MentoringTicketStatus.IN_REVIEW);

    @Override
    @Transactional(readOnly = true)
    public MentoringSettlementSnapshotResponse getSettlementSnapshot(Long currentUserId, Long taskId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);

        // Tìm đề xuất thỏa thuận dừng Task đã được đồng thuận mới nhất
        Optional<MentoringTaskSettlementProposal> proposalOpt = proposalRepository
                .findFirstByTaskIdAndStatusOrderByCreatedAtDesc(task.getId(), MentoringSettlementProposalStatus.ACCEPTED);

        // Nếu chưa có đề xuất ACCEPTED, lấy đề xuất mới nhất để xem tiến trình
        if (proposalOpt.isEmpty()) {
            proposalOpt = proposalRepository.findFirstByTaskIdOrderByCreatedAtDesc(task.getId());
        }

        if (proposalOpt.isEmpty()) {
            return null;
        }

        MentoringTaskSettlementProposal p = proposalOpt.get();
        boolean hasOpenTicket = ticketRepository.existsByTaskIdAndStatusIn(task.getId(), ACTIVE_TICKET_STATUSES);
        boolean isAgreed = p.getStatus() == MentoringSettlementProposalStatus.ACCEPTED;
        boolean canSubmitTicket = isAgreed && !hasOpenTicket;

        boolean isProposerStudent = Objects.equals(task.getStudent().getId(), p.getCreatedBy().getId());
        String proposerRole = isProposerStudent ? "Học viên" : "Mentor";
        String responderRole = isProposerStudent ? "Mentor" : "Học viên";

        return MentoringSettlementSnapshotResponse.builder()
                .taskId(task.getId())
                .taskTitle(task.getTaskTitle())
                .proposalId(p.getId())
                .mentorAmount(p.getMentorAmount())
                .studentRefund(p.getStudentRefund())
                .totalAmount(p.getTotalAmount())
                .reason(p.getReason())
                .proposerName(mentoringConversationService.displayName(p.getCreatedBy()))
                .proposerRole(proposerRole)
                .responderName(p.getRespondedBy() != null ? mentoringConversationService.displayName(p.getRespondedBy()) : null)
                .responderRole(p.getRespondedBy() != null ? responderRole : null)
                .agreedAt(p.getRespondedAt())
                .isAgreed(isAgreed)
                .canSubmitTicket(canSubmitTicket)
                .hasOpenTicket(hasOpenTicket)
                .build();
    }

    @Override
    @Transactional
    public MentoringDisputeTicketResponse submitSettlementTicket(
            Long currentUserId, Long taskId, SubmitSettlementTicketRequest request) {

        log.info("Người dùng id={} yêu cầu gửi Settlement Ticket cho Task id={}, proposalId={}",
                currentUserId, taskId, request.getProposalId());

        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        User currentUser = requireUser(currentUserId);

        // 1. Kiểm tra đề xuất thỏa thuận
        MentoringTaskSettlementProposal proposal = proposalRepository.findById(request.getProposalId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thỏa thuận phân chia tiền với ID: " + request.getProposalId()));

        if (!Objects.equals(proposal.getTask().getId(), taskId)) {
            throw new BadRequestException("Thỏa thuận phân chia tiền không thuộc về nhiệm vụ Task được chỉ định.");
        }

        // 2. Kiểm tra điều kiện tiên quyết: Cả hai bên phải ĐỒNG THUẬN (ACCEPTED)
        if (proposal.getStatus() != MentoringSettlementProposalStatus.ACCEPTED) {
            throw new ConflictException("Thỏa thuận phân chia tiền chưa được cả hai bên xác nhận đồng thuận.");
        }

        // 3. Kiểm tra tính hợp lệ của số tiền
        BigDecimal total = proposal.getMentorAmount().add(proposal.getStudentRefund());
        if (total.compareTo(proposal.getTotalAmount()) != 0) {
            throw new BadRequestException("Số tiền phân chia không hợp lệ: Tổng tiền chia (" + total + ") không khớp với ngân sách của Task (" + proposal.getTotalAmount() + ").");
        }

        // 4. Kiểm tra tránh gửi Ticket trùng lặp đang mở
        if (ticketRepository.existsByTaskIdAndStatusIn(task.getId(), ACTIVE_TICKET_STATUSES)) {
            throw new ConflictException("Nhiệm vụ này đã có một Ticket đang chờ Ban Quản Trị tiếp nhận xử lý.");
        }

        // 5. Tạo mã hiển thị ticketCode duy nhất: ST-YYYYMMDD-XXXX
        String datePart = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDate.now());
        String randomSuffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String ticketCode = "ST-" + datePart + "-" + randomSuffix;

        // 6. Tạo Settlement Ticket
        String description = proposal.getReason();
        if (request.getNote() != null && !request.getNote().isBlank()) {
            description += "\n\n[Ghi chú thêm gửi Admin]: " + request.getNote().trim();
        }

        MentoringDisputeTicket ticket = MentoringDisputeTicket.builder()
                .ticketCode(ticketCode)
                .ticketType(MentoringTicketType.SETTLEMENT)
                .task(task)
                .conversation(task.getConversation())
                .settlementProposal(proposal)
                .createdBy(currentUser)
                .student(task.getStudent())
                .mentor(task.getMentor())
                .title("Thỏa thuận dừng Task #" + task.getId() + " - Yêu cầu giải ngân & hoàn tiền")
                .description(description)
                .mentorAmount(proposal.getMentorAmount())
                .studentRefund(proposal.getStudentRefund())
                .totalAmount(proposal.getTotalAmount())
                .status(MentoringTicketStatus.OPEN)
                .build();

        MentoringDisputeTicket savedTicket = ticketRepository.save(ticket);

        // 7. Cập nhật trạng thái Task sang CANCELLED (dừng thực hiện chờ Admin xử lý quyết toán/hoàn tiền)
        task.setStatus(MentoringTaskStatus.CANCELLED);
        taskRepository.save(task);

        // 8. Gửi tin nhắn hệ thống realtime vào Chat for Task
        if (task.getConversation() != null) {
            String msg = String.format("🏛️ [Hệ thống] Settlement Ticket đã thỏa thuận (#%s) đã được gửi tới Ban Quản Trị để xử lý quyết toán thù lao cho Mentor (%s) và hoàn trả cho Học viên (%s).",
                    ticketCode,
                    formatVnd(proposal.getMentorAmount()),
                    formatVnd(proposal.getStudentRefund()));
            mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, msg);
        }

        log.info("Tạo Settlement Ticket id={}, code={} cho Task id={} thành công",
                savedTicket.getId(), savedTicket.getTicketCode(), taskId);
        return toTicketResponse(savedTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringDisputeTicketResponse getActiveTicket(Long currentUserId, Long taskId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        return ticketRepository.findFirstByTaskIdAndStatusInOrderByCreatedAtDesc(task.getId(), ACTIVE_TICKET_STATUSES)
                .map(this::toTicketResponse)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringDisputeTicketResponse> getTicketsByTaskId(Long currentUserId, Long taskId) {
        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        return ticketRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                .map(this::toTicketResponse)
                .toList();
    }

    @Override
    @Transactional
    public MentoringDisputeTicketResponse createDisputeTicket(
            Long currentUserId, Long taskId, CreateDisputeTicketRequest request) {

        log.info("Người dùng id={} yêu cầu tạo Dispute Ticket cho Task id={}", currentUserId, taskId);

        MentoringTask task = requireParticipantTask(taskId, currentUserId);
        User currentUser = requireUser(currentUserId);

        // 1. Kiểm tra trạng thái Task: Không được khiếu nại Task đã hoàn thành COMPLETED
        if (task.getStatus() == MentoringTaskStatus.COMPLETED) {
            throw new BadRequestException("Nhiệm vụ đã hoàn thành thành công, không thể tạo khiếu nại tranh chấp.");
        }

        // 2. Chống tạo vé trùng lặp khi đã có vé OPEN hoặc IN_REVIEW
        boolean hasActiveTicket = ticketRepository.existsByTaskIdAndStatusIn(task.getId(), ACTIVE_TICKET_STATUSES);
        if (hasActiveTicket) {
            throw new ConflictException("Nhiệm vụ này đã có một Ticket đang chờ Ban Quản Trị tiếp nhận xử lý.");
        }

        // 3. Sinh mã vé duy nhất: DP-YYYYMMDD-XXXX
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        int rand = 100000 + new Random().nextInt(900000);
        String ticketCode = "DP-" + datePart + "-" + rand;

        // 4. Tạo bản ghi MentoringDisputeTicket
        MentoringDisputeTicket ticket = MentoringDisputeTicket.builder()
                .ticketCode(ticketCode)
                .ticketType(MentoringTicketType.DISPUTE)
                .task(task)
                .conversation(task.getDeal() != null ? task.getDeal().getConversation() : null)
                .settlementProposal(null)
                .createdBy(currentUser)
                .student(task.getStudent())
                .mentor(task.getMentor())
                .title(request.getTitle())
                .description(request.getDescription())
                .disputeReason(request.getDisputeReason())
                .desiredSolution(request.getDesiredSolution())
                .mentorAmount(BigDecimal.ZERO)
                .studentRefund(BigDecimal.ZERO)
                .totalAmount(task.getAgreedPrice() != null ? task.getAgreedPrice() : BigDecimal.ZERO)
                .status(MentoringTicketStatus.OPEN)
                .build();

        MentoringDisputeTicket savedTicket = ticketRepository.save(ticket);

        // 5. Lưu các bằng chứng ban đầu (initial evidences) nếu có
        List<MentoringTicketEvidenceResponse> evidenceResponses = new ArrayList<>();
        if (request.getInitialEvidences() != null && !request.getInitialEvidences().isEmpty()) {
            for (TicketEvidenceRequest evReq : request.getInitialEvidences()) {
                MentoringTicketEvidence ev = MentoringTicketEvidence.builder()
                        .ticket(savedTicket)
                        .uploadedBy(currentUser)
                        .title(evReq.getTitle())
                        .description(evReq.getDescription())
                        .fileUrl(evReq.getFileUrl())
                        .fileName(evReq.getFileName())
                        .fileSize(evReq.getFileSize())
                        .fileType(evReq.getFileType())
                        .build();
                MentoringTicketEvidence savedEv = evidenceRepository.save(ev);
                evidenceResponses.add(toEvidenceResponse(savedEv));
            }
        }

        // 6. Chuyển trạng thái Task sang DISPUTED (đóng băng hoạt động & payout ON_HOLD)
        task.setStatus(MentoringTaskStatus.DISPUTED);
        taskRepository.save(task);

        // 7. Gửi thông báo hệ thống realtime vào Chat for Task
        String senderRole = Objects.equals(currentUserId, task.getStudent().getId()) ? "Học viên" : "Mentor";
        String systemMessage = String.format(
                "⚠️ [HỆ THỐNG] Đã khởi tạo Khiếu nại / Tranh chấp [%s] gửi tới Ban Quản Trị do %s yêu cầu giải quyết.\n" +
                "• Lý do: %s\n" +
                "• Phương án mong muốn: %s\n" +
                "Nhiệm vụ chính thức chuyển sang trạng thái DISPUTED. Mọi thao tác hoàn thành và quyết toán tạm thời đóng băng (ON_HOLD) để BQT tiếp nhận và phân xử.",
                ticketCode, senderRole, request.getDisputeReason(), request.getDesiredSolution()
        );

        try {
            if (task.getConversation() != null) {
                mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, systemMessage);
            }
        } catch (Exception e) {
            log.error("Không thể gửi tin nhắn hệ thống realtime cho Dispute Ticket: {}", e.getMessage());
        }

        MentoringDisputeTicketResponse response = toTicketResponse(savedTicket);
        response.setEvidences(evidenceResponses);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringTicketEvidenceResponse> getTicketEvidences(Long currentUserId, Long ticketId) {
        MentoringDisputeTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Ticket với ID: " + ticketId));

        boolean isStudent = Objects.equals(ticket.getStudent().getId(), currentUserId);
        boolean isMentor = Objects.equals(ticket.getMentor().getId(), currentUserId);
        boolean isCreator = Objects.equals(ticket.getCreatedBy().getId(), currentUserId);

        if (!isStudent && !isMentor && !isCreator) {
            throw new ForbiddenException("Bạn không có quyền truy cập bằng chứng của Ticket này.");
        }

        return evidenceRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
                .map(this::toEvidenceResponse)
                .toList();
    }

    @Override
    @Transactional
    public MentoringTicketEvidenceResponse addTicketEvidence(
            Long currentUserId, Long ticketId, TicketEvidenceRequest request) {

        log.info("Người dùng id={} yêu cầu bổ sung bằng chứng cho Ticket id={}", currentUserId, ticketId);

        MentoringDisputeTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Ticket với ID: " + ticketId));

        User currentUser = requireUser(currentUserId);

        boolean isStudent = Objects.equals(ticket.getStudent().getId(), currentUserId);
        boolean isMentor = Objects.equals(ticket.getMentor().getId(), currentUserId);
        boolean isCreator = Objects.equals(ticket.getCreatedBy().getId(), currentUserId);

        if (!isStudent && !isMentor && !isCreator) {
            throw new ForbiddenException("Bạn không có quyền nộp bằng chứng cho Ticket này.");
        }

        // Kiểm tra trạng thái Ticket: Chỉ cho phép bổ sung khi OPEN hoặc IN_REVIEW
        if (ticket.getStatus() != MentoringTicketStatus.OPEN && ticket.getStatus() != MentoringTicketStatus.IN_REVIEW) {
            throw new BadRequestException("Ticket này đã ở trạng thái " + ticket.getStatus() + ", không thể bổ sung thêm bằng chứng.");
        }

        MentoringTicketEvidence evidence = MentoringTicketEvidence.builder()
                .ticket(ticket)
                .uploadedBy(currentUser)
                .title(request.getTitle())
                .description(request.getDescription())
                .fileUrl(request.getFileUrl())
                .fileName(request.getFileName())
                .fileSize(request.getFileSize())
                .fileType(request.getFileType())
                .build();

        MentoringTicketEvidence savedEvidence = evidenceRepository.save(evidence);

        // Gửi tin nhắn hệ thống realtime vào Chat for Task nếu có Conversation
        MentoringTask task = ticket.getTask();
        if (task != null && task.getConversation() != null) {
            String senderRole = isStudent ? "Học viên" : "Mentor";
            String fileDisplay = request.getFileName() != null && !request.getFileName().isBlank()
                    ? request.getFileName()
                    : request.getFileUrl();
            String systemMessage = String.format(
                    "📎 [BẰNG CHỨNG MỚI] %s vừa bổ sung bằng chứng tranh chấp cho vé [%s]: \"%s\".\n" +
                    "• Tệp đính kèm: %s\n" +
                    "Ban Quản Trị và các bên liên quan đã có thể xem tài liệu đối chứng này.",
                    senderRole, ticket.getTicketCode(), request.getTitle(), fileDisplay
            );
            try {
                mentoringConversationService.postSystemMessage(task.getConversation(), currentUser, systemMessage);
            } catch (Exception e) {
                log.error("Không thể gửi tin nhắn hệ thống khi nộp bằng chứng: {}", e.getMessage());
            }
        }

        return toEvidenceResponse(savedEvidence);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private MentoringTask requireTask(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhiệm vụ Mentoring Task với ID: " + taskId));
    }

    private MentoringTask requireParticipantTask(Long taskId, Long currentUserId) {
        MentoringTask task = requireTask(taskId);
        boolean isStudent = Objects.equals(task.getStudent().getId(), currentUserId);
        boolean isMentor = Objects.equals(task.getMentor().getId(), currentUserId);
        if (!isStudent && !isMentor) {
            throw new ForbiddenException("Bạn không có quyền truy cập thông tin của nhiệm vụ này.");
        }
        return task;
    }

    private User requireUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) return "0đ";
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        return nf.format(amount) + "đ";
    }

    private MentoringDisputeTicketResponse toTicketResponse(MentoringDisputeTicket t) {
        List<MentoringTicketEvidenceResponse> evidences = evidenceRepository != null
                ? evidenceRepository.findByTicketIdOrderByCreatedAtAsc(t.getId()).stream()
                    .map(this::toEvidenceResponse)
                    .toList()
                : Collections.emptyList();

        return MentoringDisputeTicketResponse.builder()
                .id(t.getId())
                .ticketCode(t.getTicketCode())
                .ticketType(t.getTicketType())
                .taskId(t.getTask().getId())
                .taskTitle(t.getTask().getTaskTitle())
                .conversationId(t.getConversation() != null ? t.getConversation().getId() : null)
                .settlementProposalId(t.getSettlementProposal() != null ? t.getSettlementProposal().getId() : null)
                .createdBy(toParticipantResponse(t.getCreatedBy(), "CREATOR"))
                .student(toParticipantResponse(t.getStudent(), "STUDENT"))
                .mentor(toParticipantResponse(t.getMentor(), "MENTOR"))
                .title(t.getTitle())
                .description(t.getDescription())
                .disputeReason(t.getDisputeReason())
                .desiredSolution(t.getDesiredSolution())
                .evidences(evidences)
                .mentorAmount(t.getMentorAmount())
                .studentRefund(t.getStudentRefund())
                .totalAmount(t.getTotalAmount())
                .status(t.getStatus())
                .handledBy(toParticipantResponse(t.getHandledBy(), "ADMIN"))
                .acceptedAt(t.getAcceptedAt())
                .resolvedAt(t.getResolvedAt())
                .resolutionNote(t.getResolutionNote())
                .decision(t.getDecision())
                .disputeFee(t.getDisputeFee())
                .settlementStatus(t.getSettlementStatus())
                .mentorPayoutLedgerId(t.getMentorPayoutLedger() != null ? t.getMentorPayoutLedger().getId() : null)
                .studentRefundLedgerId(t.getStudentRefundLedger() != null ? t.getStudentRefundLedger().getId() : null)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private MentoringTicketEvidenceResponse toEvidenceResponse(MentoringTicketEvidence ev) {
        if (ev == null) return null;
        return MentoringTicketEvidenceResponse.builder()
                .id(ev.getId())
                .ticketId(ev.getTicket() != null ? ev.getTicket().getId() : null)
                .uploadedBy(toParticipantResponse(ev.getUploadedBy(), "UPLOADER"))
                .title(ev.getTitle())
                .description(ev.getDescription())
                .fileUrl(ev.getFileUrl())
                .fileName(ev.getFileName())
                .fileSize(ev.getFileSize())
                .fileType(ev.getFileType())
                .createdAt(ev.getCreatedAt())
                .build();
    }

    private MentoringParticipantResponse toParticipantResponse(User user, String fallbackRole) {
        if (user == null) return null;
        UserProfile p = user.getProfile();
        String fullName = p != null && p.getFullName() != null ? p.getFullName() : user.getEmail();
        String avatarUrl = p != null ? p.getAvatarUrl() : null;
        String bio = p != null ? p.getBiography() : null;
        String headline = p != null && p.getHeadline() != null && !p.getHeadline().isBlank()
                ? p.getHeadline()
                : (p != null && p.getMajor() != null ? p.getMajor().getName() : fallbackRole);

        return MentoringParticipantResponse.builder()
                .id(user.getId())
                .fullName(fullName)
                .avatarUrl(avatarUrl)
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().getName() : fallbackRole)
                .headline(headline)
                .bio(bio)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MentoringDisputeTicketResponse> getAdminTickets(
            Long currentUserId,
            String keyword,
            MentoringTicketType ticketType,
            MentoringTicketStatus status,
            Long handledById,
            Pageable pageable) {
        log.info("Admin {} tra cứu danh sách Ticket: keyword='{}', type={}, status={}, handledBy={}",
                currentUserId, keyword, ticketType, status, handledById);

        Specification<MentoringDisputeTicket> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (ticketType != null) {
                predicates.add(cb.equal(root.get("ticketType"), ticketType));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (handledById != null) {
                predicates.add(cb.equal(root.get("handledBy").get("id"), handledById));
            }

            if (keyword != null && !keyword.trim().isEmpty()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                Expression<String> ticketCodeExpr = cb.lower(root.get("ticketCode"));
                Expression<String> titleExpr = cb.lower(root.get("title"));
                Expression<String> descExpr = cb.lower(root.get("description"));

                Join<MentoringDisputeTicket, MentoringTask> taskJoin = root.join("task", JoinType.LEFT);
                Expression<String> taskTitleExpr = cb.lower(taskJoin.get("taskTitle"));

                Join<MentoringDisputeTicket, User> studentJoin = root.join("student", JoinType.LEFT);
                Expression<String> studentEmailExpr = cb.lower(studentJoin.get("email"));

                Join<MentoringDisputeTicket, User> mentorJoin = root.join("mentor", JoinType.LEFT);
                Expression<String> mentorEmailExpr = cb.lower(mentorJoin.get("email"));

                predicates.add(cb.or(
                        cb.like(ticketCodeExpr, kw),
                        cb.like(titleExpr, kw),
                        cb.like(descExpr, kw),
                        cb.like(taskTitleExpr, kw),
                        cb.like(studentEmailExpr, kw),
                        cb.like(mentorEmailExpr, kw)
                ));
            }

            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<MentoringDisputeTicket> page = ticketRepository.findAll(spec, pageable);
        List<MentoringDisputeTicketResponse> content = page.getContent().stream()
                .map(this::toTicketResponse)
                .toList();

        return PageResponse.<MentoringDisputeTicketResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringDisputeTicketResponse getAdminTicketDetail(Long currentUserId, Long ticketId) {
        log.info("Admin {} xem chi tiết Ticket ID: {}", currentUserId, ticketId);
        MentoringDisputeTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Ticket với ID: " + ticketId));

        return toTicketResponse(ticket);
    }

    @Override
    @Transactional
    public MentoringDisputeTicketResponse acceptTicket(Long adminUserId, Long ticketId) {
        log.info("Admin {} yêu cầu tiếp nhận xử lý Ticket ID: {}", adminUserId, ticketId);

        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Quản trị viên"));

        MentoringDisputeTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Ticket với ID: " + ticketId));

        // Kiểm tra xem vé đã được giải quyết hoặc hủy chưa
        if (ticket.getStatus() == MentoringTicketStatus.RESOLVED ||
                ticket.getStatus() == MentoringTicketStatus.REJECTED ||
                ticket.getStatus() == MentoringTicketStatus.CANCELLED) {
            throw new BadRequestException("Không thể tiếp nhận vé đã kết thúc (trạng thái: " + ticket.getStatus() + ")");
        }

        // Kiểm tra xem đã có Admin khác nhận chưa (Bước 42 UC117)
        if (ticket.getHandledBy() != null && !ticket.getHandledBy().getId().equals(adminUserId)) {
            String handlerName = ticket.getHandledBy().getProfile() != null &&
                    ticket.getHandledBy().getProfile().getFullName() != null &&
                    !ticket.getHandledBy().getProfile().getFullName().isBlank()
                    ? ticket.getHandledBy().getProfile().getFullName().trim()
                    : ticket.getHandledBy().getEmail();
            throw new BadRequestException("Vé này đã được tiếp nhận bởi Quản trị viên: " + handlerName);
        }

        // Gán handled_by và thời điểm tiếp nhận (Bước 43 & 44 UC117)
        ticket.setHandledBy(admin);
        ticket.setAcceptedAt(Instant.now());
        ticket.setStatus(MentoringTicketStatus.IN_REVIEW);

        MentoringDisputeTicket saved = ticketRepository.save(ticket);
        log.info("Admin {} đã tiếp nhận thành công Ticket ID: {}, mã: {}", adminUserId, saved.getId(), saved.getTicketCode());

        // Gửi thông báo cho Student và Mentor (Bước 45 UC117)
        try {
            notificationService.sendMentoringTicketAcceptedNotification(admin, saved.getStudent(), saved.getMentor(), saved);
        } catch (Exception ex) {
            log.error("Lỗi khi gửi thông báo tiếp nhận Ticket id={}: {}", saved.getId(), ex.getMessage());
        }

        return toTicketResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringDisputeContextResponse getAdminDisputeContext(Long currentUserId, Long ticketId) {
        log.info("Admin {} yêu cầu xem bằng chứng và bối cảnh Task của Ticket ID: {}", currentUserId, ticketId);

        MentoringDisputeTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Ticket với ID: " + ticketId));

        MentoringTask task = ticket.getTask();
        if (task == null) {
            throw new ResourceNotFoundException("Ticket không liên kết với nhiệm vụ Mentoring Task nào.");
        }

        // 1. Toàn bộ bằng chứng tranh chấp do 2 bên nộp (UC112, UC113, UC118)
        List<MentoringTicketEvidenceResponse> evidences = evidenceRepository != null
                ? evidenceRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId()).stream()
                    .map(this::toEvidenceResponse)
                    .toList()
                : Collections.emptyList();

        int studentEvidenceCount = 0;
        int mentorEvidenceCount = 0;
        Long studentId = ticket.getStudent() != null ? ticket.getStudent().getId() : null;
        Long mentorId = ticket.getMentor() != null ? ticket.getMentor().getId() : null;

        for (MentoringTicketEvidenceResponse ev : evidences) {
            if (ev.getUploadedBy() != null) {
                if (Objects.equals(ev.getUploadedBy().getId(), studentId)) {
                    studentEvidenceCount++;
                } else if (Objects.equals(ev.getUploadedBy().getId(), mentorId)) {
                    mentorEvidenceCount++;
                }
            }
        }

        // 2. Ngữ cảnh Deal ban đầu
        MentoringDeal deal = task.getDeal();
        BigDecimal dealPrice = task.getAgreedPrice() != null ? task.getAgreedPrice() : (deal != null ? deal.getAgreedPrice() : BigDecimal.ZERO);
        Instant dealConfirmedAt = deal != null && deal.getStudentConfirmedAt() != null
                ? deal.getStudentConfirmedAt()
                : (deal != null && deal.getMentorConfirmedAt() != null ? deal.getMentorConfirmedAt() : task.getStartedAt());

        // 3. Timeline & Deadline
        Instant startedAt = task.getStartedAt();
        Instant originalDeadline = deal != null && deal.getDeadline() != null ? deal.getDeadline() : task.getDeadline();
        Instant currentDeadline = task.getDeadline();
        boolean isOverdue = currentDeadline != null && Instant.now().isAfter(currentDeadline) && task.getCompletedAt() == null;

        // 4. Lịch sử gia hạn Deadline (Extension History)
        List<MentoringTaskDeadlineExtensionResponse> extensionHistory = extensionRepository != null
                ? extensionRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                    .map(this::toExtensionResponse)
                    .toList()
                : Collections.emptyList();

        // 5. Nhật ký công việc đã được nghiệm thu (Confirmed Work Logs)
        List<MentoringWorkLog> allLogs = workLogRepository != null
                ? workLogRepository.findByTaskIdOrderByLogDateDesc(task.getId())
                : Collections.emptyList();

        List<MentoringWorkLogResponse> confirmedLogs = allLogs.stream()
                .filter(w -> w.getStatus() == WorkLogStatus.CONFIRMED)
                .map(workLogMapper::toWorkLogResponse)
                .toList();

        int totalConfirmedLogs = confirmedLogs.size();

        // 6. Lần nộp nghiệm thu gần nhất (nếu có submit completion)
        MentoringTaskCompletionResponse latestCompletion = completionRepository != null
                ? completionRepository.findFirstByTaskIdOrderByCreatedAtDesc(task.getId())
                    .map(this::toCompletionResponse)
                    .orElse(null)
                : null;

        // 7. Quỹ Escrow đang tạm giữ
        BigDecimal totalEscrowAmount = ticket.getTotalAmount() != null && ticket.getTotalAmount().compareTo(BigDecimal.ZERO) > 0
                ? ticket.getTotalAmount()
                : dealPrice;

        return MentoringDisputeContextResponse.builder()
                .ticket(toTicketResponse(ticket))
                .evidences(evidences)
                .studentEvidenceCount(studentEvidenceCount)
                .mentorEvidenceCount(mentorEvidenceCount)
                .dealId(deal != null ? deal.getId() : null)
                .dealPrice(dealPrice)
                .dealConfirmedAt(dealConfirmedAt)
                .taskTitle(task.getTaskTitle())
                .taskScope(task.getTaskScope())
                .expectedResult(task.getExpectedResult())
                .startedAt(startedAt)
                .originalDeadline(originalDeadline)
                .currentDeadline(currentDeadline)
                .isOverdue(isOverdue)
                .extensionHistory(extensionHistory)
                .confirmedWorkLogs(confirmedLogs)
                .totalConfirmedLogs(totalConfirmedLogs)
                .latestCompletionSubmission(latestCompletion)
                .totalEscrowAmount(totalEscrowAmount)
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

    private MentoringTaskCompletionResponse toCompletionResponse(MentoringTaskCompletion c) {
        if (c == null) return null;
        List<String> attachmentUrls = (c.getAttachmentUrls() != null && !c.getAttachmentUrls().isBlank())
                ? Arrays.asList(c.getAttachmentUrls().split(","))
                : Collections.emptyList();

        return MentoringTaskCompletionResponse.builder()
                .id(c.getId())
                .taskId(c.getTask() != null ? c.getTask().getId() : null)
                .conversationId(c.getConversation() != null ? c.getConversation().getId() : null)
                .submittedBy(toParticipantResponse(c.getSubmittedBy(), "MENTOR"))
                .finalSummary(c.getFinalSummary())
                .deliverables(c.getDeliverables())
                .attachmentUrls(attachmentUrls)
                .status(c.getStatus())
                .respondedBy(toParticipantResponse(c.getRespondedBy(), "STUDENT"))
                .respondedAt(c.getRespondedAt())
                .feedbackNote(c.getFeedbackNote())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private String resolveName(User user) {
        if (user != null && user.getProfile() != null && user.getProfile().getFullName() != null && !user.getProfile().getFullName().isBlank()) {
            return user.getProfile().getFullName().trim();
        }
        return user != null ? user.getEmail() : "Người dùng";
    }

    private String resolveAvatar(User user) {
        return user != null && user.getProfile() != null ? user.getProfile().getAvatarUrl() : null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MentoringTicketMessageResponse> getTicketMessages(Long currentUserId, Long ticketId) {
        MentoringDisputeTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vé tranh chấp với ID: " + ticketId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + currentUserId));

        checkUserTicketAccess(ticket, currentUser);

        List<MentoringTicketMessage> messages = messageRepository.findByTicketIdWithSenderOrderByCreatedAtAsc(ticketId);
        return messages.stream()
                .map(this::toTicketMessageResponse)
                .toList();
    }

    @Override
    @Transactional
    public MentoringTicketMessageResponse sendTicketMessage(
            Long currentUserId, Long ticketId, CreateMentoringTicketMessageRequest request) {
        MentoringDisputeTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vé tranh chấp với ID: " + ticketId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + currentUserId));

        checkUserTicketAccess(ticket, currentUser);

        // Chặn gửi tin nhắn nếu Ticket đã ở trạng thái kết thúc (UC119 - Rule 226)
        if (ticket.getStatus() == MentoringTicketStatus.RESOLVED ||
                ticket.getStatus() == MentoringTicketStatus.REJECTED ||
                ticket.getStatus() == MentoringTicketStatus.CANCELLED) {
            throw new BadRequestException("Vé đã kết thúc (" + ticket.getStatus() + "), không thể gửi thêm tin nhắn trao đổi.");
        }

        // Xác định vai trò của người gửi
        String senderRole = determineSenderRole(ticket, currentUser);

        // Serialize attachments sang JSON nếu có
        String attachmentsJson = null;
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            try {
                attachmentsJson = objectMapper.writeValueAsString(request.getAttachments());
            } catch (Exception e) {
                log.error("Lỗi khi chuyển đổi attachments sang JSON: {}", e.getMessage());
            }
        }

        String msgType = (request.getMessageType() != null && !request.getMessageType().isBlank())
                ? request.getMessageType().toUpperCase()
                : "TEXT";

        MentoringTicketMessage message = MentoringTicketMessage.builder()
                .ticket(ticket)
                .sender(currentUser)
                .senderRole(senderRole)
                .messageType(msgType)
                .content(request.getContent().trim())
                .attachments(attachmentsJson)
                .proposedMentorAmount(request.getProposedMentorAmount())
                .proposedStudentRefund(request.getProposedStudentRefund())
                .deadline(request.getDeadline())
                .build();

        message = messageRepository.save(message);

        MentoringTicketMessageResponse response = toTicketMessageResponse(message);

        // 1. Phát sóng WebSocket STOMP tới topic trao đổi trực tiếp của Ticket
        try {
            messagingTemplate.convertAndSend("/topic/mentoring/tickets/" + ticketId + "/messages", response);
            log.info("Đã phát sóng WebSocket STOMP message mới cho Ticket ID: {}", ticketId);
        } catch (Exception e) {
            log.error("Lỗi khi phát sóng WebSocket cho Ticket ID {}: {}", ticketId, e.getMessage());
        }

        // 2. Gửi Notification cá nhân cho các bên liên quan còn lại
        notifyTicketParties(ticket, currentUser, msgType, request.getContent());

        return response;
    }

    private void checkUserTicketAccess(MentoringDisputeTicket ticket, User currentUser) {
        boolean isAdmin = isAdmin(currentUser);
        boolean isStudent = ticket.getStudent() != null && ticket.getStudent().getId().equals(currentUser.getId());
        boolean isMentor = ticket.getMentor() != null && ticket.getMentor().getId().equals(currentUser.getId());

        if (!isAdmin && !isStudent && !isMentor) {
            throw new ForbiddenException("Bạn không có quyền tham gia thảo luận trên vé này.");
        }
    }

    private String determineSenderRole(MentoringDisputeTicket ticket, User currentUser) {
        if (isAdmin(currentUser)) {
            return "ADMIN";
        }
        if (ticket.getStudent() != null && ticket.getStudent().getId().equals(currentUser.getId())) {
            return "STUDENT";
        }
        if (ticket.getMentor() != null && ticket.getMentor().getId().equals(currentUser.getId())) {
            return "MENTOR";
        }
        return "ADMIN";
    }

    private boolean isAdmin(User user) {
        return user != null && user.getRole() != null &&
                ("ADMIN".equalsIgnoreCase(user.getRole().getName()) || "ROLE_ADMIN".equalsIgnoreCase(user.getRole().getName()));
    }

    private void notifyTicketParties(MentoringDisputeTicket ticket, User sender, String messageType, String content) {
        boolean isSenderAdmin = isAdmin(sender);
        boolean isSenderStudent = ticket.getStudent() != null && ticket.getStudent().getId().equals(sender.getId());
        boolean isSenderMentor = ticket.getMentor() != null && ticket.getMentor().getId().equals(sender.getId());

        if (isSenderAdmin) {
            // Admin nhắn -> báo cả Student và Mentor
            if (ticket.getStudent() != null) {
                notificationService.sendMentoringTicketMessageNotification(sender, ticket.getStudent(), ticket, messageType, content);
            }
            if (ticket.getMentor() != null) {
                notificationService.sendMentoringTicketMessageNotification(sender, ticket.getMentor(), ticket, messageType, content);
            }
        } else if (isSenderStudent) {
            // Student nhắn -> báo Mentor và Admin phụ trách (nếu có)
            if (ticket.getMentor() != null) {
                notificationService.sendMentoringTicketMessageNotification(sender, ticket.getMentor(), ticket, messageType, content);
            }
            if (ticket.getHandledBy() != null) {
                notificationService.sendMentoringTicketMessageNotification(sender, ticket.getHandledBy(), ticket, messageType, content);
            }
        } else if (isSenderMentor) {
            // Mentor nhắn -> báo Student và Admin phụ trách (nếu có)
            if (ticket.getStudent() != null) {
                notificationService.sendMentoringTicketMessageNotification(sender, ticket.getStudent(), ticket, messageType, content);
            }
            if (ticket.getHandledBy() != null) {
                notificationService.sendMentoringTicketMessageNotification(sender, ticket.getHandledBy(), ticket, messageType, content);
            }
        }
    }

    private MentoringTicketMessageResponse toTicketMessageResponse(MentoringTicketMessage msg) {
        if (msg == null) return null;

        List<TicketEvidenceRequest> attachments = Collections.emptyList();
        if (msg.getAttachments() != null && !msg.getAttachments().isBlank()) {
            try {
                attachments = objectMapper.readValue(msg.getAttachments(), new TypeReference<List<TicketEvidenceRequest>>() {});
            } catch (Exception e) {
                log.error("Lỗi khi parse attachments JSON: {}", e.getMessage());
            }
        }

        return MentoringTicketMessageResponse.builder()
                .id(msg.getId())
                .ticketId(msg.getTicket() != null ? msg.getTicket().getId() : null)
                .senderId(msg.getSender() != null ? msg.getSender().getId() : null)
                .senderName(resolveName(msg.getSender()))
                .senderAvatar(resolveAvatar(msg.getSender()))
                .senderRole(msg.getSenderRole())
                .messageType(msg.getMessageType())
                .content(msg.getContent())
                .attachments(attachments)
                .proposedMentorAmount(msg.getProposedMentorAmount())
                .proposedStudentRefund(msg.getProposedStudentRefund())
                .deadline(msg.getDeadline())
                .createdAt(msg.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public MentoringDisputeTicketResponse resolveTicket(
            Long adminUserId, Long ticketId, AdminResolveTicketRequest request) {
        log.info("Admin {} yêu cầu ra phán quyết giải quyết Ticket ID: {}, phương án: {}",
                adminUserId, ticketId, request.getDecision());

        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Quản trị viên"));
        if (!isAdmin(admin)) {
            throw new ForbiddenException("Chỉ Quản trị viên mới có quyền ra phán quyết giải quyết Ticket");
        }

        MentoringDisputeTicket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Ticket với ID: " + ticketId));

        if (ticket.getStatus() == MentoringTicketStatus.RESOLVED) {
            throw new ConflictException("Ticket này đã được giải quyết phán quyết trước đó rồi.");
        }
        if (ticket.getStatus() == MentoringTicketStatus.REJECTED || ticket.getStatus() == MentoringTicketStatus.CANCELLED) {
            throw new BadRequestException("Ticket này đã ở trạng thái kết thúc (" + ticket.getStatus() + "), không thể giải quyết.");
        }

        MentoringTask task = ticket.getTask();
        if (task == null) {
            throw new BadRequestException("Ticket không gắn với Mentoring Task hợp lệ.");
        }

        // 1. Thẩm tra quỹ Escrow khả dụng (Rule 5.9 & Luồng 59 - 60)
        BigDecimal totalEscrow = ledgerRepository.findByTaskId(task.getId()).stream()
                .filter(l -> l.getTransactionType() == MentoringLedgerTransactionType.ESCROW_COLLECTION
                        && l.getStatus() == MentoringLedgerStatus.SUCCEEDED)
                .map(MentoringPaymentLedger::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalEscrow.compareTo(BigDecimal.ZERO) == 0) {
            totalEscrow = ticket.getTotalAmount() != null && ticket.getTotalAmount().compareTo(BigDecimal.ZERO) > 0
                    ? ticket.getTotalAmount()
                    : task.getAgreedPrice();
        }

        BigDecimal disputeFee = request.getDisputeFee() != null ? request.getDisputeFee() : BigDecimal.ZERO;
        if (disputeFee.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Phí xử lý tranh chấp không được âm.");
        }
        if (disputeFee.compareTo(totalEscrow) > 0) {
            throw new BadRequestException("Phí xử lý tranh chấp không thể vượt quá tổng quỹ Escrow của nhiệm vụ ("
                    + formatVnd(totalEscrow) + " VNĐ).");
        }

        BigDecimal netFund = totalEscrow.subtract(disputeFee);
        BigDecimal mentorAmount;
        BigDecimal studentRefund;

        switch (request.getDecision()) {
            case FULL_MENTOR_PAYMENT:
                mentorAmount = netFund;
                studentRefund = BigDecimal.ZERO;
                break;
            case FULL_STUDENT_REFUND:
                mentorAmount = BigDecimal.ZERO;
                studentRefund = netFund;
                break;
            case PARTIAL_SPLIT:
                if ("PERCENTAGE".equalsIgnoreCase(request.getSplitMode()) && request.getMentorPercentage() != null) {
                    double mentorPct = request.getMentorPercentage();
                    if (mentorPct < 0 || mentorPct > 100) {
                        throw new BadRequestException("Tỷ lệ phân chia Cố vấn phải nằm trong khoảng từ 0% đến 100%.");
                    }
                    mentorAmount = netFund.multiply(BigDecimal.valueOf(mentorPct / 100.0)).setScale(0, java.math.RoundingMode.HALF_UP);
                    studentRefund = netFund.subtract(mentorAmount);
                } else {
                    if (request.getMentorAmount() == null || request.getStudentRefund() == null) {
                        throw new BadRequestException("Vui lòng cung cấp đầy đủ số tiền phân bổ cho Cố vấn và Học viên.");
                    }
                    mentorAmount = request.getMentorAmount();
                    studentRefund = request.getStudentRefund();

                    // Kiểm tra tổng: mentorAmount + studentRefund + disputeFee == totalEscrow
                    BigDecimal totalAllocated = mentorAmount.add(studentRefund).add(disputeFee);
                    if (totalAllocated.compareTo(totalEscrow) != 0) {
                        throw new BadRequestException("Tổng số tiền phân bổ (Mentor: " + formatVnd(mentorAmount)
                                + " + Student: " + formatVnd(studentRefund)
                                + " + Phí: " + formatVnd(disputeFee)
                                + " = " + formatVnd(totalAllocated) + " VNĐ) phải bằng đúng tổng quỹ Escrow ("
                                + formatVnd(totalEscrow) + " VNĐ).");
                    }
                }
                break;
            default:
                throw new BadRequestException("Phương án giải quyết không hợp lệ.");
        }

        // 2. Cập nhật Ticket
        ticket.setDecision(request.getDecision());
        ticket.setResolutionNote(request.getDecisionReason());
        ticket.setMentorAmount(mentorAmount);
        ticket.setStudentRefund(studentRefund);
        ticket.setDisputeFee(disputeFee);
        ticket.setStatus(MentoringTicketStatus.RESOLVED);
        ticket.setHandledBy(admin);
        ticket.setResolvedAt(Instant.now());
        ticket.setSettlementStatus(MentoringSettlementStatus.SETTLED);

        // 3. Cập nhật Mentoring Task
        if (mentorAmount.compareTo(BigDecimal.ZERO) > 0 && studentRefund.compareTo(BigDecimal.ZERO) == 0) {
            task.setStatus(MentoringTaskStatus.COMPLETED);
        } else if (studentRefund.compareTo(BigDecimal.ZERO) > 0 && mentorAmount.compareTo(BigDecimal.ZERO) == 0) {
            task.setStatus(MentoringTaskStatus.CANCELLED);
        } else {
            task.setStatus(MentoringTaskStatus.RESOLVED);
        }
        taskRepository.save(task);

        // 4. Ghi Sổ quỹ giao dịch Mentoring (Payout & Refund độc lập - Bước 63 UC120)
        if (mentorAmount.compareTo(BigDecimal.ZERO) > 0) {
            MentoringPaymentLedger payoutLedger = MentoringPaymentLedger.builder()
                    .request(task.getRequest() != null ? task.getRequest() : task.getDeal().getRequest())
                    .task(task)
                    .deal(task.getDeal())
                    .student(task.getStudent())
                    .mentor(task.getMentor())
                    .amount(mentorAmount)
                    .transactionType(MentoringLedgerTransactionType.PAYOUT)
                    .status(MentoringLedgerStatus.SUCCEEDED)
                    .providerReference("PAYOUT_TICKET_" + ticket.getTicketCode())
                    .deadlineSnapshot(task.getDeadline())
                    .note("Thù lao theo phán quyết Ticket " + ticket.getTicketCode() + ": " + request.getDecisionReason())
                    .build();
            MentoringPaymentLedger savedPayout = ledgerRepository.save(payoutLedger);
            ticket.setMentorPayoutLedger(savedPayout);
        }

        if (studentRefund.compareTo(BigDecimal.ZERO) > 0) {
            MentoringPaymentLedger refundLedger = MentoringPaymentLedger.builder()
                    .request(task.getRequest() != null ? task.getRequest() : task.getDeal().getRequest())
                    .task(task)
                    .deal(task.getDeal())
                    .student(task.getStudent())
                    .mentor(task.getMentor())
                    .amount(studentRefund)
                    .transactionType(MentoringLedgerTransactionType.REFUND)
                    .status(MentoringLedgerStatus.SUCCEEDED)
                    .providerReference("REFUND_TICKET_" + ticket.getTicketCode())
                    .deadlineSnapshot(task.getDeadline())
                    .note("Hoàn phí theo phán quyết Ticket " + ticket.getTicketCode() + ": " + request.getDecisionReason())
                    .build();
            MentoringPaymentLedger savedRefund = ledgerRepository.save(refundLedger);
            ticket.setStudentRefundLedger(savedRefund);
        }

        MentoringDisputeTicket savedTicket = ticketRepository.save(ticket);
        log.info("Ticket {} đã được Admin {} giải quyết thành công (RESOLVED)", savedTicket.getId(), adminUserId);

        // 5. Tự động ghi 1 tin nhắn hệ thống thông báo phán quyết vào thread trao đổi Ticket UC119
        try {
            String decisionLabel = switch (request.getDecision()) {
                case FULL_MENTOR_PAYMENT -> "Chi trả toàn bộ thù lao cho Cố vấn";
                case FULL_STUDENT_REFUND -> "Hoàn trả toàn bộ học phí cho Học viên";
                case PARTIAL_SPLIT -> "Hòa giải phân chia tài chính";
            };

            String systemMsgContent = "PHÁN QUYẾT CHÍNH THỨC TỪ BAN QUẢN TRỊ:\n"
                    + "• Phương án: " + decisionLabel + "\n"
                    + "• Thù lao Cố vấn (Mentor): " + formatVnd(mentorAmount) + " VNĐ\n"
                    + "• Hoàn trả Học viên (Student): " + formatVnd(studentRefund) + " VNĐ\n"
                    + (disputeFee.compareTo(BigDecimal.ZERO) > 0 ? "• Phí xử lý tranh chấp: " + formatVnd(disputeFee) + " VNĐ\n" : "")
                    + "• Căn cứ & Lý do phán quyết: " + request.getDecisionReason();

            MentoringTicketMessage resolutionMsg = MentoringTicketMessage.builder()
                    .ticket(savedTicket)
                    .sender(admin)
                    .senderRole("ADMIN")
                    .messageType("RESOLUTION_DECISION")
                    .content(systemMsgContent)
                    .proposedMentorAmount(mentorAmount)
                    .proposedStudentRefund(studentRefund)
                    .build();
            MentoringTicketMessage savedMsg = messageRepository.save(resolutionMsg);

            // Broadcast qua WebSocket topic của Ticket
            messagingTemplate.convertAndSend(
                    "/topic/mentoring/tickets/" + savedTicket.getId() + "/messages",
                    toTicketMessageResponse(savedMsg)
            );
        } catch (Exception ex) {
            log.error("Lỗi khi ghi tin nhắn phán quyết vào thread UC119: {}", ex.getMessage());
        }

        // 6. Gửi thông báo tới Học viên và Cố vấn
        try {
            notificationService.sendMentoringTicketResolvedNotification(admin, savedTicket.getStudent(), savedTicket.getMentor(), savedTicket);
        } catch (Exception ex) {
            log.error("Lỗi khi gửi thông báo kết quả giải quyết Ticket id={}: {}", savedTicket.getId(), ex.getMessage());
        }

        return toTicketResponse(savedTicket);
    }
}
