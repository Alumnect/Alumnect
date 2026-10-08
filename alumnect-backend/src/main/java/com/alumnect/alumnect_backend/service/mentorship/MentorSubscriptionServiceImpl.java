package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorPackageStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.PaymentStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPackageRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.payment.PaymentTransactionRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.SelectMentorPackageRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorPackageResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorSubscriptionResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPackage;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.payment.PaymentTransaction;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentorPackageMapper;
import com.alumnect.alumnect_backend.mapper.mentorship.MentorSubscriptionMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Lớp dịch vụ thực thi nghiệp vụ Xem & Chọn gói Mentor (UC92).
 * Đảm bảo kiểm tra phân quyền, trạng thái hoàn thiện hồ sơ, snapshot giá tại thời điểm chọn gói,
 * và chuẩn bị thông tin chờ thanh toán cho UC93.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentorSubscriptionServiceImpl implements MentorSubscriptionService {

    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorPackageRepository mentorPackageRepository;
    private final MentorSubscriptionRepository mentorSubscriptionRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final MentoringTermsService mentoringTermsService;
    private final MentorPackageMapper mentorPackageMapper;
    private final MentorSubscriptionMapper mentorSubscriptionMapper;

    /**
     * Lấy danh sách các gói dịch vụ Mentor đang hoạt động (ACTIVE).
     *
     * @return Danh sách DTO gói Mentor
     */
    @Override
    @Transactional(readOnly = true)
    public List<MentorPackageResponse> getActivePackages() {
        log.info("Lấy danh sách các gói Mentor active từ hệ thống");
        List<MentorPackage> activePackages = mentorPackageRepository
                .findByStatusOrderByDurationMonthsAsc(MentorPackageStatus.ACTIVE);
        return mentorPackageMapper.toResponseList(activePackages);
    }

    /**
     * Lựa chọn một gói Mentor cho người dùng và tạo bản ghi chờ thanh toán (UC92).
     *
     * @param userEmail Email của người dùng đăng nhập
     * @param request DTO chứa ID gói dịch vụ
     * @return DTO thông tin đăng ký gói chờ thanh toán
     */
    @Override
    @Transactional
    public MentorSubscriptionResponse selectPackage(String userEmail, SelectMentorPackageRequest request) {
        log.info("Người dùng email={} yêu cầu chọn gói Mentor packageId={}", userEmail, request.getPackageId());

        // 1. Kiểm tra sự tồn tại và vai trò người dùng (phải là ALUMNI)
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại."));

        if (user.getRole() == null || !"ALUMNI".equalsIgnoreCase(user.getRole().getName())) {
            throw new ForbiddenException("Chức năng chọn gói Mentor chỉ dành riêng cho Cựu sinh viên.");
        }

        // 2. Kiểm tra việc chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (UC90)
        MentoringTermsStatusResponse termsStatus = mentoringTermsService.getCurrentTermsStatus(userEmail);
        if (!termsStatus.isAccepted()) {
            throw new ForbiddenException("Bạn phải chấp nhận Điều khoản Hướng dẫn & Hỗ trợ trước khi chọn gói Mentor.");
        }

        // 3. Kiểm tra hồ sơ Mentor (phải tồn tại và không được ở trạng thái INCOMPLETE)
        MentorProfile profile = mentorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Bạn cần hoàn thiện thông tin hồ sơ Mentor trước khi chọn gói dịch vụ."));

        if (profile.getMentorStatus() == MentorStatus.INCOMPLETE) {
            throw new BadRequestException("Bạn cần hoàn thiện thông tin hồ sơ Mentor trước khi chọn gói dịch vụ.");
        }

        // 3.1. Kiểm tra nếu Mentor đã có gói đang ACTIVE và chưa hết hạn thì KHÔNG cho phép mua gói mới
        List<MentorSubscription> activeSubs = mentorSubscriptionRepository
                .findByMentorProfileIdOrderByCreatedAtDesc(profile.getId());
        Instant now = Instant.now();
        Optional<MentorSubscription> currentActiveSubOpt = activeSubs.stream()
                .filter(s -> (s.getStatus() == MentorSubscriptionStatus.ACTIVE || s.getStatus() == MentorSubscriptionStatus.PAID)
                        && s.getEndDate() != null && s.getEndDate().isAfter(now))
                .findFirst();

        if (currentActiveSubOpt.isPresent()) {
            MentorSubscription currentSub = currentActiveSubOpt.get();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy").withZone(ZoneId.of("Asia/Ho_Chi_Minh"));
            String expDateStr = formatter.format(currentSub.getEndDate());
            throw new BadRequestException("Bạn đang có gói Mentor (" + currentSub.getMentorPackage().getName() 
                    + ") đang hoạt động đến ngày " + expDateStr + ". Vui lòng chờ hết hạn gói hiện tại trước khi đăng ký hoặc gia hạn gói mới.");
        }

        // 4. Kiểm tra gói dịch vụ được chọn (phải tồn tại và đang ở trạng thái ACTIVE)
        MentorPackage mentorPackage = mentorPackageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new BadRequestException("Gói dịch vụ không tồn tại hoặc đã ngưng hoạt động."));

        if (mentorPackage.getStatus() != MentorPackageStatus.ACTIVE) {
            throw new BadRequestException("Gói dịch vụ không tồn tại hoặc đã ngưng hoạt động.");
        }

        // 5. Kiểm tra hoặc cập nhật bản ghi đăng ký đang chờ thanh toán (PENDING_PAYMENT)
        List<MentorSubscription> pendingSubs = mentorSubscriptionRepository
                .findByMentorProfileIdOrderByCreatedAtDesc(profile.getId())
                .stream()
                .filter(s -> s.getStatus() == MentorSubscriptionStatus.PENDING_PAYMENT)
                .toList();

        MentorSubscription subscription;
        if (!pendingSubs.isEmpty()) {
            subscription = pendingSubs.get(0);
            subscription.setMentorPackage(mentorPackage);
            subscription.setPriceAtPurchase(mentorPackage.getPrice());
            subscription.setDurationMonths(mentorPackage.getDurationMonths());
            log.info("Cập nhật lại thông tin chọn gói cho đăng ký id={} của mentorProfileId={}", subscription.getId(), profile.getId());

            // Dọn dẹp các bản ghi PENDING_PAYMENT dư thừa còn lại nếu có
            for (int i = 1; i < pendingSubs.size(); i++) {
                MentorSubscription extraSub = pendingSubs.get(i);
                extraSub.setStatus(MentorSubscriptionStatus.CANCELLED);
                mentorSubscriptionRepository.save(extraSub);
                log.info("Dọn dẹp bản ghi PENDING_PAYMENT dư thừa id={}", extraSub.getId());
            }
        } else {
            subscription = MentorSubscription.builder()
                    .mentorProfile(profile)
                    .mentorPackage(mentorPackage)
                    .priceAtPurchase(mentorPackage.getPrice())
                    .durationMonths(mentorPackage.getDurationMonths())
                    .status(MentorSubscriptionStatus.PENDING_PAYMENT)
                    .build();
            log.info("Tạo mới bản ghi đăng ký gói Mentor cho mentorProfileId={}", profile.getId());
        }

        // 6. Cập nhật trạng thái hồ sơ Mentor sang PAYMENT_PENDING nếu đang ở trạng thái khác ACTIVE
        if (profile.getMentorStatus() != MentorStatus.ACTIVE) {
            profile.setMentorStatus(MentorStatus.PAYMENT_PENDING);
            mentorProfileRepository.save(profile);
        }

        MentorSubscription savedSubscription = mentorSubscriptionRepository.save(subscription);
        return mentorSubscriptionMapper.toResponse(savedSubscription);
    }

    /**
     * Lấy thông tin đăng ký gói Mentor hiện tại của người dùng.
     * Ưu tiên gói đang ACTIVE còn hiệu lực, sau đó đến PENDING_PAYMENT.
     *
     * @param userEmail Email người dùng đăng nhập
     * @return DTO thông tin đăng ký gói Mentor
     */
    @Override
    @Transactional
    public MentorSubscriptionResponse getMySubscription(String userEmail) {
        log.info("Lấy thông tin đăng ký gói Mentor của người dùng email={}", userEmail);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại."));

        MentorProfile profile = mentorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Hồ sơ Mentor không tồn tại."));

        List<MentorSubscription> subscriptions = mentorSubscriptionRepository
                .findByMentorProfileIdOrderByCreatedAtDesc(profile.getId());
        if (subscriptions.isEmpty()) {
            throw new ResourceNotFoundException("Bạn chưa chọn gói dịch vụ Mentor nào.");
        }

        Instant now = Instant.now();
        // 1. Ưu tiên cao nhất: Gói đang ACTIVE hoặc PAID và chưa hết hạn
        MentorSubscription subscription = subscriptions.stream()
                .filter(s -> (s.getStatus() == MentorSubscriptionStatus.ACTIVE || s.getStatus() == MentorSubscriptionStatus.PAID)
                        && s.getEndDate() != null && s.getEndDate().isAfter(now))
                .findFirst()
                // 2. Kế tiếp: Gói đang chờ thanh toán PENDING_PAYMENT (tự đồng bộ nếu giao dịch đã CANCELLED)
                .orElseGet(() -> {
                    for (MentorSubscription sub : subscriptions) {
                        if (sub.getStatus() == MentorSubscriptionStatus.PENDING_PAYMENT) {
                            Optional<PaymentTransaction> lastTxOpt = paymentTransactionRepository
                                    .findFirstByMentorSubscriptionIdOrderByCreatedAtDesc(sub.getId());
                            if (lastTxOpt.isPresent() && lastTxOpt.get().getPaymentStatus() == PaymentStatus.CANCELLED) {
                                log.info("Phát hiện subscriptionId={} PENDING_PAYMENT có giao dịch gần nhất CANCELLED. Tự động đồng bộ CANCELLED.", sub.getId());
                                sub.setStatus(MentorSubscriptionStatus.CANCELLED);
                                mentorSubscriptionRepository.save(sub);
                                continue;
                            }
                            return sub;
                        }
                    }
                    // 3. Fallback: Bản ghi gần nhất chưa bị HỦY (loại trừ gói CANCELLED)
                    return subscriptions.stream()
                            .filter(s -> s.getStatus() != MentorSubscriptionStatus.CANCELLED)
                            .findFirst()
                            .orElse(null);
                });

        if (subscription == null) {
            throw new ResourceNotFoundException("Bạn chưa chọn gói dịch vụ Mentor nào.");
        }

        return mentorSubscriptionMapper.toResponse(subscription);
    }
}
