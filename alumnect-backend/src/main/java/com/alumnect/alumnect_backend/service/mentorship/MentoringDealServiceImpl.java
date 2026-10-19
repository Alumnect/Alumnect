package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.common.enums.ProposalSource;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDealRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDealSnapshotRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestDistributionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.ProposeDealRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateDealRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealSnapshotResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDealSnapshot;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestDistribution;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringDealMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

/**
 * Cài đặt nghiệp vụ Mentoring Deal (UC104) như bước tiếp nối của Request trong Chat for Task.
 * Thứ tự khóa thống nhất cho mọi thao tác thay đổi trạng thái: Request (FOR UPDATE) → Deal,
 * giúp tuần tự hóa việc tạo phiên bản, xác nhận và chọn Mentor của cùng một Request.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentoringDealServiceImpl implements MentoringDealService {

    /** Các trạng thái kết thúc của luồng Deal (không thể xác nhận / thanh toán) */
    private static final Set<MentoringDealStatus> CLOSED_STATUSES =
            EnumSet.of(MentoringDealStatus.CANCELLED, MentoringDealStatus.REJECTED, MentoringDealStatus.SUPERSEDED);

    private static final String LEGACY_DEAL_MESSAGE =
            "Deal này thuộc luồng cũ không gắn với Mentoring Request nên chỉ có thể xem.";

    private final MentoringDealRepository dealRepository;
    private final MentoringDealSnapshotRepository snapshotRepository;
    private final MentoringRequestRepository requestRepository;
    private final MentoringRequestDistributionRepository distributionRepository;
    private final MentoringTaskRepository taskRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final MentoringConversationService conversationService;
    private final MentoringDealMapper dealMapper;
    private final MentoringRules mentoringRules;

    // =====================================================================
    // PHÁT HÀNH PHIÊN BẢN DEAL TICKET (Mentor)
    // =====================================================================

    @Override
    @Transactional
    public MentoringDealResponse proposeDeal(Long currentUserId, ProposeDealRequest request) {
        log.info("Mentor userId={} phát hành Deal Ticket trong conversationId={} (source={})",
                currentUserId, request.getConversationId(), request.getProposalSource());

        User currentUser = loadUser(currentUserId);
        Conversation conversation = conversationService.requireParticipantConversation(currentUserId, request.getConversationId());
        if (!Objects.equals(conversation.getMentoringMentor().getId(), currentUserId)) {
            throw new ForbiddenException("Chỉ Mentor trong cuộc trò chuyện mới được gửi thỏa thuận. Học viên có thể xác nhận, yêu cầu điều chỉnh hoặc từ chối.");
        }

        MentoringRequest mentoringRequest = lockRequest(conversation.getMentoringRequest().getId());
        DealTerms terms = request.getProposalSource() == ProposalSource.REQUEST_ACCEPTANCE
                ? termsFromRequest(mentoringRequest)
                : termsFromBody(request.getTaskScope(), request.getAgreedPrice(), request.getDeadline(), request.getWorkingMode(),
                        request.getParticipationType(), request.getTaskType(), request.getExpectedResult());

        MentoringDeal deal = issueNewVersion(currentUser, conversation, mentoringRequest,
                dealRepository.findByConversationId(conversation.getId()).orElse(null),
                request.getProposalSource(), terms, request.getChangeNote());
        return enrichResponse(dealMapper.toResponse(deal), deal, currentUserId);
    }

    @Override
    @Transactional
    public MentoringDealResponse updateDealTerms(Long currentUserId, Long dealId, UpdateDealRequest request) {
        log.info("Mentor userId={} deal lại Deal id={}", currentUserId, dealId);

        User currentUser = loadUser(currentUserId);
        MentoringRequest mentoringRequest = lockRequest(resolveRequestId(dealId));
        MentoringDeal deal = loadDeal(dealId);
        if (!Objects.equals(deal.getMentor().getId(), currentUserId)) {
            if (Objects.equals(deal.getStudent().getId(), currentUserId)) {
                throw new ForbiddenException("Chỉ Mentor mới được tạo phiên bản Deal Ticket mới. Học viên vui lòng dùng \"Yêu cầu điều chỉnh\".");
            }
            throw new ForbiddenException("Bạn không có quyền chỉnh sửa thỏa thuận này.");
        }

        DealTerms terms = termsFromBody(request.getTaskScope(), request.getAgreedPrice(), request.getDeadline(), request.getWorkingMode(),
                request.getParticipationType(), request.getTaskType(), request.getExpectedResult());
        MentoringDeal saved = issueNewVersion(currentUser, deal.getConversation(), mentoringRequest, deal,
                ProposalSource.RENEGOTIATION, terms, request.getChangeNote());
        return enrichResponse(dealMapper.toResponse(saved), saved, currentUserId);
    }

    /**
     * Phát hành phiên bản Deal Ticket mới (v1 nếu chưa có Deal, v+1 nếu đã có) và tự động ghi nhận Mentor xác nhận.
     * Request phải đang được khóa ghi bởi tầng gọi.
     */
    private MentoringDeal issueNewVersion(User mentor, Conversation conversation, MentoringRequest mentoringRequest,
                                          MentoringDeal existingDeal, ProposalSource source, DealTerms terms, String changeNote) {
        conversationService.assertWritable(conversation);
        assertRequestOpenForNegotiation(mentoringRequest);
        assertMentorAccepted(mentoringRequest, mentor.getId());

        Instant now = Instant.now();
        MentoringDeal deal;
        if (existingDeal == null) {
            deal = MentoringDeal.builder()
                    .student(mentoringRequest.getStudent())
                    .mentor(mentor)
                    .conversation(conversation)
                    .request(mentoringRequest)
                    .ticketType("DEAL")
                    .version(1)
                    .createdBy(mentor)
                    .createdAt(now)
                    .build();
        } else {
            deal = existingDeal;
            if (Boolean.TRUE.equals(deal.getIsLocked()) || deal.getStatus() == MentoringDealStatus.DEAL_CONFIRMED
                    || Boolean.TRUE.equals(deal.getIsPaid())) {
                throw new ConflictException("Deal Ticket đã được hai bên xác nhận và khóa, không thể tạo phiên bản mới.");
            }
            deal.setVersion(deal.getVersion() + 1);
        }

        deal.setProposalSource(source);
        deal.setTaskScope(terms.taskScope());
        deal.setAgreedPrice(terms.agreedPrice());
        deal.setDeadline(terms.deadline());
        deal.setWorkingMode(terms.workingMode());
        deal.setParticipationType(terms.participationType());
        deal.setTaskType(terms.taskType());
        deal.setExpectedResult(terms.expectedResult());
        deal.setMentorConfirmed(true);
        deal.setMentorConfirmedAt(now);
        deal.setStudentConfirmed(false);
        deal.setStudentConfirmedAt(null);
        deal.setStatus(MentoringDealStatus.MENTOR_CONFIRMED);
        deal.setIsLocked(false);
        deal.setLockedAt(null);
        deal.setUpdatedBy(mentor);
        deal.setUpdatedAt(now);
        MentoringDeal saved = dealRepository.save(deal);

        String sourceLabel = source == ProposalSource.REQUEST_ACCEPTANCE ? "Chấp nhận Deal theo Request" : "Deal lại";
        String note = changeNote != null && !changeNote.isBlank()
                ? changeNote.trim()
                : (source == ProposalSource.REQUEST_ACCEPTANCE
                    ? "Mentor chấp nhận Deal theo điều kiện của Request"
                    : String.format("Mentor tạo Deal Ticket phiên bản %d", saved.getVersion()));

        snapshotRepository.save(MentoringDealSnapshot.builder()
                .deal(saved)
                .version(saved.getVersion())
                .ticketType("DEAL")
                .proposalSource(source)
                .taskScope(saved.getTaskScope())
                .agreedPrice(saved.getAgreedPrice())
                .deadline(saved.getDeadline())
                .workingMode(saved.getWorkingMode())
                .participationType(saved.getParticipationType())
                .taskType(saved.getTaskType())
                .expectedResult(saved.getExpectedResult())
                .modifiedBy(mentor)
                .changeNote(note)
                .createdAt(now)
                .build());

        conversationService.postSystemMessage(conversation, mentor, String.format(
                "%s đã gửi Deal Ticket phiên bản %d (%s). Học viên vui lòng xem và phản hồi.",
                conversationService.displayName(mentor), saved.getVersion(), sourceLabel));

        log.info("Phát hành Deal id={} phiên bản {} (source={}) cho requestId={}",
                saved.getId(), saved.getVersion(), source, mentoringRequest.getId());
        return saved;
    }

    // =====================================================================
    // XÁC NHẬN DEAL & CHỌN MENTOR CHO REQUEST
    // =====================================================================

    @Override
    @Transactional
    public MentoringDealResponse confirmDeal(Long currentUserId, Long dealId, Integer version) {
        log.info("Xác nhận Deal id={} phiên bản {} bởi userId={}", dealId, version, currentUserId);

        if (version == null) {
            throw new BadRequestException("Phiên bản Deal Ticket cần xác nhận (version) không được để trống.");
        }
        User currentUser = loadUser(currentUserId);
        MentoringRequest mentoringRequest = lockRequest(resolveRequestId(dealId));
        MentoringDeal deal = loadDeal(dealId);

        boolean isStudent = Objects.equals(deal.getStudent().getId(), currentUserId);
        boolean isMentor = Objects.equals(deal.getMentor().getId(), currentUserId);
        if (!isStudent && !isMentor) {
            throw new ForbiddenException("Bạn không phải là thành viên tham gia thỏa thuận này.");
        }

        assertLatestVersion(deal, version);
        if (Boolean.TRUE.equals(deal.getIsLocked()) || deal.getStatus() == MentoringDealStatus.DEAL_CONFIRMED) {
            throw new ConflictException("Thỏa thuận này đã được cả hai bên xác nhận và khóa trước đó.");
        }
        // Kiểm tra trạng thái Request trước trạng thái Deal để báo đúng nguyên nhân khi Request đã chọn Mentor khác
        conversationService.assertWritable(deal.getConversation());
        assertRequestOpenForNegotiation(mentoringRequest);
        if (CLOSED_STATUSES.contains(deal.getStatus())) {
            throw new BadRequestException(String.format(
                    "Deal Ticket phiên bản %d không còn hiệu lực để xác nhận (Trạng thái: %s).", deal.getVersion(), deal.getStatus()));
        }

        Instant now = Instant.now();
        if (isStudent) {
            if (Boolean.TRUE.equals(deal.getStudentConfirmed())) {
                throw new BadRequestException("Bạn đã xác nhận phiên bản thỏa thuận này rồi.");
            }
            deal.setStudentConfirmed(true);
            deal.setStudentConfirmedAt(now);
        } else {
            if (Boolean.TRUE.equals(deal.getMentorConfirmed())) {
                throw new BadRequestException("Bạn đã xác nhận phiên bản thỏa thuận này rồi.");
            }
            deal.setMentorConfirmed(true);
            deal.setMentorConfirmedAt(now);
        }
        deal.setUpdatedBy(currentUser);
        deal.setUpdatedAt(now);

        if (Boolean.TRUE.equals(deal.getStudentConfirmed()) && Boolean.TRUE.equals(deal.getMentorConfirmed())) {
            finalizeConfirmedDeal(mentoringRequest, deal, currentUser, now);
        } else {
            deal.setStatus(isStudent ? MentoringDealStatus.STUDENT_CONFIRMED : MentoringDealStatus.MENTOR_CONFIRMED);
            dealRepository.save(deal);
            conversationService.postSystemMessage(deal.getConversation(), currentUser, String.format(
                    "%s đã xác nhận Deal Ticket phiên bản %d. Đang chờ bên còn lại xác nhận.",
                    conversationService.displayName(currentUser), deal.getVersion()));
        }

        log.info("Xác nhận Deal id={} thành công, trạng thái mới: {}", deal.getId(), deal.getStatus());
        return enrichResponse(dealMapper.toResponse(deal), deal, currentUserId);
    }

    /**
     * Hai bên cùng xác nhận một phiên bản: khóa Deal ở trạng thái DEAL_CONFIRMED.
     * Lưu ý nghiệp vụ: Chỉ chốt Mentor thắng cuộc và đóng các luồng đàm phán khác SAU KHI
     * thanh toán thành công (xử lý tại MentoringTaskPaymentServiceImpl.activateTaskUponPaymentSuccess).
     * Tại thời điểm xác nhận Deal, Request vẫn mở để Học viên có thể xem xét và thanh toán.
     */
    private void finalizeConfirmedDeal(MentoringRequest mentoringRequest, MentoringDeal deal, User actor, Instant now) {
        deal.setStatus(MentoringDealStatus.DEAL_CONFIRMED);
        deal.setIsLocked(true);
        deal.setLockedAt(now);
        dealRepository.saveAndFlush(deal);

        conversationService.postSystemMessage(deal.getConversation(), actor, String.format(
                "Hai bên đã xác nhận Deal Ticket phiên bản %d. Deal đã được khóa, Học viên vui lòng thanh toán để kích hoạt Task.",
                deal.getVersion()));
        log.info("Hai bên đã xác nhận Deal id={} phiên bản {} cho Request id={}. Đang chờ thanh toán để kích hoạt Task.",
                deal.getId(), deal.getVersion(), mentoringRequest.getId());
    }

    // =====================================================================
    // HÀNH ĐỘNG CỦA HỌC VIÊN: TỪ CHỐI / YÊU CẦU ĐIỀU CHỈNH; HỦY
    // =====================================================================

    @Override
    @Transactional
    public MentoringDealResponse rejectDeal(Long currentUserId, Long dealId, String reason, Integer version) {
        log.info("Từ chối Deal id={} bởi userId={}", dealId, currentUserId);

        User currentUser = loadUser(currentUserId);
        MentoringRequest mentoringRequest = lockRequest(resolveRequestId(dealId));
        MentoringDeal deal = loadDeal(dealId);
        assertStudentActionOnPendingTicket(deal, currentUserId, version, mentoringRequest, "từ chối");

        deal.setStatus(MentoringDealStatus.REJECTED);
        deal.setUpdatedBy(currentUser);
        deal.setUpdatedAt(Instant.now());
        dealRepository.save(deal);

        conversationService.postSystemMessage(deal.getConversation(), currentUser, String.format(
                "%s đã từ chối Deal Ticket phiên bản %d%s.",
                conversationService.displayName(currentUser), deal.getVersion(),
                reason != null && !reason.isBlank() ? " vì lý do: " + reason.trim() : ""));
        return enrichResponse(dealMapper.toResponse(deal), deal, currentUserId);
    }

    @Override
    @Transactional
    public MentoringDealResponse requestAdjustment(Long currentUserId, Long dealId, String note, Integer version) {
        log.info("Yêu cầu điều chỉnh Deal id={} bởi userId={}", dealId, currentUserId);

        User currentUser = loadUser(currentUserId);
        MentoringRequest mentoringRequest = lockRequest(resolveRequestId(dealId));
        MentoringDeal deal = loadDeal(dealId);
        assertStudentActionOnPendingTicket(deal, currentUserId, version, mentoringRequest, "yêu cầu điều chỉnh");

        deal.setStatus(MentoringDealStatus.SUPERSEDED);
        deal.setStudentConfirmed(false);
        deal.setStudentConfirmedAt(null);
        deal.setUpdatedBy(currentUser);
        deal.setUpdatedAt(Instant.now());
        dealRepository.save(deal);

        conversationService.postSystemMessage(deal.getConversation(), currentUser, String.format(
                "%s đã yêu cầu điều chỉnh Deal Ticket phiên bản %d: \"%s\". Mentor vui lòng gửi phiên bản Deal Ticket mới.",
                conversationService.displayName(currentUser), deal.getVersion(),
                note != null && !note.isBlank() ? note.trim() : "Cần thỏa thuận lại các điều khoản"));
        return enrichResponse(dealMapper.toResponse(deal), deal, currentUserId);
    }

    @Override
    @Transactional
    public MentoringDealResponse cancelDeal(Long currentUserId, Long dealId, String reason) {
        log.info("Hủy bỏ Deal id={} bởi userId={}", dealId, currentUserId);

        User currentUser = loadUser(currentUserId);
        lockRequest(resolveRequestId(dealId));
        MentoringDeal deal = loadDeal(dealId);

        boolean isStudent = Objects.equals(deal.getStudent().getId(), currentUserId);
        boolean isMentor = Objects.equals(deal.getMentor().getId(), currentUserId);
        if (!isStudent && !isMentor) {
            throw new ForbiddenException("Bạn không có quyền hủy bỏ thỏa thuận này.");
        }
        if (Boolean.TRUE.equals(deal.getIsLocked()) || deal.getStatus() == MentoringDealStatus.DEAL_CONFIRMED) {
            throw new ConflictException("Không thể hủy thỏa thuận đã được cả hai bên xác nhận và khóa snapshot.");
        }
        if (deal.getStatus() == MentoringDealStatus.CANCELLED) {
            throw new BadRequestException("Thỏa thuận này đã bị hủy bỏ trước đó.");
        }
        conversationService.assertWritable(deal.getConversation());

        deal.setStatus(MentoringDealStatus.CANCELLED);
        deal.setUpdatedBy(currentUser);
        deal.setUpdatedAt(Instant.now());
        dealRepository.save(deal);

        conversationService.postSystemMessage(deal.getConversation(), currentUser, String.format(
                "%s đã hủy luồng Deal hiện tại%s. Mentor có thể gửi Deal Ticket mới nếu hai bên tiếp tục thương lượng.",
                conversationService.displayName(currentUser),
                reason != null && !reason.isBlank() ? " vì lý do: " + reason.trim() : ""));
        return enrichResponse(dealMapper.toResponse(deal), deal, currentUserId);
    }

    // =====================================================================
    // TRUY VẤN
    // =====================================================================

    @Override
    @Transactional(readOnly = true)
    public MentoringDealDetailResponse getDealDetail(Long currentUserId, Long dealId) {
        MentoringDeal deal = dealRepository.findDetailById(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thỏa thuận Deal (ID: " + dealId + ")."));

        boolean isStudent = Objects.equals(deal.getStudent().getId(), currentUserId);
        boolean isMentor = Objects.equals(deal.getMentor().getId(), currentUserId);
        User currentUser = userRepository.findById(currentUserId).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null && "ADMIN".equalsIgnoreCase(currentUser.getRole().getName());
        // Thành viên nhóm cùng tham gia Chat for Task được xem Deal (không có quyền thao tác)
        boolean isGroupParticipant = deal.getConversation() != null
                && participantRepository.existsByConversationIdAndUserId(deal.getConversation().getId(), currentUserId);
        if (!isStudent && !isMentor && !isAdmin && !isGroupParticipant) {
            log.warn("Truy cập trái phép Deal id={} bởi userId={}", dealId, currentUserId);
            throw new ForbiddenException("Bạn không có quyền xem thỏa thuận Deal này.");
        }
        return buildDetail(deal, currentUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MentoringDealResponse> getMyDeals(Long currentUserId, MentoringDealStatus status, Pageable pageable) {
        Page<MentoringDeal> page = dealRepository.findByParticipantAndStatus(currentUserId, status, pageable);
        List<MentoringDealResponse> items = page.getContent().stream()
                .map(d -> enrichResponse(dealMapper.toResponse(d), d, currentUserId))
                .toList();
        return PageResponse.<MentoringDealResponse>builder()
                .content(items)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public MentoringDealDetailResponse getDealByConversation(Long currentUserId, Long conversationId) {
        // Xác thực thành viên trước để không lộ thông tin Deal của Chat for Task khác
        conversationService.requireParticipantConversation(currentUserId, conversationId);
        return dealRepository.findByConversationId(conversationId)
                .map(deal -> buildDetail(deal, currentUserId))
                .orElse(null);
    }

    private MentoringDealDetailResponse buildDetail(MentoringDeal deal, Long currentUserId) {
        List<MentoringDealSnapshotResponse> snapshots = dealMapper.toSnapshotResponseList(
                snapshotRepository.findByDealIdOrderByVersionAsc(deal.getId()));
        return MentoringDealDetailResponse.builder()
                .deal(enrichResponse(dealMapper.toResponse(deal), deal, currentUserId))
                .latestSnapshot(snapshots.isEmpty() ? null : snapshots.get(snapshots.size() - 1))
                .snapshots(snapshots)
                .build();
    }

    // =====================================================================
    // TIỆN ÍCH NGHIỆP VỤ
    // =====================================================================

    /**
     * Bổ sung các cờ quyền thao tác của người dùng hiện tại dựa trên trạng thái Deal, Request và Chat for Task.
     * Frontend chỉ dùng các cờ này để hiển thị; backend vẫn kiểm tra lại toàn bộ ở từng thao tác.
     */
    private MentoringDealResponse enrichResponse(MentoringDealResponse response, MentoringDeal deal, Long currentUserId) {
        if (response == null || deal == null) {
            return response;
        }
        boolean isStudent = Objects.equals(deal.getStudent().getId(), currentUserId);
        boolean isMentor = Objects.equals(deal.getMentor().getId(), currentUserId);
        MentoringRequest mentoringRequest = deal.getRequest();

        String readOnlyReason;
        if (mentoringRequest == null || deal.getConversation() == null) {
            readOnlyReason = LEGACY_DEAL_MESSAGE;
        } else {
            readOnlyReason = conversationService.resolveReadOnlyReason(deal.getConversation());
        }
        boolean writable = readOnlyReason == null;
        boolean requestOpen = mentoringRequest != null
                && mentoringRequest.getStatus() == MentoringRequestStatus.OPEN
                && mentoringRequest.getConfirmedDeal() == null;
        boolean pendingStudent = deal.getStatus() == MentoringDealStatus.MENTOR_CONFIRMED
                && Boolean.TRUE.equals(deal.getMentorConfirmed())
                && !Boolean.TRUE.equals(deal.getStudentConfirmed());
        boolean pendingMentor = deal.getStatus() == MentoringDealStatus.STUDENT_CONFIRMED
                && !Boolean.TRUE.equals(deal.getMentorConfirmed());
        boolean isPaid = Boolean.TRUE.equals(deal.getIsPaid());
        boolean requestCanAcceptPayment = mentoringRequest != null
                && mentoringRequest.getStatus() == MentoringRequestStatus.OPEN
                && mentoringRequest.getSelectedMentor() == null;

        response.setReadOnlyReason(readOnlyReason);
        response.setCanConfirm(writable && requestOpen && ((isStudent && pendingStudent) || (isMentor && pendingMentor)));
        response.setCanReject(writable && requestOpen && isStudent && pendingStudent);
        response.setCanRequestAdjustment(writable && requestOpen && isStudent && pendingStudent);
        response.setCanEdit(writable && requestOpen && isMentor && !isPaid && !Boolean.TRUE.equals(deal.getIsLocked()));
        response.setCanPay(isStudent && !isPaid && deal.getStatus() == MentoringDealStatus.DEAL_CONFIRMED
                && Boolean.TRUE.equals(deal.getIsLocked()) && requestCanAcceptPayment);
        taskRepository.findByDealId(deal.getId()).ifPresent(task -> response.setTaskId(task.getId()));
        return response;
    }

    /** Học viên chỉ được từ chối / yêu cầu điều chỉnh phiên bản mới nhất đang chờ mình phản hồi */
    private void assertStudentActionOnPendingTicket(MentoringDeal deal, Long currentUserId, Integer version,
                                                    MentoringRequest mentoringRequest, String actionLabel) {
        if (!Objects.equals(deal.getStudent().getId(), currentUserId)) {
            if (Objects.equals(deal.getMentor().getId(), currentUserId)) {
                throw new ForbiddenException("Chỉ Học viên mới có quyền " + actionLabel + " Deal Ticket. Mentor có thể gửi phiên bản mới.");
            }
            throw new ForbiddenException("Bạn không có quyền " + actionLabel + " thỏa thuận này.");
        }
        if (version != null) {
            assertLatestVersion(deal, version);
        }
        if (Boolean.TRUE.equals(deal.getIsLocked()) || deal.getStatus() == MentoringDealStatus.DEAL_CONFIRMED) {
            throw new ConflictException("Không thể " + actionLabel + " thỏa thuận đã được cả hai bên xác nhận và khóa snapshot.");
        }
        if (deal.getStatus() != MentoringDealStatus.MENTOR_CONFIRMED) {
            throw new BadRequestException(String.format(
                    "Deal Ticket phiên bản %d không ở trạng thái chờ Học viên phản hồi (Trạng thái: %s).", deal.getVersion(), deal.getStatus()));
        }
        conversationService.assertWritable(deal.getConversation());
        assertRequestOpenForNegotiation(mentoringRequest);
    }

    private void assertLatestVersion(MentoringDeal deal, Integer version) {
        if (!Objects.equals(deal.getVersion(), version)) {
            throw new ConflictException(String.format(
                    "Deal Ticket phiên bản %d đã bị thay thế bởi phiên bản %d. Vui lòng tải lại để xem điều khoản mới nhất.",
                    version, deal.getVersion()));
        }
    }

    /** Request phải còn mở và chưa chốt Mentor nào thì mới được tạo / xác nhận / phản hồi Deal */
    private void assertRequestOpenForNegotiation(MentoringRequest mentoringRequest) {
        if (mentoringRequest.getConfirmedDeal() != null || mentoringRequest.getSelectedMentor() != null) {
            throw new ConflictException("Request đã chốt Deal với một Mentor, không thể tạo hoặc xác nhận Deal mới.");
        }
        if (mentoringRequest.getStatus() != MentoringRequestStatus.OPEN) {
            throw new ConflictException("Request không còn mở để thương lượng Deal (Trạng thái: " + mentoringRequest.getStatus() + ").");
        }
    }

    /** Mentor phải đã ACCEPT Request (phản hồi ACCEPTED) mới được gửi Deal Ticket */
    private void assertMentorAccepted(MentoringRequest mentoringRequest, Long mentorUserId) {
        MentoringRequestDistribution distribution = distributionRepository
                .findByRequestIdAndMentorUserId(mentoringRequest.getId(), mentorUserId)
                .orElseThrow(() -> new ForbiddenException("Request này không được gửi tới bạn."));
        if (distribution.getStatus() != MentoringDistributionStatus.ACCEPTED) {
            throw new ForbiddenException("Bạn cần chấp nhận (ACCEPT) Request trước khi gửi Deal Ticket.");
        }
    }

    /** Điều khoản "Chấp nhận Deal theo Request": lấy từ dữ liệu hiện tại của Request */
    private DealTerms termsFromRequest(MentoringRequest r) {
        BigDecimal price = r.getBudgetMax() != null ? r.getBudgetMax() : r.getBudgetMin();
        if (price == null) {
            throw new BadRequestException("Request chưa có mức ngân sách đề xuất. Vui lòng dùng \"Deal lại / Tạo Deal Ticket\" để nhập giá.");
        }
        mentoringRules.requirePayableAmount(price, "Ngân sách của Request");
        if (r.getExpectedDeadline() == null || !r.getExpectedDeadline().isAfter(Instant.now())) {
            throw new BadRequestException("Request không có thời hạn mong muốn hợp lệ trong tương lai. Vui lòng dùng \"Deal lại / Tạo Deal Ticket\" để đề xuất deadline.");
        }
        String scope = (r.getTitle() + "\n\n" + r.getDescription()).trim();
        if (scope.length() > 5000) {
            scope = scope.substring(0, 5000);
        }
        MentoringParticipationType participation = r.getParticipationType() == MentoringType.GROUP
                ? MentoringParticipationType.GROUP
                : MentoringParticipationType.INDIVIDUAL;
        return new DealTerms(scope, price, r.getExpectedDeadline(), r.getWorkingMode(), participation, r.getTaskType(),
                "Hoàn thành yêu cầu \"" + r.getTitle() + "\" theo đúng mô tả của Request.");
    }

    /** Điều khoản "Deal lại": bắt buộc đầy đủ từ Mentor (thông điệp khớp với validation của DTO) */
    private DealTerms termsFromBody(String taskScope, BigDecimal agreedPrice, Instant deadline, MentoringWorkingMode workingMode,
                                    MentoringParticipationType participationType, MentoringTaskType taskType, String expectedResult) {
        if (taskScope == null || taskScope.isBlank()) {
            throw new BadRequestException("Phạm vi công việc (Task Scope) không được để trống.");
        }
        if (agreedPrice == null) {
            throw new BadRequestException("Mức giá thỏa thuận không được để trống.");
        }
        mentoringRules.requirePayableAmount(agreedPrice, "Mức giá thỏa thuận");
        if (deadline == null) {
            throw new BadRequestException("Hạn chót hoàn thành (Deadline) không được để trống.");
        }
        if (!deadline.isAfter(Instant.now())) {
            throw new BadRequestException("Hạn chót hoàn thành (Deadline) phải là một thời điểm trong tương lai.");
        }
        if (workingMode == null) {
            throw new BadRequestException("Hình thức làm việc (Working Mode) không được để trống.");
        }
        if (participationType == null) {
            throw new BadRequestException("Hình thức tham gia (Participation Type) không được để trống.");
        }
        if (taskType == null) {
            throw new BadRequestException("Loại nhiệm vụ (Task Type) không được để trống.");
        }
        if (expectedResult == null || expectedResult.isBlank()) {
            throw new BadRequestException("Kết quả kỳ vọng đầu ra (Expected Result) không được để trống.");
        }
        return new DealTerms(taskScope.trim(), agreedPrice, deadline, workingMode, participationType, taskType, expectedResult.trim());
    }

    /** Lấy request_id của Deal mà không nạp Deal vào persistence context (để Deal được đọc mới sau khi khóa Request) */
    private Long resolveRequestId(Long dealId) {
        Optional<Long> requestId = dealRepository.findRequestIdByDealId(dealId);
        if (requestId.isPresent()) {
            return requestId.get();
        }
        if (!dealRepository.existsById(dealId)) {
            throw new ResourceNotFoundException("Không tìm thấy thỏa thuận Deal (ID: " + dealId + ").");
        }
        throw new BadRequestException(LEGACY_DEAL_MESSAGE);
    }

    private MentoringRequest lockRequest(Long requestId) {
        return requestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));
    }

    private MentoringDeal loadDeal(Long dealId) {
        return dealRepository.findDetailById(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thỏa thuận Deal (ID: " + dealId + ")."));
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng đang thao tác."));
    }

    /** Bộ điều khoản của một phiên bản Deal Ticket */
    private record DealTerms(String taskScope, BigDecimal agreedPrice, Instant deadline, MentoringWorkingMode workingMode,
                             MentoringParticipationType participationType, MentoringTaskType taskType, String expectedResult) {
    }
}
