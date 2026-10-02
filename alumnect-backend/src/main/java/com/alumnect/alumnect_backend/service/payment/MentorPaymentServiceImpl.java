package com.alumnect.alumnect_backend.service.payment;

import com.alumnect.alumnect_backend.common.enums.MentorPackageStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.common.enums.TransactionType;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPackageRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.payment.PaymentTransactionRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.payment.CreateMentorPaymentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.dto.response.payment.MentorPaymentCheckoutResponse;
import com.alumnect.alumnect_backend.dto.response.payment.PaymentTransactionStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPackage;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.payment.PaymentTransaction;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.integration.payos.PayOSGateway;
import com.alumnect.alumnect_backend.service.mentorship.MentorEligibilityService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTermsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Lớp dịch vụ thực thi thanh toán gói Mentor qua cổng PayOS (UC93).
 * Đáp ứng đầy đủ quy tắc tính toán giá từ DB, khóa bi quan chống race condition,
 * idempotency callback và gia hạn subscription bảo toàn thời gian còn lại.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentorPaymentServiceImpl implements MentorPaymentService {

    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorPackageRepository mentorPackageRepository;
    private final MentorSubscriptionRepository mentorSubscriptionRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PayOSGateway payOSGateway;
    private final MentoringTermsService mentoringTermsService;
    private final MentorEligibilityService mentorEligibilityService;

    @Value("${app.payos.payment-expiration-minutes:15}")
    private int expirationMinutes;

    @Value("${app.payos.return-url:http://localhost:5173/app/mentoring/subscription/payment-result}")
    private String returnUrl;

    @Value("${app.payos.cancel-url:http://localhost:5173/app/mentoring/subscription}")
    private String cancelUrl;

    /**
     * Khởi tạo giao dịch thanh toán gói Mentor Subscription qua PayOS (UC93).
     *
     * @param userEmail Email người dùng đăng nhập
     * @param request DTO yêu cầu thanh toán
     * @return DTO thông tin checkout gồm VietQR và link PayOS
     */
    @Override
    @Transactional
    public MentorPaymentCheckoutResponse createMentorSubscriptionPayment(String userEmail, CreateMentorPaymentRequest request) {
        log.info("Người dùng email={} yêu cầu tạo giao dịch thanh toán Mentor Subscription", userEmail);

        // 1. Xác thực người dùng và kiểm tra vai trò ALUMNI
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại."));

        if (user.getRole() == null || !"ALUMNI".equalsIgnoreCase(user.getRole().getName())) {
            throw new ForbiddenException("Chức năng thanh toán gói Mentor chỉ dành riêng cho Cựu sinh viên (ALUMNI).");
        }

        // 2. Kiểm tra việc chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (UC90)
        MentoringTermsStatusResponse termsStatus = mentoringTermsService.getCurrentTermsStatus(userEmail);
        if (termsStatus == null || !termsStatus.isAccepted()) {
            throw new ForbiddenException("Bạn phải chấp nhận Điều khoản Hướng dẫn & Hỗ trợ trước khi thanh toán gói Mentor.");
        }

        // 3. Kiểm tra hồ sơ Mentor (không được INCOMPLETE)
        MentorProfile profile = mentorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Bạn cần hoàn thiện thông tin đăng ký Mentor (UC91) trước khi thanh toán gói dịch vụ."));

        if (profile.getMentorStatus() == MentorStatus.INCOMPLETE) {
            throw new BadRequestException("Bạn cần hoàn thiện thông tin đăng ký Mentor (UC91) trước khi thanh toán gói dịch vụ.");
        }

        // 3.1. Kiểm tra nếu Mentor đã có gói đang ACTIVE và chưa hết hạn thì KHÔNG tạo thanh toán mới
        List<MentorSubscription> activeSubs = mentorSubscriptionRepository
                .findByMentorProfileIdOrderByCreatedAtDesc(profile.getId());
        final Instant currentTime = Instant.now();
        Optional<MentorSubscription> currentActiveSubOpt = activeSubs.stream()
                .filter(s -> (s.getStatus() == MentorSubscriptionStatus.ACTIVE || s.getStatus() == MentorSubscriptionStatus.PAID)
                        && s.getEndDate() != null && s.getEndDate().isAfter(currentTime))
                .findFirst();

        if (currentActiveSubOpt.isPresent()) {
            MentorSubscription currentSub = currentActiveSubOpt.get();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
            String expDateStr = formatter.format(currentSub.getEndDate());
            throw new BadRequestException("Bạn đang có gói Mentor (" + currentSub.getMentorPackage().getName() 
                    + ") đang hoạt động đến ngày " + expDateStr + ". Vui lòng chờ hết hạn gói hiện tại trước khi đăng ký hoặc gia hạn gói mới.");
        }

        // 4. Xác định gói Mentor và bản ghi Subscription (tuyệt đối không nhận amount từ client)
        MentorSubscription subscription;
        MentorPackage mentorPackage;

        if (request != null && request.getPackageId() != null) {
            mentorPackage = mentorPackageRepository.findById(request.getPackageId())
                    .orElseThrow(() -> new BadRequestException("Gói dịch vụ không tồn tại hoặc đã ngưng hoạt động."));

            if (mentorPackage.getStatus() != MentorPackageStatus.ACTIVE) {
                throw new BadRequestException("Gói dịch vụ không tồn tại hoặc đã ngưng hoạt động.");
            }

            // Tìm hoặc tạo subscription ở trạng thái PENDING_PAYMENT
            Optional<MentorSubscription> pendingSubOpt = mentorSubscriptionRepository
                    .findFirstByMentorProfileIdAndStatusOrderByCreatedAtDesc(profile.getId(), MentorSubscriptionStatus.PENDING_PAYMENT);

            if (pendingSubOpt.isPresent()) {
                subscription = pendingSubOpt.get();
                subscription.setMentorPackage(mentorPackage);
                subscription.setPriceAtPurchase(mentorPackage.getPrice());
                subscription.setDurationMonths(mentorPackage.getDurationMonths());
            } else {
                subscription = MentorSubscription.builder()
                        .mentorProfile(profile)
                        .mentorPackage(mentorPackage)
                        .priceAtPurchase(mentorPackage.getPrice())
                        .durationMonths(mentorPackage.getDurationMonths())
                        .status(MentorSubscriptionStatus.PENDING_PAYMENT)
                        .build();
            }
            subscription = mentorSubscriptionRepository.save(subscription);
        } else {
            // Lấy gói đang chờ thanh toán gần nhất
            subscription = mentorSubscriptionRepository
                    .findFirstByMentorProfileIdAndStatusOrderByCreatedAtDesc(profile.getId(), MentorSubscriptionStatus.PENDING_PAYMENT)
                    .orElseThrow(() -> new BadRequestException("Chưa có gói dịch vụ nào được chọn để thanh toán. Vui lòng chọn gói trước (UC92)."));

            mentorPackage = subscription.getMentorPackage();
            if (mentorPackage == null || mentorPackage.getStatus() != MentorPackageStatus.ACTIVE) {
                throw new BadRequestException("Gói dịch vụ không tồn tại hoặc đã ngưng hoạt động.");
            }
        }

        // 5. Giá thanh toán lấy trực tiếp từ database
        BigDecimal amount = subscription.getPriceAtPurchase();

        // 6. Kiểm tra giao dịch PENDING còn hiệu lực để tái sử dụng, tránh tạo đơn rác dồn dập
        Optional<PaymentTransaction> existingTxOpt = paymentTransactionRepository
                .findFirstByMentorSubscriptionIdOrderByCreatedAtDesc(subscription.getId());

        Instant now = Instant.now();
        if (existingTxOpt.isPresent()) {
            PaymentTransaction existingTx = existingTxOpt.get();
            if (existingTx.getPaymentStatus() == PaymentStatus.PENDING 
                    && existingTx.getPaymentExpiresAt().isAfter(now)
                    && existingTx.getAmount().compareTo(amount) == 0) {
                log.info("Tái sử dụng giao dịch PENDING hiện tại orderCode={} cho subscriptionId={}", 
                        existingTx.getOrderCode(), subscription.getId());
                return MentorPaymentCheckoutResponse.builder()
                        .transactionId(existingTx.getId())
                        .orderCode(existingTx.getOrderCode())
                        .amount(existingTx.getAmount())
                        .packageId(mentorPackage.getId())
                        .packageName(mentorPackage.getName())
                        .durationMonths(mentorPackage.getDurationMonths())
                        .description(existingTx.getDescription())
                        .qrCodeUrl(existingTx.getQrCodeUrl())
                        .checkoutUrl(existingTx.getCheckoutUrl())
                        .paymentStatus(existingTx.getPaymentStatus())
                        .paymentExpiresAt(existingTx.getPaymentExpiresAt())
                        .accountNumber(existingTx.getAccountNumber())
                        .accountName(existingTx.getAccountName())
                        .bin(existingTx.getBin())
                        .build();
            }
        }

        // 7. Sinh mã đơn hàng PayOS duy nhất (orderCode số nguyên dương 53-bit)
        long orderCode = (System.currentTimeMillis() % 100000000000L) + (long) (Math.random() * 900 + 100);
        Instant paymentExpiresAt = now.plus(Duration.ofMinutes(expirationMinutes));

        // Mô tả chuyển khoản PayOS tối đa 25 ký tự không dấu/kèm mã đơn
        String description = "ALUMNECT " + (orderCode % 1000000);

        // 8. Gọi PayOS SDK 2.0.1 tạo Payment Link
        CreatePaymentLinkRequest payOSRequest = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(amount.longValue())
                .description(description)
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .expiredAt(paymentExpiresAt.getEpochSecond())
                .items(List.of(PaymentLinkItem.builder()
                        .name(mentorPackage.getName())
                        .quantity(1)
                        .price(amount.longValue())
                        .build()))
                .build();

        CreatePaymentLinkResponse payOSResponse = payOSGateway.createPaymentLink(payOSRequest);

        // Lấy nội dung chuyển khoản thực tế từ PayOS (đã bao gồm tiền tố ACB/PayOS nếu có)
        String actualDescription = (payOSResponse.getDescription() != null && !payOSResponse.getDescription().isBlank())
                ? payOSResponse.getDescription()
                : description;

        // 9. Lưu bản ghi PaymentTransaction mới ở trạng thái PENDING
        PaymentTransaction transaction = PaymentTransaction.builder()
                .user(user)
                .mentorSubscription(subscription)
                .orderCode(orderCode)
                .amount(amount)
                .transactionType(TransactionType.MENTOR_SUBSCRIPTION)
                .paymentStatus(PaymentStatus.PENDING)
                .paymentMethod("PAYOS")
                .paymentReference(payOSResponse.getPaymentLinkId())
                .description(actualDescription)
                .qrCodeUrl(payOSResponse.getQrCode())
                .checkoutUrl(payOSResponse.getCheckoutUrl())
                .paymentExpiresAt(paymentExpiresAt)
                .accountNumber(payOSResponse.getAccountNumber())
                .accountName(payOSResponse.getAccountName())
                .bin(payOSResponse.getBin())
                .build();

        PaymentTransaction savedTx = paymentTransactionRepository.save(transaction);
        log.info("Khởi tạo thành công giao dịch PayOS id={}, orderCode={} cho mentorProfileId={}", 
                savedTx.getId(), orderCode, profile.getId());

        return MentorPaymentCheckoutResponse.builder()
                .transactionId(savedTx.getId())
                .orderCode(savedTx.getOrderCode())
                .amount(savedTx.getAmount())
                .packageId(mentorPackage.getId())
                .packageName(mentorPackage.getName())
                .durationMonths(mentorPackage.getDurationMonths())
                .description(savedTx.getDescription())
                .qrCodeUrl(savedTx.getQrCodeUrl())
                .checkoutUrl(savedTx.getCheckoutUrl())
                .paymentStatus(savedTx.getPaymentStatus())
                .paymentExpiresAt(savedTx.getPaymentExpiresAt())
                .accountNumber(payOSResponse.getAccountNumber())
                .accountName(payOSResponse.getAccountName())
                .bin(payOSResponse.getBin())
                .build();
    }

    /**
     * Tra cứu trạng thái giao dịch thanh toán theo orderCode phục vụ Polling từ Frontend.
     *
     * @param userEmail Email người dùng đăng nhập
     * @param orderCode Mã đơn hàng PayOS
     * @return DTO trạng thái thanh toán và Mentor Status mới nhất
     */
    @Override
    @Transactional
    public PaymentTransactionStatusResponse getPaymentStatus(String userEmail, Long orderCode) {
        log.debug("Tra cứu trạng thái giao dịch orderCode={} của user={}", orderCode, userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại."));

        PaymentTransaction tx = paymentTransactionRepository.findByOrderCodeAndUserId(orderCode, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch không tồn tại hoặc bạn không có quyền truy cập."));

        MentorSubscription sub = tx.getMentorSubscription();

        // 1. Trường hợp giao dịch đã là PAID nhưng Subscription chưa ACTIVE (do cập nhật DB hoặc lỗi bất đồng bộ)
        if (tx.getPaymentStatus() == PaymentStatus.PAID && (sub == null || sub.getStatus() != MentorSubscriptionStatus.ACTIVE)) {
            activatePaidSubscription(tx, tx.getPaidAt() != null ? tx.getPaidAt() : Instant.now(), tx.getPaymentReference());
        }
        // 2. Nếu giao dịch vẫn đang PENDING
        else if (tx.getPaymentStatus() == PaymentStatus.PENDING) {
            // Kiểm tra hết hạn thời gian
            if (tx.getPaymentExpiresAt().isBefore(Instant.now())) {
                tx.setPaymentStatus(PaymentStatus.EXPIRED);
                paymentTransactionRepository.save(tx);
                log.info("Giao dịch orderCode={} đã hết hạn thanh toán.", orderCode);
            } else {
                // Fallback Polling: Chủ động tra cứu trực tiếp từ PayOS phòng khi Webhook không gọi được về Localhost
                try {
                    PaymentLink paymentLink = payOSGateway.getPaymentLinkInformation(orderCode);
                    if (paymentLink != null && paymentLink.getStatus() != null) {
                        String payOsStatus = paymentLink.getStatus().toString();
                        if ("PAID".equalsIgnoreCase(payOsStatus)) {
                            log.info("Phát hiện orderCode={} đã PAID từ PayOS qua Polling fallback!", orderCode);
                            activatePaidSubscription(tx, Instant.now(), paymentLink.getId());
                        } else if ("CANCELLED".equalsIgnoreCase(payOsStatus)) {
                            tx.setPaymentStatus(PaymentStatus.CANCELLED);
                            paymentTransactionRepository.save(tx);
                        } else if ("EXPIRED".equalsIgnoreCase(payOsStatus)) {
                            tx.setPaymentStatus(PaymentStatus.EXPIRED);
                            paymentTransactionRepository.save(tx);
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Không thể kiểm tra trạng thái từ PayOS Gateway cho orderCode={}: {}", orderCode, ex.getMessage());
                }
            }
        }

        // Tải lại reference mới nhất của Subscription sau khi cập nhật
        sub = tx.getMentorSubscription();
        MentorProfile profile = sub != null ? sub.getMentorProfile() : null;

        boolean isTerminal = tx.getPaymentStatus() == PaymentStatus.PAID
                || tx.getPaymentStatus() == PaymentStatus.FAILED
                || tx.getPaymentStatus() == PaymentStatus.EXPIRED
                || tx.getPaymentStatus() == PaymentStatus.CANCELLED;

        return PaymentTransactionStatusResponse.builder()
                .transactionId(tx.getId())
                .orderCode(tx.getOrderCode())
                .amount(tx.getAmount())
                .paymentStatus(tx.getPaymentStatus())
                .paidAt(tx.getPaidAt())
                .paymentExpiresAt(tx.getPaymentExpiresAt())
                .subscriptionStatus(sub != null ? sub.getStatus() : null)
                .mentorStatus(profile != null ? profile.getMentorStatus() : null)
                .subscriptionStartDate(sub != null ? sub.getStartDate() : null)
                .subscriptionEndDate(sub != null ? sub.getEndDate() : null)
                .isTerminal(isTerminal)
                .build();
    }

    /**
     * Hủy đơn thanh toán PayOS đang ở trạng thái PENDING.
     *
     * @param userEmail Email người dùng đăng nhập
     * @param orderCode Mã đơn hàng PayOS
     * @return DTO trạng thái sau khi hủy
     */
    @Override
    @Transactional
    public PaymentTransactionStatusResponse cancelPayment(String userEmail, Long orderCode) {
        log.info("Yêu cầu hủy giao dịch orderCode={} của user={}", orderCode, userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại."));

        PaymentTransaction tx = paymentTransactionRepository.findByOrderCodeAndUserId(orderCode, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Giao dịch không tồn tại hoặc bạn không có quyền truy cập."));

        if (tx.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể hủy giao dịch đang ở trạng thái chờ thanh toán (PENDING).");
        }

        // Gọi PayOS SDK hủy link thanh toán
        try {
            payOSGateway.cancelPaymentLink(orderCode, "Người dùng chủ động hủy đơn");
        } catch (Exception ex) {
            log.warn("Không thể hủy link trên PayOS server (có thể đơn đã đóng hoặc offline): {}", ex.getMessage());
        }

        tx.setPaymentStatus(PaymentStatus.CANCELLED);
        paymentTransactionRepository.save(tx);

        return getPaymentStatus(userEmail, orderCode);
    }

    /**
     * Xử lý Webhook IPN từ PayOS (Source of Truth kích hoạt gói Mentor).
     *
     * @param webhook Đối tượng Webhook chứa payload và chữ ký HMAC-SHA256
     */
    @Override
    @Transactional
    public void handlePayOSWebhook(Webhook webhook) {
        log.info("Tiếp nhận Webhook IPN từ PayOS Gateway");

        // 1. Xác thực chữ ký số HMAC-SHA256 thông qua PayOS SDK 2.0.1
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
        log.info("Webhook PayOS hợp lệ cho orderCode={}, code={}, amount={}", orderCode, data.getCode(), data.getAmount());

        // 2. Khóa bi quan bản ghi giao dịch (Pessimistic Write Lock) chống race condition
        PaymentTransaction tx = paymentTransactionRepository.findForUpdateByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch với orderCode: " + orderCode));

        // 3. Đảm bảo giao dịch thuộc loại MENTOR_SUBSCRIPTION
        if (tx.getTransactionType() != TransactionType.MENTOR_SUBSCRIPTION) {
            log.warn("Bỏ qua xử lý Webhook cho loại giao dịch không phải MENTOR_SUBSCRIPTION: {}", tx.getTransactionType());
            return;
        }

        // 4. IDEMPOTENCY GUARD: Nếu giao dịch đã PAID, không xử lý lại, trả về ngay
        if (tx.getPaymentStatus() == PaymentStatus.PAID) {
            log.info("Giao dịch orderCode={} đã được xử lý PAID trước đó. Bỏ qua để đảm bảo tính Idempotency.", orderCode);
            return;
        }

        // 5. Đối soát số tiền thanh toán (amount validation)
        if (data.getAmount() != null && tx.getAmount().longValue() != data.getAmount()) {
            log.error("Số tiền thanh toán Webhook không khớp: DB={}, Webhook={}", tx.getAmount(), data.getAmount());
            throw new BadRequestException("Số tiền thanh toán không khớp với hóa đơn hệ thống.");
        }

        // 6. Xử lý kết quả giao dịch
        if ("00".equals(data.getCode())) {
            activatePaidSubscription(tx, Instant.now(), data.getReference());
        } else {
            // Giao dịch không thành công
            tx.setPaymentStatus(PaymentStatus.FAILED);
            paymentTransactionRepository.save(tx);
            log.warn("Giao dịch orderCode={} bị Payment Gateway báo thất bại với mã: {}", orderCode, data.getCode());
        }
    }

    /**
     * Kích hoạt hoặc gia hạn Mentor Subscription khi giao dịch đã thanh toán thành công (PAID).
     * Dùng chung cho cả luồng Webhook và luồng Polling fallback.
     */
    private void activatePaidSubscription(PaymentTransaction tx, Instant paidTime, String reference) {
        if (paidTime == null) {
            paidTime = Instant.now();
        }
        tx.setPaymentStatus(PaymentStatus.PAID);
        tx.setPaidAt(paidTime);
        if (reference != null && !reference.isEmpty()) {
            tx.setPaymentReference(reference);
        }
        paymentTransactionRepository.save(tx);
        log.info("Giao dịch orderCode={} đã chuyển sang PAID thành công lúc {}", tx.getOrderCode(), tx.getPaidAt());

        MentorSubscription subscription = tx.getMentorSubscription();
        if (subscription == null) {
            log.warn("Không tìm thấy MentorSubscription liên kết với giao dịch orderCode={}", tx.getOrderCode());
            return;
        }

        // Nếu gói đã ở trạng thái ACTIVE và end_date còn hiệu lực sau paidTime, tránh cộng lặp ngày
        if (subscription.getStatus() == MentorSubscriptionStatus.ACTIVE && subscription.getEndDate() != null && subscription.getEndDate().isAfter(paidTime)) {
            log.info("Subscription id={} đã ACTIVE và có hiệu lực đến {}. Bỏ qua cập nhật lặp lại.", subscription.getId(), subscription.getEndDate());
            return;
        }

        Integer durationMonths = subscription.getDurationMonths() != null ? subscription.getDurationMonths() : 1;
        Instant newEndDate;

        // Kiểm tra xem subscription hiện tại có còn hiệu lực không (Gia hạn nối tiếp)
        if (subscription.getEndDate() != null && subscription.getEndDate().isAfter(paidTime)) {
            newEndDate = subscription.getEndDate().atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                    .plusMonths(durationMonths)
                    .toInstant();
            log.info("Gia hạn gói subscriptionId={}: bảo toàn ngày cũ, hạn mới={}", subscription.getId(), newEndDate);
        } else {
            subscription.setStartDate(paidTime);
            newEndDate = paidTime.atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                    .plusMonths(durationMonths)
                    .toInstant();
            log.info("Kích hoạt mới gói subscriptionId={}: startDate={}, endDate={}", subscription.getId(), paidTime, newEndDate);
        }

        subscription.setEndDate(newEndDate);
        subscription.setStatus(MentorSubscriptionStatus.ACTIVE);
        mentorSubscriptionRepository.save(subscription);

        // Tính toán lại Mentor Status qua MentorEligibilityService dùng chung
        MentorStatus newMentorStatus = mentorEligibilityService.recalculateMentorStatus(subscription.getMentorProfile().getId());
        log.info("Trạng thái Mentor sau thanh toán thành công cho profileId={}: {}", 
                subscription.getMentorProfile().getId(), newMentorStatus);
    }
}
