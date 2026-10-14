package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringSettlementProposalStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTicketType;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDisputeTicketRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskSettlementProposalRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTicketEvidenceRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateDisputeTicketRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.SubmitSettlementTicketRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.TicketEvidenceRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDisputeTicketResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringParticipantResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringSettlementSnapshotResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTicketEvidenceResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDisputeTicket;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskSettlementProposal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTicketEvidence;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
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
    private final UserRepository userRepository;
    private final MentoringConversationService mentoringConversationService;

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
}
