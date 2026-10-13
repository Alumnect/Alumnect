package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.common.enums.ConversationType;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDealRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskPaymentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateTaskPaymentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentCheckoutResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskPayment;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.payos.PayOSGateway;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringTaskMapper;
import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringLedgerTransactionType;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringPaymentLedgerRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestDistributionRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringPaymentLedger;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestDistribution;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

/**
 * Triển khai dịch vụ thanh toán Mentoring Task qua cổng PayOS (UC105).
 * Hỗ trợ tạo Payment Link, VietQR, Polling trạng thái realtime và xử lý Webhook IPN an toàn.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringTaskPaymentServiceImpl implements MentoringTaskPaymentService {

    private final MentoringDealRepository dealRepository;
    private final MentoringTaskRepository taskRepository;
    private final MentoringTaskPaymentRepository paymentRepository;
    private final MentoringRequestRepository requestRepository;
    private final ConversationRepository conversationRepository;
    private final MentoringConversationService conversationService;
    private final MentoringPaymentLedgerRepository ledgerRepository;
    private final MentoringRequestDistributionRepository distributionRepository;
    private final PayOSGateway payOSGateway;
    private final MentoringTaskMapper taskMapper;

    @Value("${app.payos.payment-expiration-minutes:15}")
    private int expirationMinutes;

    @Value("${app.payos.task-return-url:http://localhost:5173/app/mentoring/deals?payment=success}")
    private String taskReturnUrl;

    @Value("${app.payos.task-cancel-url:http://localhost:5173/app/mentoring/deals?payment=cancelled}")
    private String taskCancelUrl;

    /**
     * Khởi tạo một lần thanh toán (payment attempt) cho Deal đã chốt của Request.
     * Số tiền luôn lấy server-side từ agreed_price của Deal đã khóa; client chỉ gửi dealId.
     *
     * @param currentUserId ID Học viên đang đăng nhập
     * @param request DTO chứa dealId
     * @return Thông tin checkout VietQR / PayOS
     */
    @Override
    @Transactional
    public MentoringTaskPaymentCheckoutResponse createTaskPayment(Long currentUserId, CreateTaskPaymentRequest request) {
        log.info("Bắt đầu khởi tạo giao dịch thanh toán Task cho dealId={} bởi userId={}", request.getDealId(), currentUserId);

        // 1. Kiểm tra tồn tại thỏa thuận Deal
        MentoringDeal deal = dealRepository.findById(request.getDealId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thỏa thuận Mentoring Deal với ID: " + request.getDealId()));

        // 2. Chỉ có Học viên (Student) của Deal mới được quyền thanh toán
        if (!deal.getStudent().getId().equals(currentUserId)) {
            throw new ForbiddenException("Chỉ có Học viên (Student) tham gia Deal mới có quyền thực hiện thanh toán nhiệm vụ này.");
        }

        // 3. Deal phải thuộc một Request (không thanh toán Deal mồ côi / legacy)
        if (deal.getRequest() == null || deal.getConversation() == null) {
            throw new BadRequestException("Deal này không gắn với Mentoring Request nên không thể thanh toán.");
        }
        // Khóa bi quan Request để tuần tự hóa các yêu cầu thanh toán đồng thời cho cùng một Request
        MentoringRequest mentoringRequest = requestRepository.findByIdForUpdate(deal.getRequest().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Mentoring Request với ID: " + deal.getRequest().getId()));

        // 4. Deal phải đã được hai bên xác nhận và khóa (DEAL_CONFIRMED)
        if (deal.getStatus() != MentoringDealStatus.DEAL_CONFIRMED
                || !Boolean.TRUE.equals(deal.getIsLocked())
                || !Boolean.TRUE.equals(deal.getMentorConfirmed())
                || !Boolean.TRUE.equals(deal.getStudentConfirmed())) {
            throw new ConflictException("Thỏa thuận Deal chưa được cả hai bên xác nhận hoàn tất (DEAL_CONFIRMED). Không thể thanh toán.");
        }

        // 5. Request phải còn mở và chưa chốt với Mentor khác
        if (mentoringRequest.getStatus() == MentoringRequestStatus.CLOSED
                || mentoringRequest.getSelectedMentor() != null
                || taskRepository.findByRequestId(mentoringRequest.getId()).isPresent()) {
            throw new ConflictException("Request này đã chốt Mentor và kích hoạt Task, không thể thanh toán Deal khác.");
        }
        if (mentoringRequest.getStatus() != MentoringRequestStatus.OPEN) {
            throw new ConflictException("Request không còn ở trạng thái mở để thanh toán (Trạng thái: " + mentoringRequest.getStatus() + ").");
        }

        // 6. Kiểm tra Deal đã được thanh toán hoặc đã tạo Task chưa
        if (Boolean.TRUE.equals(deal.getIsPaid()) || taskRepository.existsByDealId(deal.getId())) {
            throw new ConflictException("Thỏa thuận Deal này đã được thanh toán và kích hoạt Task trước đó rồi.");
        }

        Instant now = Instant.now();

        // 7. Bảo vệ ràng buộc chỉ 1 checkout PENDING hoạt động cho Request:
        //    - Nếu có đơn PENDING của cùng Deal còn hạn -> Tái sử dụng
        //    - Nếu đã hết hạn -> Đánh dấu EXPIRED
        //    - Nếu là đơn PENDING của Deal khác cùng Request -> Hủy link cũ (CANCELLED) để mở checkout cho Deal mới
        Optional<MentoringTaskPayment> existingPendingOpt = paymentRepository.findFirstByRequestIdAndPaymentStatusOrderByCreatedAtDesc(
                mentoringRequest.getId(), PaymentStatus.PENDING);

        if (existingPendingOpt.isPresent()) {
            MentoringTaskPayment existing = existingPendingOpt.get();
            if (existing.getPaymentExpiresAt().isBefore(now)) {
                log.info("Giao dịch PENDING id={}, orderCode={} đã hết hạn. Đánh dấu EXPIRED.", existing.getId(), existing.getOrderCode());
                existing.setPaymentStatus(PaymentStatus.EXPIRED);
                paymentRepository.saveAndFlush(existing);
            } else if (existing.getDeal().getId().equals(deal.getId())) {
                log.info("Tái sử dụng giao dịch PENDING id={}, orderCode={} cho dealId={}", existing.getId(), existing.getOrderCode(), deal.getId());
                return taskMapper.toCheckoutResponse(existing);
            } else {
                try {
                    payOSGateway.cancelPaymentLink(existing.getOrderCode(), "Học viên chọn thanh toán Deal khác cho cùng yêu cầu");
                } catch (Exception ex) {
                    log.warn("Không thể hủy Payment Link cũ trên PayOS cho orderCode={}: {}", existing.getOrderCode(), ex.getMessage());
                }
                existing.setPaymentStatus(PaymentStatus.CANCELLED);
                paymentRepository.saveAndFlush(existing);
            }
        }

        // 8. Sinh mã đơn hàng PayOS duy nhất (orderCode nguyên dương 53-bit)
        long orderCode = (System.currentTimeMillis() % 100000000000L) + (long) (Math.random() * 900 + 100);
        Instant paymentExpiresAt = now.plus(Duration.ofMinutes(expirationMinutes));
        BigDecimal amount = deal.getAgreedPrice();

        // Mô tả chuyển khoản không dấu tối đa 25 ký tự
        String description = "TASK " + (orderCode % 1000000);

        // 9. Gọi PayOS SDK tạo Payment Link (số tiền lấy từ Deal đã khóa, không lấy từ client)
        CreatePaymentLinkRequest payOSRequest = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amount.longValue())
                .description(description)
                .returnUrl(taskReturnUrl)
                .cancelUrl(taskCancelUrl)
                .expiredAt(paymentExpiresAt.getEpochSecond())
                .items(List.of(PaymentLinkItem.builder()
                        .name("Mentoring Task #" + deal.getId())
                        .quantity(1)
                        .price(amount.longValue())
                        .build()))
                .build();

        CreatePaymentLinkResponse payOSResponse;
        try {
            payOSResponse = payOSGateway.createPaymentLink(payOSRequest);
        } catch (Exception ex) {
            log.error("Lỗi khi kết nối cổng PayOS tạo payment link cho orderCode={}: {}", orderCode, ex.getMessage());
            throw new BadRequestException("Không thể khởi tạo liên kết thanh toán PayOS. Vui lòng thử lại sau.");
        }

        String actualDescription = (payOSResponse.getDescription() != null && !payOSResponse.getDescription().isBlank())
                ? payOSResponse.getDescription()
                : description;

        // 10. Lưu bản ghi payment attempt ở trạng thái PENDING (truy ngược được confirmed Deal & Request)
        MentoringTaskPayment payment = MentoringTaskPayment.builder()
                .deal(deal)
                .request(mentoringRequest)
                .student(deal.getStudent())
                .orderCode(orderCode)
                .amount(amount)
                .paymentStatus(PaymentStatus.PENDING)
                .paymentMethod("PAYOS")
                .paymentReference(payOSResponse.getPaymentLinkId())
                .description(actualDescription)
                .qrCodeUrl(payOSResponse.getQrCode())
                .checkoutUrl(payOSResponse.getCheckoutUrl())
                .accountNumber(payOSResponse.getAccountNumber())
                .accountName(payOSResponse.getAccountName())
                .bin(payOSResponse.getBin())
                .paymentExpiresAt(paymentExpiresAt)
                .build();

        MentoringTaskPayment savedPayment = paymentRepository.save(payment);
        log.info("Khởi tạo thành công giao dịch Task Payment id={}, orderCode={} cho dealId={}",
                savedPayment.getId(), orderCode, deal.getId());

        return taskMapper.toCheckoutResponse(savedPayment);
    }

    @Override
    @Transactional
    public MentoringTaskPaymentStatusResponse checkTaskPaymentStatus(Long currentUserId, Long orderCode) {
        log.info("Kiểm tra trạng thái Task Payment orderCode={} bởi userId={}", orderCode, currentUserId);

        // Khóa bi quan giao dịch để Polling và Webhook đồng thời không kích hoạt Task hai lần
        MentoringTaskPayment payment = paymentRepository.findForUpdateByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch thanh toán với mã đơn: " + orderCode));

        MentoringDeal deal = payment.getDeal();
        // Kiểm tra quyền: Student hoặc Mentor của Deal được phép tra cứu
        if (!deal.getStudent().getId().equals(currentUserId) && !deal.getMentor().getId().equals(currentUserId)) {
            throw new ForbiddenException("Bạn không có quyền xem thông tin giao dịch thanh toán này.");
        }

        // Nếu đã PAID, trả về kết quả thành công ngay
        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            MentoringTaskPaymentStatusResponse response = taskMapper.toStatusResponse(payment);
            response.setMessage("Thanh toán thành công. Task đang ở giai đoạn chuẩn bị (PREPARATION).");
            return response;
        }

        // Nếu đang PENDING, chủ động tra cứu (Fallback Polling) từ PayOS Gateway
        if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
            try {
                PaymentLink paymentLink = payOSGateway.getPaymentLinkInformation(orderCode);
                String payOsStatus = paymentLink.getStatus().toString();

                if ("PAID".equalsIgnoreCase(payOsStatus)) {
                    log.info("Phát hiện orderCode={} đã PAID từ PayOS qua Polling! Tiến hành kích hoạt Task...", orderCode);
                    activateTaskUponPaymentSuccess(payment);
                    MentoringTaskPaymentStatusResponse response = taskMapper.toStatusResponse(payment);
                    response.setMessage("Thanh toán thành công. Mentoring Task đã chính thức được kích hoạt!");
                    return response;
                } else if ("CANCELLED".equalsIgnoreCase(payOsStatus)) {
                    payment.setPaymentStatus(PaymentStatus.CANCELLED);
                    paymentRepository.save(payment);
                } else if ("EXPIRED".equalsIgnoreCase(payOsStatus)) {
                    payment.setPaymentStatus(PaymentStatus.EXPIRED);
                    paymentRepository.save(payment);
                }
            } catch (Exception ex) {
                log.warn("Không thể kiểm tra trạng thái từ PayOS Gateway cho orderCode={}: {}", orderCode, ex.getMessage());
            }
        }

        MentoringTaskPaymentStatusResponse response = taskMapper.toStatusResponse(payment);
        if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
            response.setMessage("Giao dịch đang chờ thanh toán qua VietQR / PayOS.");
        } else if (payment.getPaymentStatus() == PaymentStatus.CANCELLED) {
            response.setMessage("Giao dịch thanh toán đã bị hủy.");
        } else if (payment.getPaymentStatus() == PaymentStatus.EXPIRED) {
            response.setMessage("Giao dịch thanh toán đã hết hạn.");
        } else {
            response.setMessage("Giao dịch thanh toán thất bại.");
        }
        return response;
    }

    @Override
    @Transactional
    public MentoringTaskPaymentStatusResponse cancelTaskPayment(Long currentUserId, Long orderCode) {
        log.info("Học viên userId={} yêu cầu hủy giao dịch Task Payment orderCode={}", currentUserId, orderCode);

        // Khóa bi quan để lệnh hủy không ghi đè kết quả PAID của Webhook chạy đồng thời
        MentoringTaskPayment payment = paymentRepository.findForUpdateByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch thanh toán với mã đơn: " + orderCode));

        if (!payment.getStudent().getId().equals(currentUserId)) {
            throw new ForbiddenException("Chỉ người thực hiện thanh toán mới có quyền hủy đơn thanh toán này.");
        }

        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            throw new ConflictException("Không thể hủy giao dịch đã thanh toán thành công.");
        }

        if (payment.getPaymentStatus() == PaymentStatus.PENDING) {
            try {
                payOSGateway.cancelPaymentLink(orderCode, "Học viên chủ động hủy giao dịch");
            } catch (Exception ex) {
                log.warn("Không thể hủy link trên PayOS cho orderCode={}: {}", orderCode, ex.getMessage());
            }
            payment.setPaymentStatus(PaymentStatus.CANCELLED);
            paymentRepository.save(payment);
        }

        MentoringTaskPaymentStatusResponse response = taskMapper.toStatusResponse(payment);
        response.setMessage("Đã hủy bỏ giao dịch thanh toán thành công.");
        return response;
    }

    @Override
    @Transactional
    public void handlePayOSWebhook(Webhook webhook) {
        log.info("Tiếp nhận Webhook IPN từ PayOS cho Mentoring Task Payment");

        WebhookData data;
        try {
            data = payOSGateway.verifyPaymentWebhookData(webhook);
        } catch (Exception ex) {
            log.error("Xác thực chữ ký Webhook PayOS thất bại: {}", ex.getMessage());
            throw new BadRequestException("Chữ ký Webhook PayOS không hợp lệ.");
        }

        if (data == null || data.getOrderCode() == null) {
            throw new BadRequestException("Dữ liệu Webhook PayOS không hợp lệ.");
        }

        Long orderCode = data.getOrderCode();
        log.info("Webhook PayOS hợp lệ cho Task Payment orderCode={}, code={}, amount={}", orderCode, data.getCode(), data.getAmount());

        // Khóa bi quan bản ghi giao dịch (Pessimistic Write Lock)
        Optional<MentoringTaskPayment> paymentOpt = paymentRepository.findForUpdateByOrderCode(orderCode);
        if (paymentOpt.isEmpty()) {
            log.info("orderCode={} không thuộc bảng mentoring_task_payments, bỏ qua.", orderCode);
            return;
        }

        MentoringTaskPayment payment = paymentOpt.get();

        // Idempotency: nếu đã PAID thì không xử lý lại
        if (payment.getPaymentStatus() == PaymentStatus.PAID) {
            log.info("Giao dịch Task Payment orderCode={} đã được xử lý PAID trước đó. Bỏ qua idempotency.", orderCode);
            return;
        }

        // Chỉ xử lý giao dịch đang chờ; giao dịch đã hủy / hết hạn / thất bại không được kích hoạt Task
        if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
            log.warn("Bỏ qua Webhook cho orderCode={} vì giao dịch đang ở trạng thái {}", orderCode, payment.getPaymentStatus());
            return;
        }

        // Đối soát số tiền: lệch tiền → FAILED (lưu lại, không ném lỗi để transaction không bị rollback)
        if (data.getAmount() != null && payment.getAmount().longValue() != data.getAmount()) {
            log.error("Lệch số tiền thanh toán Webhook! Dự kiến={}, Thực nhận={}", payment.getAmount(), data.getAmount());
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return;
        }

        if (!"00".equals(data.getCode())) {
            log.warn("Giao dịch Task orderCode={} bị cổng thanh toán báo thất bại với mã: {}", orderCode, data.getCode());
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            return;
        }

        // Kích hoạt Task
        activateTaskUponPaymentSuccess(payment);
    }

    /**
     * Kích hoạt Mentoring Task khi thanh toán thành công (Source of Truth) — idempotent và atomic:
     * khóa Request → đánh dấu Payment PAID → khóa Deal đã thanh toán → tạo/lấy Task (truy ngược Request, Deal,
     * Conversation, Payment) → gắn Task vào Chat for Task hiện tại → chuyển Request sang CLOSED.
     * Không tạo Conversation mới; Chat for Task cũ tiếp tục được dùng cho Task.
     */
    private void activateTaskUponPaymentSuccess(MentoringTaskPayment payment) {
        Instant now = Instant.now();
        MentoringDeal deal = payment.getDeal();
        MentoringRequest mentoringRequest = deal.getRequest() != null
                ? requestRepository.findByIdForUpdate(deal.getRequest().getId()).orElse(null)
                : null;

        // Idempotency: Nếu payment đã PAID thì không xử lý lại
        if (payment.getPaymentStatus() == PaymentStatus.PAID && payment.getPaidAt() != null) {
            log.info("Payment orderCode={} đã ở trạng thái PAID trước đó (Idempotent callback)", payment.getOrderCode());
            return;
        }

        // 1. Cập nhật Payment
        payment.setPaymentStatus(PaymentStatus.PAID);
        payment.setPaidAt(now);

        // 2. Cập nhật Deal
        deal.setIsPaid(true);
        deal.setPaidAt(now);
        deal.setIsLocked(true);
        dealRepository.save(deal);

        // 3. Tạo MentoringTask ở giai đoạn PREPARATION nếu chưa có (mỗi Deal chỉ sinh đúng 1 Task)
        MentoringTask task = taskRepository.findByDealId(deal.getId()).orElse(null);
        boolean newlyActivated = task == null;
        if (newlyActivated) {
            String shortTitle = deal.getTaskScope().length() > 60
                    ? deal.getTaskScope().substring(0, 57).trim() + "..."
                    : deal.getTaskScope();

            task = taskRepository.save(MentoringTask.builder()
                    .deal(deal)
                    .request(mentoringRequest)
                    .student(deal.getStudent())
                    .mentor(deal.getMentor())
                    .conversation(deal.getConversation())
                    .taskTitle(shortTitle)
                    .taskScope(deal.getTaskScope())
                    .agreedPrice(deal.getAgreedPrice())
                    .deadline(deal.getDeadline())
                    .workingMode(deal.getWorkingMode())
                    .participationType(deal.getParticipationType())
                    .taskType(deal.getTaskType())
                    .expectedResult(deal.getExpectedResult())
                    .status(MentoringTaskStatus.PREPARATION)
                    .startedAt(now)
                    .build());
            log.info("Kích hoạt thành công Mentoring Task id={} cho dealId={} ở trạng thái PREPARATION", task.getId(), deal.getId());
        } else {
            log.warn("Deal id={} đã có Task id={} — không tạo Task thứ hai cho payment orderCode={}",
                    deal.getId(), task.getId(), payment.getOrderCode());
        }

        payment.setTask(task);
        paymentRepository.save(payment);

        // 4. Ghi Sổ quỹ giao dịch Mentoring (Escrow Inflow) — Idempotent
        if (!ledgerRepository.existsByPaymentIdAndTransactionType(payment.getId(), MentoringLedgerTransactionType.ESCROW_COLLECTION)) {
            MentoringPaymentLedger ledgerEntry = MentoringPaymentLedger.builder()
                    .payment(payment)
                    .request(mentoringRequest != null ? mentoringRequest : deal.getRequest())
                    .task(task)
                    .deal(deal)
                    .student(deal.getStudent())
                    .mentor(deal.getMentor())
                    .amount(payment.getAmount())
                    .transactionType(MentoringLedgerTransactionType.ESCROW_COLLECTION)
                    .status(MentoringLedgerStatus.SUCCEEDED)
                    .providerReference(payment.getPaymentReference() != null ? payment.getPaymentReference() : String.valueOf(payment.getOrderCode()))
                    .deadlineSnapshot(deal.getDeadline())
                    .note(String.format("Ký quỹ thành công đơn hàng orderCode=%d cho Task #%d", payment.getOrderCode(), task.getId()))
                    .build();
            ledgerRepository.save(ledgerEntry);
            log.info("Đã ghi nhận giao dịch vào Sổ quỹ Mentoring: ledgerId={}, orderCode={}", ledgerEntry.getId(), payment.getOrderCode());
        }

        if (!newlyActivated) {
            return;
        }

        // 5. CHỐT MENTOR THẮNG CUỘC VÀ ĐÓNG CÁC LỰA CHỌN KHÁC (Chỉ sau khi thanh toán thành công)
        if (mentoringRequest != null) {
            mentoringRequest.setSelectedMentor(deal.getMentor());
            mentoringRequest.setConfirmedDeal(deal);
            mentoringRequest.setStatus(MentoringRequestStatus.CLOSED);
            requestRepository.saveAndFlush(mentoringRequest);

            // 5.1 Đóng các luồng Deal của Mentor khác cùng Request (giữ nguyên lịch sử phiên bản)
            for (MentoringDeal other : dealRepository.findByRequestIdAndIdNot(mentoringRequest.getId(), deal.getId())) {
                if (other.getStatus() != MentoringDealStatus.CANCELLED) {
                    other.setStatus(MentoringDealStatus.CANCELLED);
                    other.setUpdatedBy(deal.getStudent());
                    other.setUpdatedAt(now);
                    dealRepository.save(other);
                    log.info("Đóng Deal id={} của Mentor khác do Request id={} đã chốt và thanh toán Deal id={}",
                            other.getId(), mentoringRequest.getId(), deal.getId());
                }
            }

            // 5.2 Các phản hồi còn đang chờ không thể ACCEPT nữa
            for (MentoringRequestDistribution pending : distributionRepository
                    .findByRequestIdAndStatus(mentoringRequest.getId(), MentoringDistributionStatus.PENDING)) {
                pending.setStatus(MentoringDistributionStatus.EXPIRED);
                distributionRepository.save(pending);
            }

            // 5.3 Thông báo vào các Chat for Task khác: chuyển chỉ đọc theo trạng thái Request
            for (Conversation other : conversationRepository.findByMentoringRequestIdOrderByCreatedAtAsc(mentoringRequest.getId())) {
                if (!Objects.equals(other.getId(), deal.getConversation().getId())) {
                    conversationService.postSystemMessage(other, deal.getStudent(), MentoringConversationServiceImpl.READ_ONLY_OTHER_MENTOR);
                }
            }
        }

        // 6. Gắn Task vào Chat for Task hiện tại (không tạo cuộc hội thoại mới) và thông báo hai bên
        Conversation conversation = deal.getConversation();
        if (conversation != null) {
            if (conversation.getType() == ConversationType.MENTORING) {
                conversation.setMentoringTask(task);
                conversationRepository.save(conversation);
            }
            String formattedPrice = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN")).format(deal.getAgreedPrice());
            conversationService.postSystemMessage(conversation, deal.getStudent(), String.format(
                    "Thanh toán thành công, Task đã được kích hoạt. (Task #%d · %s · giai đoạn PREPARATION)",
                    task.getId(), formattedPrice));
        }
    }
}
