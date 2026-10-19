package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dao.mentorship.MentorPayoutAccountRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.UserRefundAccountRepository;
import com.alumnect.alumnect_backend.entity.mentorship.UserRefundAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Xác định tài khoản nhận hoàn tiền của một người dùng.
 * Ưu tiên tài khoản đã khai báo ở trang Hoàn tiền; nếu chưa có thì dùng tạm tài khoản nhận thù lao
 * mà người dùng đã nhập ở Hồ sơ Mentor (không ghi vào CSDL, chỉ đọc).
 */
@Component
@RequiredArgsConstructor
public class RefundAccountResolver {

    private final UserRefundAccountRepository refundAccountRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorPayoutAccountRepository payoutAccountRepository;

    public Optional<UserRefundAccount> find(Long userId) {
        Optional<UserRefundAccount> declared = refundAccountRepository.findByUserId(userId);
        if (declared.isPresent()) {
            return declared;
        }
        return mentorProfileRepository.findByUserId(userId)
                .flatMap(profile -> payoutAccountRepository.findByMentorProfileId(profile.getId()))
                .filter(a -> hasText(a.getBankName()) && hasText(a.getBankBin()) && a.getBankBin().matches("\\d{6}")
                        && hasText(a.getBankAccountNumber()) && hasText(a.getBankAccountHolder()))
                .map(a -> UserRefundAccount.builder()
                        .bankName(a.getBankName())
                        .bankBin(a.getBankBin())
                        .bankAccountNumber(a.getBankAccountNumber())
                        .bankAccountHolder(a.getBankAccountHolder())
                        .updatedAt(a.getUpdatedAt())
                        .build());
    }

    public boolean exists(Long userId) {
        return find(userId).isPresent();
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}
