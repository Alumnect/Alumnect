package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDealRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestDistributionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskPaymentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestDistribution;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskPayment;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.payos.PayOSGateway;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

/**
 * Đóng vòng đời Request Mentoring khi Học viên hủy hoặc khi quá thời hạn mong muốn.
 * Đóng Request đồng thời: hết hạn các phân phối đang chờ, hủy Deal chưa thanh toán,
 * hủy link thanh toán đang chờ và chuyển các Chat for Task sang chỉ đọc.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringRequestLifecycleService {

    private static final Set<MentoringDealStatus> OPEN_DEAL_STATUSES = EnumSet.of(
            MentoringDealStatus.PROPOSED, MentoringDealStatus.STUDENT_CONFIRMED,
            MentoringDealStatus.MENTOR_CONFIRMED, MentoringDealStatus.DEAL_CONFIRMED);

    private final MentoringRequestRepository requestRepository;
    private final MentoringRequestDistributionRepository distributionRepository;
    private final MentoringDealRepository dealRepository;
    private final MentoringTaskRepository taskRepository;
    private final MentoringTaskPaymentRepository paymentRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final MentoringConversationService conversationService;
    private final NotificationService notificationService;
    private final PayOSGateway payOSGateway;

    /** Request có thể hủy khi còn mở và chưa kích hoạt Task. */
    public boolean canCancel(MentoringRequest request, Long userId) {
        return request.getStudent().getId().equals(userId)
                && request.getStatus() == MentoringRequestStatus.OPEN
                && taskRepository.findByRequestId(request.getId()).isEmpty();
    }

    @Transactional
    public void cancelByOwner(String userEmail, Long requestId, String reason) {
        User owner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        MentoringRequest request = requestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));
        if (!request.getStudent().getId().equals(owner.getId())) {
            throw new ForbiddenException("Chỉ người tạo mới có quyền hủy yêu cầu này.");
        }
        if (request.getStatus() != MentoringRequestStatus.OPEN || taskRepository.findByRequestId(requestId).isPresent()) {
            throw new ConflictException("Chỉ có thể hủy yêu cầu đang mở và chưa kích hoạt Task.");
        }
        String note = reason != null && !reason.isBlank() ? reason.trim() : "Người tạo đã hủy yêu cầu.";
        close(request, MentoringRequestStatus.CANCELLED, owner, note);
    }

    /**
     * Đóng một Request đã quá thời hạn mong muốn. Bỏ qua nếu Request đã có Task,
     * hoặc đang có Deal đã chốt hai bên còn deadline hợp lệ (Học viên đang chuẩn bị thanh toán).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean expireIfOverdue(Long requestId) {
        MentoringRequest request = requestRepository.findByIdForUpdate(requestId).orElse(null);
        Instant now = Instant.now();
        if (request == null || request.getStatus() != MentoringRequestStatus.OPEN
                || request.getExpectedDeadline() == null || request.getExpectedDeadline().isAfter(now)
                || taskRepository.findByRequestId(requestId).isPresent()) {
            return false;
        }
        boolean awaitingPayment = dealRepository.findByRequestId(requestId).stream()
                .anyMatch(d -> d.getStatus() == MentoringDealStatus.DEAL_CONFIRMED
                        && d.getDeadline() != null && d.getDeadline().isAfter(now));
        if (awaitingPayment) {
            return false;
        }
        close(request, MentoringRequestStatus.EXPIRED, request.getStudent(),
                "Yêu cầu đã quá thời hạn mong muốn mà chưa chốt Mentor nên được hệ thống tự đóng.");
        return true;
    }

    private void close(MentoringRequest request, MentoringRequestStatus status, User actor, String note) {
        Instant now = Instant.now();
        request.setStatus(status);
        requestRepository.save(request);

        for (MentoringRequestDistribution d : distributionRepository
                .findByRequestIdAndStatus(request.getId(), MentoringDistributionStatus.PENDING)) {
            d.setStatus(MentoringDistributionStatus.EXPIRED);
            distributionRepository.save(d);
        }

        for (MentoringDeal deal : dealRepository.findByRequestId(request.getId())) {
            if (OPEN_DEAL_STATUSES.contains(deal.getStatus()) && !Boolean.TRUE.equals(deal.getIsPaid())) {
                deal.setStatus(MentoringDealStatus.CANCELLED);
                deal.setUpdatedBy(actor);
                deal.setUpdatedAt(now);
                dealRepository.save(deal);
            }
        }

        for (MentoringTaskPayment payment : paymentRepository.findByRequestIdAndPaymentStatus(request.getId(), PaymentStatus.PENDING)) {
            try {
                payOSGateway.cancelPaymentLink(payment.getOrderCode(), "Yêu cầu Mentoring đã đóng");
            } catch (Exception ex) {
                log.warn("Không thể hủy link thanh toán orderCode={}: {}", payment.getOrderCode(), ex.getMessage());
            }
            payment.setPaymentStatus(PaymentStatus.CANCELLED);
            paymentRepository.save(payment);
        }

        String label = status == MentoringRequestStatus.EXPIRED ? "đã hết hạn" : "đã bị hủy";
        for (Conversation conversation : conversationRepository.findByMentoringRequestIdOrderByCreatedAtAsc(request.getId())) {
            conversationService.postSystemMessage(conversation, actor,
                    "Yêu cầu \"" + request.getTitle() + "\" " + label + ". " + note + " Cuộc trò chuyện chuyển sang chỉ đọc.");
            User mentor = conversation.getMentoringMentor();
            if (mentor != null) {
                notificationService.sendMentoringAccountNotification(actor, mentor, "MENTORING_INCOMING_REQUEST_CLOSED",
                        String.valueOf(request.getId()), "Yêu cầu Mentoring " + label,
                        "Yêu cầu \"" + request.getTitle() + "\" " + label + ".");
            }
        }
        if (status == MentoringRequestStatus.EXPIRED) {
            notificationService.sendMentoringAccountNotification(null, request.getStudent(), "MENTORING_REQUEST_CLOSED",
                    String.valueOf(request.getId()), "Yêu cầu Mentoring đã hết hạn", note);
        }
        log.info("Request id={} chuyển sang {}: {}", request.getId(), status, note);
    }
}
