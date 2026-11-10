package com.alumnect.alumnect_backend.service.verification;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.VerificationStatus;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.verification.VerificationRequestRepository;
import com.alumnect.alumnect_backend.dto.request.verification.SubmitVerificationRequestDto;
import com.alumnect.alumnect_backend.dto.response.verification.VerificationStatusResponseDto;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.verification.VerificationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.Optional;

/**
 * Lớp triển khai nghiệp vụ gửi yêu cầu nâng cấp từ Sinh viên (STUDENT) lên Cựu sinh viên (ALUMNI)
 * và tra cứu trạng thái xét duyệt hồ sơ (UC08).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationServiceImpl implements VerificationService {

    private final VerificationRequestRepository verificationRequestRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final MajorRepository majorRepository;
    private final VerificationMapper verificationMapper;

    /**
     * Lấy trạng thái yêu cầu xác minh / nâng cấp Cựu sinh viên gần nhất của người dùng hiện tại.
     *
     * @param email Email người dùng trích xuất từ SecurityContext
     * @return DTO thông tin trạng thái xác minh
     */
    @Override
    @Transactional(readOnly = true)
    public VerificationStatusResponseDto getMyVerificationStatus(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng."));

        UserProfile profile = userProfileRepository.findById(user.getId()).orElse(user.getProfile());
        Optional<VerificationRequest> latestRequestOpt = verificationRequestRepository
                .findFirstByUserIdOrderByCreatedAtDesc(user.getId());

        return verificationMapper.toStatusResponse(user, profile, latestRequestOpt.orElse(null));
    }

    /**
     * Xử lý yêu cầu nâng cấp tài khoản từ Sinh viên (STUDENT) lên Cựu sinh viên (ALUMNI).
     * Kiểm tra chặt chẽ vai trò hiện tại, trạng thái hoạt động của tài khoản, tính hợp lệ của năm tốt nghiệp,
     * chuyên ngành và đảm bảo không có yêu cầu nào đang ở trạng thái chờ duyệt (PENDING).
     *
     * @param email   Email người dùng trích xuất từ SecurityContext
     * @param request DTO dữ liệu yêu cầu nâng cấp Cựu sinh viên
     * @return DTO thông tin phiếu yêu cầu xác minh vừa tạo
     */
    @Override
    @Transactional
    public VerificationStatusResponseDto submitAlumniUpgradeRequest(String email, SubmitVerificationRequestDto request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng."));

        String roleName = user.getRole() != null ? user.getRole().getName() : "";

        // BR-UC08-01: Kiểm tra vai trò tài khoản
        if ("ALUMNI".equalsIgnoreCase(roleName)) {
            throw new ConflictException("Tài khoản của bạn đã là Cựu sinh viên.");
        }
        if ("ADMIN".equalsIgnoreCase(roleName) || !"STUDENT".equalsIgnoreCase(roleName)) {
            throw new ForbiddenException("Chỉ tài khoản Sinh viên mới có thể gửi yêu cầu nâng cấp lên Cựu sinh viên.");
        }

        // BR-UC08-02: Tài khoản phải đang hoạt động bình thường
        if (user.getAccountStatus() != AccountStatus.ACTIVE || !user.isEmailVerified()) {
            throw new ForbiddenException("Tài khoản của bạn hiện không ở trạng thái hoạt động để gửi yêu cầu nâng cấp.");
        }

        // BR-UC08-03: Không cho phép gửi trùng khi đang có phiếu chờ duyệt (PENDING)
        if (verificationRequestRepository.existsByUserIdAndStatus(user.getId(), VerificationStatus.PENDING)) {
            throw new ConflictException("Bạn đang có một yêu cầu nâng cấp Cựu sinh viên chờ xét duyệt. Vui lòng đợi Quản trị viên phản hồi.");
        }

        // BR-UC08-04: Kiểm tra năm tốt nghiệp hợp lệ theo năm hiện tại (tối đa năm hiện tại + 1)
        int maxAllowedYear = Year.now().getValue() + 1;
        if (request.getGraduationYear() > maxAllowedYear) {
            throw new BadRequestException("Năm tốt nghiệp không được lớn hơn năm hiện tại quá 1 năm.");
        }

        // BR-UC08-05: Kiểm tra chuyên ngành tồn tại
        Major major = majorRepository.findById(request.getMajorId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyên ngành đã chọn trong hệ thống."));

        // Đồng bộ năm tốt nghiệp và chuyên ngành vào hồ sơ cá nhân của sinh viên
        UserProfile profile = userProfileRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cá nhân của người dùng."));
        profile.setGraduationYear(request.getGraduationYear());
        profile.setMajor(major);
        userProfileRepository.save(profile);

        // Khởi tạo bản ghi yêu cầu xác minh mới ở trạng thái PENDING
        VerificationRequest verificationRequest = VerificationRequest.builder()
                .user(user)
                .major(major)
                .proofUrl(request.getProofUrl().trim())
                .status(VerificationStatus.PENDING)
                .build();

        VerificationRequest savedRequest = verificationRequestRepository.save(verificationRequest);
        log.info("Sinh viên ID={} ({}) đã gửi yêu cầu nâng cấp lên Cựu sinh viên, mã phiếu ID={}",
                user.getId(), user.getEmail(), savedRequest.getId());

        return verificationMapper.toStatusResponse(user, profile, savedRequest);
    }
}
