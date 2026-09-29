package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.config.MentoringProperties;
import com.alumnect.alumnect_backend.dao.mentorship.UserTermsAcceptanceRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsAcceptResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.UserTermsAcceptance;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

/**
 * Lớp triển khai dịch vụ nghiệp vụ (Service Implementation) cho Mentoring Terms (UC90).
 * Quản lý kiểm tra và ghi nhận chấp nhận Điều khoản Hướng dẫn & Hỗ trợ.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringTermsServiceImpl implements MentoringTermsService {

    private final UserRepository userRepository;
    private final UserTermsAcceptanceRepository userTermsAcceptanceRepository;
    private final MentoringProperties mentoringProperties;

    /**
     * Lấy trạng thái chấp nhận Điều khoản Hướng dẫn & Hỗ trợ hiện tại của người dùng.
     * Logic: Tra cứu người dùng từ email xác thực, lấy phiên bản điều khoản hiện tại từ cấu hình,
     * và kiểm tra sự tồn tại của bản ghi chấp nhận trong bảng user_terms_acceptances.
     *
     * @param userEmail Email của người dùng đăng nhập
     * @return DTO chứa trạng thái chấp nhận điều khoản
     */
    @Override
    @Transactional(readOnly = true)
    public MentoringTermsStatusResponse getCurrentTermsStatus(String userEmail) {
        User user = findUserByEmail(userEmail);
        String currentVersion = mentoringProperties.getVersion();

        Optional<UserTermsAcceptance> acceptanceOpt = userTermsAcceptanceRepository
                .findByUserIdAndTermsVersion(user.getId(), currentVersion);

        boolean accepted = acceptanceOpt.isPresent();
        Instant acceptedAt = acceptanceOpt.map(UserTermsAcceptance::getAcceptedAt).orElse(null);

        log.debug("Kiểm tra điều khoản mentoring cho user {}: version={}, accepted={}", user.getId(), currentVersion, accepted);

        return MentoringTermsStatusResponse.builder()
                .currentVersion(currentVersion)
                .accepted(accepted)
                .acceptedAt(acceptedAt)
                .build();
    }

    /**
     * Ghi nhận người dùng chấp nhận Điều khoản Hướng dẫn & Hỗ trợ cho phiên bản hiện tại.
     * Logic idempotent:
     * 1. Kiểm tra nếu đã có bản ghi chấp nhận phiên bản hiện tại thì trả về thành công ngay lập tức.
     * 2. Nếu chưa có, tạo bản ghi mới và lưu vào cơ sở dữ liệu.
     * 3. Xử lý ngoại lệ tranh chấp đồng thời (DataIntegrityViolationException) nếu có nhiều request gọi cùng lúc.
     *
     * @param userEmail Email của người dùng đăng nhập
     * @return DTO kết quả chấp nhận điều khoản
     */
    @Override
    @Transactional
    public MentoringTermsAcceptResponse acceptCurrentTerms(String userEmail) {
        User user = findUserByEmail(userEmail);
        String currentVersion = mentoringProperties.getVersion();

        // Kiểm tra xem đã chấp nhận trước đó chưa (idempotent check)
        Optional<UserTermsAcceptance> existingOpt = userTermsAcceptanceRepository
                .findByUserIdAndTermsVersion(user.getId(), currentVersion);

        if (existingOpt.isPresent()) {
            UserTermsAcceptance existing = existingOpt.get();
            log.info("Người dùng {} đã chấp nhận điều khoản version {} trước đó tại {}", user.getId(), currentVersion, existing.getAcceptedAt());
            return MentoringTermsAcceptResponse.builder()
                    .acceptedVersion(currentVersion)
                    .accepted(true)
                    .acceptedAt(existing.getAcceptedAt())
                    .build();
        }

        // Tạo bản ghi chấp nhận mới
        UserTermsAcceptance newAcceptance = UserTermsAcceptance.builder()
                .user(user)
                .termsVersion(currentVersion)
                .acceptedAt(Instant.now())
                .build();

        UserTermsAcceptance saved;
        try {
            saved = userTermsAcceptanceRepository.save(newAcceptance);
            log.info("Lưu thành công chấp nhận điều khoản mentoring cho user {}: version={}", user.getId(), currentVersion);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Phát hiện chấp nhận điều khoản trùng lặp do gọi đồng thời cho user {}: {}", user.getId(), ex.getMessage());
            saved = userTermsAcceptanceRepository
                    .findByUserIdAndTermsVersion(user.getId(), currentVersion)
                    .orElse(newAcceptance);
        }

        return MentoringTermsAcceptResponse.builder()
                .acceptedVersion(currentVersion)
                .accepted(true)
                .acceptedAt(saved.getAcceptedAt())
                .build();
    }

    /**
     * Phương thức tiện ích tìm kiếm người dùng theo email.
     *
     * @param email Địa chỉ email của người dùng
     * @return Đối tượng User tương ứng
     * @throws ResourceNotFoundException nếu không tìm thấy người dùng
     */
    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + email));
    }
}
