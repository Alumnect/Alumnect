package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPayoutAccountRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.payment.PaymentTransactionRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRegistrationResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorStatusResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPayoutAccount;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.payment.PaymentTransaction;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Lớp dịch vụ thực thi nghiệp vụ Xem trạng thái Mentor & Subscription (UC94).
 * Đảm nhiệm việc tổng hợp thông tin đa nguồn (Hồ sơ, Điều khoản, CV, Tài khoản ngân hàng, Gói dịch vụ)
 * và tính toán trạng thái hoạt động của Mentor theo đúng quy tắc nghiệp vụ hệ thống.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentorStatusServiceImpl implements MentorStatusService {

    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorPayoutAccountRepository mentorPayoutAccountRepository;
    private final MentorSubscriptionRepository mentorSubscriptionRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final MentoringTermsService mentoringTermsService;
    private final MentorRegistrationService mentorRegistrationService;
    private final MentorEligibilityService mentorEligibilityService;

    /**
     * Lấy và tổng hợp toàn bộ trạng thái hồ sơ Mentor, điều khoản và gói dịch vụ của người dùng.
     *
     * @param userEmail Email của người dùng đã xác thực từ JWT Bearer Token
     * @return DTO tổng hợp chi tiết trạng thái MentorStatusResponse
     */
    @Override
    @Transactional
    public MentorStatusResponse getMentorStatus(String userEmail) {
        log.info("Bắt đầu truy vấn và tổng hợp trạng thái Mentor cho email: {}", userEmail);

        // 1. Xác thực người dùng và kiểm tra bắt buộc vai trò ALUMNI
        User user = validateAndGetAlumniUser(userEmail);

        // 2. Kiểm tra trạng thái chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (UC90)
        MentoringTermsStatusResponse termsStatus = mentoringTermsService.getCurrentTermsStatus(userEmail);
        boolean termsAccepted = termsStatus != null && termsStatus.isAccepted();
        String currentTermsVersion = termsStatus != null ? termsStatus.getCurrentVersion() : "1.0";
        Instant termsAcceptedAt = termsStatus != null ? termsStatus.getAcceptedAt() : null;

        // 3. Truy xuất hồ sơ Mentor (nếu đã từng lưu nháp hoặc tạo tại UC91)
        Optional<MentorProfile> profileOpt = mentorProfileRepository.findByUserId(user.getId());
        boolean hasMentorProfile = profileOpt.isPresent();
        MentorProfile profile = profileOpt.orElse(null);

        // 4. Kiểm tra CV và thông tin ngân hàng thụ hưởng (Payout Account)
        boolean hasCv = false;
        String cvFileName = null;
        boolean bankInformationComplete = false;
        String bankName = null;
        String maskedAccountNumber = null;
        String bankAccountHolder = null;

        boolean profileComplete = false;
        List<String> missingProfileFields = Collections.emptyList();

        if (hasMentorProfile && profile != null) {
            // CV status
            if (profile.getCvFileKey() != null && !profile.getCvFileKey().trim().isEmpty()) {
                hasCv = true;
                cvFileName = extractCvFileName(profile.getCvFileKey());
            }

            // Payout Account status
            Optional<MentorPayoutAccount> payoutOpt = mentorPayoutAccountRepository.findByMentorProfileId(profile.getId());
            if (payoutOpt.isPresent()) {
                MentorPayoutAccount payout = payoutOpt.get();
                bankName = payout.getBankName();
                bankAccountHolder = payout.getBankAccountHolder();
                maskedAccountNumber = maskAccountNumber(payout.getBankAccountNumber());
                bankInformationComplete = isPayoutAccountComplete(payout);
            }

            // Tính hoàn thiện của hồ sơ nghề nghiệp & cố vấn
            MentorRegistrationResponse regResponse = mentorRegistrationService.getRegistration(userEmail);
            if (regResponse != null) {
                profileComplete = regResponse.isComplete();
                missingProfileFields = regResponse.getMissingFields() != null
                        ? regResponse.getMissingFields()
                        : Collections.emptyList();
            }
        } else {
            missingProfileFields = List.of("profile", "cvFileKey", "payoutAccount");
        }

        // 5. Truy vấn danh sách và xác định gói Subscription hiện tại (UC92 & UC93)
        List<MentorSubscription> subscriptions = hasMentorProfile && profile != null
                ? mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(profile.getId())
                : Collections.emptyList();

        Instant now = Instant.now();

        // Tìm gói đang ACTIVE / PAID còn hiệu lực (endDate > now)
        Optional<MentorSubscription> activeSubOpt = subscriptions.stream()
                .filter(s -> (s.getStatus() == MentorSubscriptionStatus.ACTIVE || s.getStatus() == MentorSubscriptionStatus.PAID)
                        && s.getEndDate() != null && s.getEndDate().isAfter(now))
                .findFirst();

        // Tìm gói đang chờ thanh toán (PENDING_PAYMENT)
        Optional<MentorSubscription> pendingSubOpt = subscriptions.stream()
                .filter(s -> s.getStatus() == MentorSubscriptionStatus.PENDING_PAYMENT)
                .findFirst();

        // Tìm gói đã từng hoạt động nhưng nay đã hết hạn
        Optional<MentorSubscription> expiredSubOpt = subscriptions.stream()
                .filter(s -> (s.getStatus() == MentorSubscriptionStatus.ACTIVE || s.getStatus() == MentorSubscriptionStatus.PAID || s.getStatus() == MentorSubscriptionStatus.EXPIRED)
                        && s.getEndDate() != null && !s.getEndDate().isAfter(now))
                .findFirst();

        // Lựa chọn gói đại diện hiển thị cho người dùng
        MentorSubscription currentSub = activeSubOpt.orElseGet(() ->
                pendingSubOpt.orElseGet(() ->
                        expiredSubOpt.orElseGet(() ->
                                subscriptions.isEmpty() ? null : subscriptions.get(0)
                        )
                )
        );

        // 6. Kiểm tra giao dịch chờ thanh toán PayOS nếu gói đang ở trạng thái PENDING_PAYMENT
        Long pendingPaymentOrderCode = null;
        if (currentSub != null && currentSub.getStatus() == MentorSubscriptionStatus.PENDING_PAYMENT) {
            Optional<PaymentTransaction> pendingTxOpt = paymentTransactionRepository
                    .findFirstByMentorSubscriptionIdOrderByCreatedAtDesc(currentSub.getId());
            if (pendingTxOpt.isPresent()) {
                PaymentTransaction tx = pendingTxOpt.get();
                if (tx.getPaymentStatus() == PaymentStatus.PENDING && tx.getPaymentExpiresAt().isAfter(now)) {
                    pendingPaymentOrderCode = tx.getOrderCode();
                }
            }
        }

        // 7. Tính toán lại trạng thái Mentor (Single Source of Truth qua MentorEligibilityService)
        MentorStatus calculatedMentorStatus;
        if (hasMentorProfile && profile != null) {
            calculatedMentorStatus = mentorEligibilityService.recalculateMentorStatus(profile.getId());
        } else {
            calculatedMentorStatus = MentorStatus.INCOMPLETE;
        }

        // 8. Đánh giá chi tiết danh sách các yêu cầu còn thiếu (Missing Requirements)
        List<String> missingRequirements = new ArrayList<>();
        if (!termsAccepted) {
            missingRequirements.add("Chưa chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (UC90)");
        }
        if (!hasCv) {
            missingRequirements.add("Chưa tải lên hồ sơ CV ứng tuyển Mentor (UC91)");
        }
        if (!bankInformationComplete) {
            missingRequirements.add("Chưa cập nhật đầy đủ thông tin tài khoản ngân hàng nhận thù lao (UC91)");
        }
        if (!profileComplete) {
            missingRequirements.add("Chưa hoàn tất các thông tin hồ sơ nghề nghiệp & cố vấn bắt buộc (UC91)");
        }
        if (calculatedMentorStatus == MentorStatus.EXPIRED) {
            missingRequirements.add("Gói duy trì dịch vụ Mentor đã hết hạn, cần gia hạn để tiếp tục hoạt động (UC92/UC93)");
        } else if (calculatedMentorStatus == MentorStatus.PAYMENT_PENDING && activeSubOpt.isEmpty()) {
            if (pendingPaymentOrderCode != null) {
                missingRequirements.add("Đang có đơn thanh toán gói Mentor chờ xác nhận chuyển khoản (UC93)");
            } else {
                missingRequirements.add("Chưa hoàn tất thanh toán gói dịch vụ Mentor (UC92/UC93)");
            }
        }

        // 9. Xác định hành động tiếp theo (Next Action), URL điều hướng và thông điệp trạng thái
        String nextAction;
        String actionUrl;
        String statusMessage;

        switch (calculatedMentorStatus) {
            case ACTIVE -> {
                nextAction = "ACTIVE_DASHBOARD";
                actionUrl = "/app/mentoring";
                statusMessage = "Hồ sơ Mentor và gói duy trì dịch vụ của bạn đang hoạt động bình thường.";
            }
            case EXPIRED -> {
                nextAction = "RENEW_SUBSCRIPTION";
                actionUrl = "/app/mentoring/packages";
                statusMessage = "Gói dịch vụ Mentor của bạn đã hết hạn. Vui lòng gia hạn gói để tiếp tục nhận yêu cầu cố vấn mới.";
            }
            case PAYMENT_PENDING -> {
                if (pendingPaymentOrderCode != null) {
                    nextAction = "RESUME_PAYMENT";
                    actionUrl = "/app/mentoring/subscription?step=checkout";
                    statusMessage = "Hồ sơ của bạn đã hoàn tất. Đang có giao dịch chờ thanh toán qua PayOS.";
                } else if (currentSub != null) {
                    nextAction = "PAYMENT_CHECKOUT";
                    actionUrl = "/app/mentoring/subscription?step=checkout";
                    statusMessage = "Hồ sơ của bạn đã hoàn tất. Vui lòng hoàn tất thanh toán gói Mentor để kích hoạt trạng thái hoạt động.";
                } else {
                    nextAction = "SELECT_PACKAGE";
                    actionUrl = "/app/mentoring/packages";
                    statusMessage = "Hồ sơ của bạn đã hoàn tất. Vui lòng chọn và thanh toán gói Mentor để kích hoạt.";
                }
            }
            default -> { // INCOMPLETE
                if (!termsAccepted) {
                    nextAction = "ACCEPT_TERMS";
                    actionUrl = "/app/mentoring/terms";
                    statusMessage = "Bạn cần chấp nhận Điều khoản Hướng dẫn & Hỗ trợ trước khi tiếp tục.";
                } else {
                    nextAction = "COMPLETE_PROFILE";
                    actionUrl = "/app/mentoring/become-mentor";
                    statusMessage = "Hồ sơ Mentor của bạn chưa hoàn tất. Vui lòng bổ sung các thông tin còn thiếu.";
                }
            }
        }

        // 10. Tính toán số ngày còn lại của gói dịch vụ
        Long remainingDays = null;
        if (currentSub != null && currentSub.getEndDate() != null) {
            long days = Duration.between(now, currentSub.getEndDate()).toDays();
            remainingDays = Math.max(0L, days);
        }

        log.info("Tổng hợp thành công trạng thái Mentor cho email {}: status={}, active={}, remainingDays={}",
                userEmail, calculatedMentorStatus, calculatedMentorStatus == MentorStatus.ACTIVE, remainingDays);

        return MentorStatusResponse.builder()
                .mentorStatus(calculatedMentorStatus)
                .active(calculatedMentorStatus == MentorStatus.ACTIVE)
                .statusMessage(statusMessage)
                .hasMentorProfile(hasMentorProfile)
                .profileComplete(profileComplete)
                .missingProfileFields(missingProfileFields)
                .hasCv(hasCv)
                .cvFileName(cvFileName)
                .bankInformationComplete(bankInformationComplete)
                .bankName(bankName)
                .maskedAccountNumber(maskedAccountNumber)
                .bankAccountHolder(bankAccountHolder)
                .termsAccepted(termsAccepted)
                .currentTermsVersion(currentTermsVersion)
                .termsAcceptedAt(termsAcceptedAt)
                .hasSubscription(currentSub != null)
                .subscriptionId(currentSub != null ? currentSub.getId() : null)
                .subscriptionStatus(currentSub != null ? currentSub.getStatus() : null)
                .packageId(currentSub != null && currentSub.getMentorPackage() != null ? currentSub.getMentorPackage().getId() : null)
                .packageCode(currentSub != null && currentSub.getMentorPackage() != null ? currentSub.getMentorPackage().getCode() : null)
                .packageName(currentSub != null && currentSub.getMentorPackage() != null ? currentSub.getMentorPackage().getName() : null)
                .priceAtPurchase(currentSub != null ? currentSub.getPriceAtPurchase() : null)
                .durationMonths(currentSub != null ? currentSub.getDurationMonths() : null)
                .startDate(currentSub != null ? currentSub.getStartDate() : null)
                .endDate(currentSub != null ? currentSub.getEndDate() : null)
                .remainingDays(remainingDays)
                .pendingPaymentOrderCode(pendingPaymentOrderCode)
                .missingRequirements(missingRequirements)
                .nextAction(nextAction)
                .actionUrl(actionUrl)
                .build();
    }

    /**
     * Xác thực người dùng và kiểm tra bắt buộc vai trò ALUMNI.
     */
    private User validateAndGetAlumniUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + userEmail));

        if (user.getRole() == null || !"ALUMNI".equalsIgnoreCase(user.getRole().getName())) {
            log.warn("Người dùng {} có vai trò {} bị từ chối truy cập UC94", userEmail,
                    user.getRole() != null ? user.getRole().getName() : "NULL");
            throw new ForbiddenException("Chức năng chỉ dành cho Cựu sinh viên (ALUMNI)");
        }

        return user;
    }

    /**
     * Kiểm tra tính đầy đủ của thông tin tài khoản ngân hàng nhận chi trả.
     */
    private boolean isPayoutAccountComplete(MentorPayoutAccount payout) {
        return payout != null
                && payout.getBankName() != null && !payout.getBankName().trim().isEmpty()
                && payout.getBankAccountNumber() != null && !payout.getBankAccountNumber().trim().isEmpty()
                && payout.getBankAccountHolder() != null && !payout.getBankAccountHolder().trim().isEmpty();
    }

    /**
     * Làm mờ số tài khoản ngân hàng để bảo vệ dữ liệu cá nhân nhạy cảm (PII).
     * Ví dụ: "1234567890" -> "**** **** 7890"
     */
    private String maskAccountNumber(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) {
            return null;
        }
        String trimmed = accountNumber.trim();
        if (trimmed.length() <= 4) {
            return "****" + trimmed;
        }
        String last4 = trimmed.substring(trimmed.length() - 4);
        return "**** **** " + last4;
    }

    /**
     * Trích xuất tên tệp CV thân thiện từ khóa lưu trữ đám mây.
     */
    private String extractCvFileName(String cvFileKey) {
        if (cvFileKey == null || cvFileKey.isBlank()) {
            return null;
        }
        String normalized = cvFileKey.replace('\\', '/');
        int lastSlash = normalized.lastIndexOf('/');
        String fileName = (lastSlash >= 0) ? normalized.substring(lastSlash + 1) : normalized;

        // Bỏ tiền tố UUID nếu có (ví dụ: a1b2c3d4-e5f6_My_CV.pdf -> My_CV.pdf)
        if (fileName.contains("_")) {
            int firstUnderscore = fileName.indexOf('_');
            if (firstUnderscore > 0 && firstUnderscore < fileName.length() - 1) {
                return fileName.substring(firstUnderscore + 1);
            }
        }
        return fileName;
    }
}
