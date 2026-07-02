package com.alumnect.alumnect_backend.service.auth;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.AuthProvider;
import com.alumnect.alumnect_backend.common.enums.VerificationStatus;
import com.alumnect.alumnect_backend.common.enums.VerificationType;
import com.alumnect.alumnect_backend.dao.auth.VerificationTokenRepository;
import com.alumnect.alumnect_backend.dao.user.*;
import com.alumnect.alumnect_backend.dao.verification.VerificationRequestRepository;
import com.alumnect.alumnect_backend.dto.request.auth.RegisterRequest;
import com.alumnect.alumnect_backend.entity.auth.VerificationToken;
import com.alumnect.alumnect_backend.entity.user.*;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.auth.AuthMapper;
import com.alumnect.alumnect_backend.service.mail.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * Lớp dịch vụ thực thi các logic liên quan đến xác thực và đăng ký người dùng.
 * Triển khai interface {@link AuthService}.
 */
@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private MajorRepository majorRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private VerificationTokenRepository tokenRepository;

    @Autowired
    private VerificationRequestRepository verificationRequestRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private AuthMapper authMapper;

    @Autowired
    private MailService mailService;

    @Autowired
    private UserSettingsRepository userSettingsRepository;

    /**
     * Thực hiện đăng ký tài khoản người dùng mới (STUDENT hoặc ALUMNI).
     * Bao gồm mã hóa mật khẩu, tạo thông tin cá nhân (Profile), tạo cài đặt mặc
     * định (Settings),
     * nếu là ALUMNI thì tạo phiếu yêu cầu xác minh tư cách cựu sinh viên gửi lên
     * Admin, và cuối cùng gửi email mã OTP xác nhận.
     */
    @Override
    @Transactional
    public void register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // 1. Kiểm tra email đã tồn tại trong cơ sở dữ liệu chưa
        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        User user;
        boolean isNewUser = true;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.getAccountStatus() == AccountStatus.WAITING_APPROVAL) {
                throw new ConflictException(
                        "Tài khoản của bạn đã xác thực email thành công và đang chờ quản trị viên phê duyệt. Vui lòng đợi admin duyệt.");
            } else if (user.getAccountStatus() == AccountStatus.ACTIVE) {
                throw new ConflictException("Email này đã được đăng ký và kích hoạt thành công. Vui lòng đăng nhập.");
            } else if (user.getAccountStatus() == AccountStatus.LOCKED) {
                throw new ConflictException(
                        "Tài khoản liên kết với email này đã bị khóa. Vui lòng liên hệ quản trị viên.");
            } else if (user.getAccountStatus() != AccountStatus.PENDING) {
                throw new ConflictException("Email này đã được đăng ký trên hệ thống.");
            }
            isNewUser = false;
        } else {
            user = new User();
            user.setEmail(email);
            user.setAuthProvider(AuthProvider.LOCAL);
        }

        // 2. Lấy thông tin vai trò người dùng (STUDENT hoặc ALUMNI)
        String roleName = request.getRole().trim().toUpperCase();
        if (!roleName.equals("STUDENT") && !roleName.equals("ALUMNI")) {
            throw new BadRequestException("Vai trò không hợp lệ để đăng ký: " + roleName);
        }
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò không tồn tại: " + roleName));

        // 3. Lấy thông tin chuyên ngành học của người dùng
        Major major = majorRepository.findById(request.getMajorId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Chuyên ngành không tồn tại với ID: " + request.getMajorId()));

        // 4. Tạo/Cập nhật thực thể User và mã hóa mật khẩu bằng BCrypt
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setAccountStatus(AccountStatus.PENDING);
        user.setEmailVerified(false);
        user.setAccountVerified(false); // Mặc định là false, sẽ cập nhật tùy vai trò sau khi xác nhận email

        try {
            user = userRepository.save(user);
        } catch (Exception e) {
            log.error("Lỗi khi lưu thông tin tài khoản người dùng: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể lưu thông tin tài khoản người dùng");
        }

        // 5. Tạo hoặc cập nhật thực thể UserProfile chứa thông tin cá nhân và lưu trữ
        UserProfile profile;
        if (isNewUser) {
            profile = authMapper.toUserProfile(request);
            profile.setUser(user);
        } else {
            profile = userProfileRepository.findById(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ người dùng"));
            profile.setFullName(request.getFullName());
            profile.setCohort(request.getCohort());
            profile.setStudentCode(request.getStudentCode());
        }
        profile.setMajor(major);

        try {
            userProfileRepository.save(profile);
        } catch (Exception e) {
            log.error("Lỗi khi lưu thông tin hồ sơ cá nhân: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể lưu thông tin hồ sơ cá nhân");
        }

        // 6. Tạo thực thể cài đặt mặc định UserSettings (Theme: SYSTEM, Ngôn ngữ: vi)
        // nếu là user mới
        if (isNewUser) {
            UserSettings settings = UserSettings.builder()
                    .user(user)
                    .theme("SYSTEM")
                    .language("vi")
                    .build();
            saveUserSettings(settings);
        }

        // 7. Nếu vai trò đăng ký là ALUMNI, tạo/cập nhật phiếu yêu cầu xác minh tư cách
        // cựu sinh viên
        if (roleName.equals("ALUMNI")) {
            if (request.getStudentCode() == null || request.getStudentCode().trim().isEmpty()) {
                throw new BadRequestException("Mã số sinh viên là bắt buộc khi đăng ký với vai trò Cựu sinh viên");
            }
            if (request.getGraduationYear() == null) {
                throw new BadRequestException("Năm tốt nghiệp là bắt buộc khi đăng ký với vai trò Cựu sinh viên");
            }
            if (request.getProofUrl() == null || request.getProofUrl().trim().isEmpty()) {
                throw new BadRequestException("Ảnh minh chứng là bắt buộc khi đăng ký với vai trò Cựu sinh viên");
            }

            VerificationRequest verRequest;
            Optional<VerificationRequest> existingVerRequestOpt = verificationRequestRepository.findByUser(user);
            if (existingVerRequestOpt.isPresent()) {
                verRequest = existingVerRequestOpt.get();
                verRequest.setGraduationYear(request.getGraduationYear());
                verRequest.setProofUrl(request.getProofUrl());
                verRequest.setNote(request.getNote());
                verRequest.setStatus(VerificationStatus.PENDING);
            } else {
                verRequest = authMapper.toVerificationRequest(request);
                verRequest.setUser(user);
            }
            verRequest.setMajor(major);

            try {
                verificationRequestRepository.save(verRequest);
            } catch (Exception e) {
                log.error("Lỗi khi lưu yêu cầu xác minh cựu sinh viên: ", e);
                throw new RuntimeException("Lỗi hệ thống: Không thể lưu yêu cầu xác minh cựu sinh viên");
            }
        } else {
            // Nếu vai trò mới là STUDENT, xóa phiếu xác minh cũ của user này nếu có
            verificationRequestRepository.findByUser(user).ifPresent(verReq -> {
                try {
                    verificationRequestRepository.delete(verReq);
                } catch (Exception e) {
                    log.error("Lỗi khi xóa yêu cầu xác minh cũ: ", e);
                    throw new RuntimeException("Lỗi hệ thống: Không thể xóa yêu cầu xác minh cũ");
                }
            });
        }

        // 8. Vô hiệu hóa các mã OTP cũ chưa sử dụng
        try {
            tokenRepository.invalidateOldTokens(user, VerificationType.EMAIL_VERIFICATION);
        } catch (Exception e) {
            log.error("Lỗi khi vô hiệu hóa các mã OTP cũ: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể vô hiệu hóa các mã OTP cũ");
        }

        // 9. Tạo mã xác thực email (OTP 6 số ngẫu nhiên không trùng lặp)
        SecureRandom random = new SecureRandom();
        String tokenString;
        do {
            tokenString = String.valueOf(100000 + random.nextInt(900000));
        } while (tokenRepository.findByToken(tokenString).isPresent());

        // Mã OTP có thời hạn sử dụng trong vòng 5 phút
        VerificationToken token = VerificationToken.builder()
                .user(user)
                .token(tokenString)
                .type(VerificationType.EMAIL_VERIFICATION)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .build();

        try {
            tokenRepository.save(token);
        } catch (Exception e) {
            log.error("Lỗi khi tạo mã xác thực OTP: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể tạo mã xác thực OTP");
        }

        // 10. Gửi email chứa mã OTP và link xác nhận trực tiếp tới địa chỉ email người
        // dùng
        mailService.sendVerificationEmail(user.getEmail(), tokenString, profile.getFullName());
    }

    /**
     * Lưu cài đặt của người dùng.
     */
    private void saveUserSettings(UserSettings settings) {
        try {
            userSettingsRepository.save(settings);
        } catch (Exception e) {
            log.error("Lỗi khi lưu cài đặt người dùng: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể lưu cài đặt người dùng");
        }
    }

    /**
     * Xác thực email bằng chuỗi mã OTP 6 số.
     * Cập nhật email_verified = true và phân loại luồng trạng thái tài khoản:
     * - STUDENT → kích hoạt trực tiếp thành ACTIVE
     * - ALUMNI → đưa về trạng thái WAITING_APPROVAL (chờ Admin xét duyệt phiếu minh
     * chứng)
     */
    /**
     * Xác thực email bằng chuỗi mã OTP 6 số và địa chỉ email đi kèm.
     * Cập nhật email_verified = true và phân loại luồng trạng thái tài khoản.
     * Áp dụng giới hạn nhập sai tối đa 5 lần.
     */
    @Override
    @Transactional(noRollbackFor = BadRequestException.class)
    public String verifyEmail(String email, String tokenString) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với email: " + email));

        VerificationToken token = tokenRepository
                .findFirstByUserAndTypeOrderByCreatedAtDesc(user, VerificationType.EMAIL_VERIFICATION)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy yêu cầu xác thực email nào cho tài khoản này"));

        if (token.isUsed()) {
            throw new BadRequestException("Mã xác thực này đã được sử dụng trước đó");
        }

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Mã xác thực đã hết hạn");
        }

        // Kiểm tra xem mã đã bị khóa do nhập sai quá 5 lần chưa
        if (token.getFailedAttempts() >= 5) {
            throw new BadRequestException(
                    "Mã xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu gửi lại mã mới.");
        }

        // So khớp mã OTP
        if (!token.getToken().equals(tokenString)) {
            int currentFailed = token.getFailedAttempts() + 1;
            token.setFailedAttempts(currentFailed);
            try {
                tokenRepository.save(token);
            } catch (Exception e) {
                log.error("Lỗi khi cập nhật số lần nhập sai OTP: ", e);
                throw new RuntimeException("Lỗi hệ thống: Không thể cập nhật số lần nhập sai OTP");
            }

            int remaining = 5 - currentFailed;
            if (remaining <= 0) {
                throw new BadRequestException(
                        "Mã xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng yêu cầu gửi lại mã mới.");
            } else {
                throw new BadRequestException("Mã xác thực không chính xác. Bạn còn " + remaining + " lần thử.");
            }
        }

        // Đánh dấu mã OTP đã được sử dụng thành công
        token.setUsed(true);
        try {
            tokenRepository.save(token);
        } catch (Exception e) {
            log.error("Lỗi khi đánh dấu sử dụng OTP: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể cập nhật trạng thái sử dụng OTP");
        }

        // Kích hoạt xác thực email cho người dùng
        user.setEmailVerified(true);
        String roleName = user.getRole().getName().toUpperCase();

        if (roleName.equals("STUDENT")) {
            user.setAccountStatus(AccountStatus.ACTIVE);
            user.setAccountVerified(true);
        } else if (roleName.equals("ALUMNI")) {
            // Cựu sinh viên: chuyển sang chờ duyệt và chưa kích hoạt tài khoản
            user.setAccountStatus(AccountStatus.WAITING_APPROVAL);
            user.setAccountVerified(false);
        } else {
            // Trường hợp dự phòng cho các vai trò khác (VD: ADMIN)
            user.setAccountStatus(AccountStatus.ACTIVE);
        }

        try {
            userRepository.save(user);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật trạng thái kích hoạt tài khoản: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể cập nhật trạng thái kích hoạt tài khoản");
        }
        return roleName;
    }

    /**
     * Gửi lại mã OTP xác thực email mới cho người dùng.
     * Kiểm tra thời gian chờ 5 phút giữa 2 lần gửi.
     */
    @Override
    @Transactional
    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với email: " + email));

        if (user.isEmailVerified()) {
            throw new BadRequestException("Tài khoản này đã được xác thực email trước đó");
        }

        // 1. Giới hạn thời gian chờ gửi lại mã mới (5 phút - bỏ qua nếu mã cũ đã bị
        // khóa)
        Optional<VerificationToken> lastTokenOpt = tokenRepository.findFirstByUserAndTypeOrderByCreatedAtDesc(user,
                VerificationType.EMAIL_VERIFICATION);
        if (lastTokenOpt.isPresent()) {
            VerificationToken lastToken = lastTokenOpt.get();
            Instant nextAllowedTime = lastToken.getCreatedAt().plus(5, ChronoUnit.MINUTES);
            if (lastToken.getFailedAttempts() < 5 && Instant.now().isBefore(nextAllowedTime)) {
                long diffSeconds = Duration.between(Instant.now(), nextAllowedTime).getSeconds();
                long minutes = diffSeconds / 60;
                long seconds = diffSeconds % 60;
                String timeStr = minutes > 0 ? (minutes + " phút " + seconds + " giây") : (seconds + " giây");
                throw new BadRequestException("Vui lòng đợi " + timeStr + " trước khi yêu cầu gửi lại mã OTP mới.");
            }
        }

        // 2. Vô hiệu hóa các mã OTP cũ chưa sử dụng
        try {
            tokenRepository.invalidateOldTokens(user, VerificationType.EMAIL_VERIFICATION);
        } catch (Exception e) {
            log.error("Lỗi khi vô hiệu hóa các mã OTP cũ: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể vô hiệu hóa các mã OTP cũ");
        }

        // 3. Tạo mã xác thực mới
        SecureRandom random = new SecureRandom();
        String tokenString;
        do {
            tokenString = String.valueOf(100000 + random.nextInt(900000));
        } while (tokenRepository.findByToken(tokenString).isPresent());

        VerificationToken token = VerificationToken.builder()
                .user(user)
                .token(tokenString)
                .type(VerificationType.EMAIL_VERIFICATION)
                .expiresAt(Instant.now().plus(5, ChronoUnit.MINUTES))
                .used(false)
                .build();

        try {
            tokenRepository.save(token);
        } catch (Exception e) {
            log.error("Lỗi khi lưu mã OTP mới: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể lưu mã OTP mới");
        }

        // Lấy tên đầy đủ của người dùng phục vụ nội dung email
        String fullName = user.getEmail();
        var profileOpt = userProfileRepository.findById(user.getId());
        if (profileOpt.isPresent()) {
            fullName = profileOpt.get().getFullName();
        }

        // Gửi email mới chứa mã OTP
        mailService.sendVerificationEmail(user.getEmail(), tokenString, fullName);
    }
}
