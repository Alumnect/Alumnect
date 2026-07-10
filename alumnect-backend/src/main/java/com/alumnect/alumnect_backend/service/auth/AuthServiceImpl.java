package com.alumnect.alumnect_backend.service.auth;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.AuthProvider;
import com.alumnect.alumnect_backend.common.enums.VerificationStatus;
import com.alumnect.alumnect_backend.common.enums.VerificationType;
import com.alumnect.alumnect_backend.dao.auth.VerificationTokenRepository;
import com.alumnect.alumnect_backend.dao.user.*;
import com.alumnect.alumnect_backend.dao.verification.VerificationRequestRepository;
import com.alumnect.alumnect_backend.dao.auth.RefreshTokenRepository;
import com.alumnect.alumnect_backend.dto.request.auth.LoginRequest;
import com.alumnect.alumnect_backend.dto.request.auth.RefreshRequest;
import com.alumnect.alumnect_backend.dto.request.auth.RegisterRequest;
import com.alumnect.alumnect_backend.dto.request.auth.LogoutRequest;
import com.alumnect.alumnect_backend.dto.response.auth.LoginResponse;
import com.alumnect.alumnect_backend.entity.auth.RefreshToken;
import com.alumnect.alumnect_backend.entity.auth.VerificationToken;
import com.alumnect.alumnect_backend.security.jwt.JwtService;
import com.alumnect.alumnect_backend.entity.user.*;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.exception.GoogleUserNotFoundException;
import com.alumnect.alumnect_backend.exception.WaitingApprovalException;
import com.alumnect.alumnect_backend.dto.request.auth.GoogleLoginRequest;
import com.alumnect.alumnect_backend.dto.request.auth.GoogleRegisterRequest;
import com.alumnect.alumnect_backend.entity.auth.UserOAuthProvider;
import com.alumnect.alumnect_backend.dao.auth.UserOAuthProviderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.Map;
import com.alumnect.alumnect_backend.mapper.auth.AuthMapper;
import com.alumnect.alumnect_backend.service.mail.MailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
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
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private JwtService jwtService;

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

    @Autowired
    private UserOAuthProviderRepository userOAuthProviderRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${app.google.client-id}")
    private String googleClientId;

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

        // 1b. Kiểm tra mã số sinh viên đã được đăng ký chưa
        String studentCode = request.getStudentCode() != null ? request.getStudentCode().trim() : "";
        if (isNewUser) {
            if (userProfileRepository.existsByStudentCodeIgnoreCase(studentCode)) {
                throw new ConflictException("Mã số sinh viên này đã được đăng ký trong hệ thống.");
            }
        } else {
            if (userProfileRepository.existsByStudentCodeIgnoreCaseAndUserIdNot(studentCode, user.getId())) {
                throw new ConflictException("Mã số sinh viên này đã được đăng ký bởi tài khoản khác.");
            }
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

        // 3b. Kiểm tra các trường bắt buộc đặc thù của vai trò ALUMNI trước khi ghi vào
        // CSDL
        if (roleName.equals("ALUMNI")) {
            if (request.getGraduationYear() == null) {
                throw new BadRequestException("Năm tốt nghiệp là bắt buộc khi đăng ký với vai trò Cựu sinh viên");
            }
            int currentYear = LocalDate.now().getYear();
            if (request.getGraduationYear() > currentYear) {
                throw new BadRequestException("Năm tốt nghiệp không được lớn hơn năm hiện tại");
            }
            if (request.getProofUrl() == null || request.getProofUrl().trim().isEmpty()) {
                throw new BadRequestException("Ảnh minh chứng là bắt buộc khi đăng ký với vai trò Cựu sinh viên");
            }
        }

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
        // cựu sinh viên (các validation đã được kiểm tra ở bước 3b trước khi save)
        if (roleName.equals("ALUMNI")) {
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

    /**
     * Băm SHA-256 mã token.
     */
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi băm token", e);
        }
    }

    /**
     * Đăng nhập hệ thống (Local Login).
     */
    @Override
    @Transactional
    public LoginResponse login(LoginRequest request, String userAgent, String ipAddress) {
        String email = request.getEmail().trim().toLowerCase();

        // 1. Tìm tài khoản bằng email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Tài khoản hoặc mật khẩu không chính xác"));

        // 2. Kiểm tra tài khoản có mật khẩu cục bộ hay không
        if (user.getPasswordHash() == null) {
            throw new BadRequestException("Tài khoản này được đăng ký thông qua mạng xã hội khác");
        }

        // 3. So khớp mật khẩu đã băm
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Tài khoản hoặc mật khẩu không chính xác");
        }

        // 4. Kiểm tra xem email đã được xác minh chưa
        if (!user.isEmailVerified()) {
            throw new BadRequestException(
                    "Email của bạn chưa được xác thực. Vui lòng kiểm tra hòm thư để xác thực trước.");
        }

        // 5. Kiểm tra trạng thái hoạt động của tài khoản
        if (user.getAccountStatus() == AccountStatus.LOCKED) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }
        if (user.getAccountStatus() == AccountStatus.WAITING_APPROVAL) {
            throw new BadRequestException("Tài khoản của bạn đang chờ quản trị viên phê duyệt. Vui lòng đợi.");
        }
        if (user.getAccountStatus() == AccountStatus.PENDING) {
            throw new BadRequestException(
                    "Email của bạn chưa được xác thực. Vui lòng kiểm tra hòm thư để xác thực trước.");
        }

        // 6. Cập nhật last_login_at
        user.setLastLoginAt(Instant.now());
        try {
            userRepository.save(user);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật thời gian đăng nhập: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể cập nhật thời gian đăng nhập");
        }

        // 7. Tạo Access Token (JWT, hạn 24h — BR-02) và Refresh Token (JWT, hạn 7 ngày
        // — BR-03)
        String accessToken = jwtService.generateToken(user);
        String rawRefreshToken = jwtService.generateRefreshToken(user);

        // 8. Băm SHA-256 Refresh Token và lưu vào database
        String tokenHash = hashToken(rawRefreshToken);
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .build();
        try {
            refreshTokenRepository.save(refreshTokenEntity);
        } catch (Exception e) {
            log.error("Lỗi khi lưu Refresh Token: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể tạo phiên đăng nhập mới");
        }

        // 9. Lấy họ tên và avatar từ UserProfile
        String fullName = "";
        String avatarUrl = null;
        Optional<UserProfile> profileOpt = userProfileRepository.findById(user.getId());
        if (profileOpt.isPresent()) {
            fullName = profileOpt.get().getFullName();
            avatarUrl = profileOpt.get().getAvatarUrl();
        }

        // 10. Trả về LoginResponse DTO
        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .fullName(fullName)
                .avatarUrl(avatarUrl)
                .accountStatus(user.getAccountStatus().name())
                .build();
    }

    /**
     * Làm mới Access Token bằng Refresh Token.
     */
    @Override
    @Transactional
    public LoginResponse refresh(RefreshRequest request, String userAgent, String ipAddress) {
        String rawRefreshToken = request.getRefreshToken();

        // 1. Giải mã email từ Refresh Token JWT — nếu token bị giả mạo/hết hạn sẽ ném
        // exception
        try {
            jwtService.extractUsername(rawRefreshToken);
        } catch (Exception e) {
            throw new BadRequestException(
                    "Phiên đăng nhập đã hết hạn hoặc bị thu hồi vì lý do bảo mật. Vui lòng đăng nhập lại.");
        }

        // 2. Băm SHA-256 mã Refresh Token gửi lên
        String tokenHash = hashToken(rawRefreshToken);

        // 3. Tìm Refresh Token trong CSDL bằng mã băm
        RefreshToken refreshTokenEntity = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException(
                        "Phiên đăng nhập đã hết hạn hoặc bị thu hồi vì lý do bảo mật. Vui lòng đăng nhập lại."));

        User user = refreshTokenEntity.getUser();

        // 4. Nếu token đã bị thu hồi (revoked = true) -> Nghi ngờ Replay Attack!
        // (BR-06)
        if (refreshTokenEntity.isRevoked()) {
            // Biện pháp bảo mật: Xóa toàn bộ token của người dùng này để buộc đăng xuất tất
            // cả thiết bị
            try {
                refreshTokenRepository.deleteByUser(user);
            } catch (Exception e) {
                log.error("Lỗi khi xóa các Refresh Token trong Replay Attack: ", e);
            }
            throw new BadRequestException(
                    "Phiên đăng nhập đã hết hạn hoặc bị thu hồi vì lý do bảo mật. Vui lòng đăng nhập lại.");
        }

        // 5. Kiểm tra xem token đã hết hạn chưa (kiểm tra thêm ở DB — BR-04)
        if (refreshTokenEntity.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException(
                    "Phiên đăng nhập đã hết hạn hoặc bị thu hồi vì lý do bảo mật. Vui lòng đăng nhập lại.");
        }

        // 6. Kiểm tra trạng thái tài khoản
        if (user.getAccountStatus() == AccountStatus.LOCKED) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        // 7. Xoay vòng Refresh Token (Token Rotation): Thu hồi token cũ — BR-05
        refreshTokenEntity.setRevoked(true);
        try {
            refreshTokenRepository.save(refreshTokenEntity);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật trạng thái thu hồi của Refresh Token: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể xoay vòng phiên đăng nhập");
        }

        // 8. Tạo cặp Access Token và Refresh Token mới (đều là JWT — BR-02, BR-03)
        String newAccessToken = jwtService.generateToken(user);
        String newRawRefreshToken = jwtService.generateRefreshToken(user);
        String newTokenHash = hashToken(newRawRefreshToken);

        // 9. Lưu Refresh Token mới vào CSDL (lưu dạng băm SHA-256 — BR-04)
        RefreshToken newRefreshTokenEntity = RefreshToken.builder()
                .user(user)
                .tokenHash(newTokenHash)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .build();
        try {
            refreshTokenRepository.save(newRefreshTokenEntity);
        } catch (Exception e) {
            log.error("Lỗi khi lưu Refresh Token mới: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể làm mới phiên đăng nhập");
        }

        // 10. Lấy họ tên và avatar từ UserProfile
        String fullName = "";
        String avatarUrl = null;
        Optional<UserProfile> profileOpt = userProfileRepository.findById(user.getId());
        if (profileOpt.isPresent()) {
            fullName = profileOpt.get().getFullName();
            avatarUrl = profileOpt.get().getAvatarUrl();
        }

        // 11. Trả về LoginResponse DTO
        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawRefreshToken)
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .fullName(fullName)
                .avatarUrl(avatarUrl)
                .accountStatus(user.getAccountStatus().name())
                .build();
    }

    /**
     * Xác thực Google ID Token bằng cách gửi yêu cầu tới endpoint tokeninfo của Google.
     * Kiểm tra tính hợp lệ của token và so khớp với Client ID của hệ thống.
     *
     * @param tokenString Chuỗi ID Token nhận từ Client
     * @return Map chứa thông tin các claims trong Google ID Token (email, name, sub, picture...)
     */
    private Map<String, Object> verifyGoogleToken(String tokenString) {
        try {
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + tokenString;

            // Gọi HTTP GET request tới Google API để xác thực token bằng RestTemplate bean dùng chung
            ResponseEntity<Map> responseEntity = this.restTemplate.getForEntity(url, Map.class);

            if (responseEntity.getStatusCode() != HttpStatus.OK || responseEntity.getBody() == null) {
                throw new BadRequestException("Token xác thực Google không hợp lệ hoặc đã hết hạn");
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> body = (Map<String, Object>) responseEntity.getBody();

            // Kiểm tra claim audience (aud) so khớp với client id của hệ thống
            String aud = (String) body.get("aud");
            if (aud == null || !aud.equals(googleClientId)) {
                throw new BadRequestException("Token xác thực Google không khớp với Client ID của hệ thống");
            }

            // Kiểm tra email_verified của Google
            Object emailVerifiedObj = body.get("email_verified");
            boolean verified = false;
            if (emailVerifiedObj instanceof Boolean) {
                verified = (Boolean) emailVerifiedObj;
            } else if (emailVerifiedObj instanceof String) {
                verified = Boolean.parseBoolean((String) emailVerifiedObj);
            }

            if (!verified) {
                throw new BadRequestException("Tài khoản Google này chưa được xác thực email");
            }

            return body;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi xảy ra khi xác thực Google ID Token: ", e);
            throw new BadRequestException("Không thể xác thực tài khoản Google vào lúc này. Vui lòng thử lại sau.");
        }
    }

    /**
     * Đăng nhập vào hệ thống sử dụng tài khoản Google.
     * Xác thực Google ID Token, kiểm tra tài khoản liên kết, và trả về cặp tokens.
     */
    @Override
    @Transactional(noRollbackFor = WaitingApprovalException.class)
    public LoginResponse loginWithGoogle(GoogleLoginRequest request, String userAgent, String ipAddress) {
        // 1. Xác thực Google token và lấy thông tin người dùng
        Map<String, Object> googleClaims = verifyGoogleToken(request.getToken());

        String providerUserId = (String) googleClaims.get("sub");
        String email = ((String) googleClaims.get("email")).trim().toLowerCase();

        // 2. Tìm kiếm trong bảng user_oauth_providers trước
        Optional<UserOAuthProvider> oauthOpt = userOAuthProviderRepository.findByProviderAndProviderUserId("GOOGLE", providerUserId);

        User user;
        if (oauthOpt.isPresent()) {
            user = oauthOpt.get().getUser();
        } else {
            // 3. Nếu chưa liên kết OAuth, kiểm tra xem email đã tồn tại trong hệ thống chưa
            Optional<User> existingUserOpt = userRepository.findByEmail(email);
            if (existingUserOpt.isPresent()) {
                user = existingUserOpt.get();

                // Tạo liên kết OAuth
                UserOAuthProvider newOauth = UserOAuthProvider.builder()
                        .user(user)
                        .provider("GOOGLE")
                        .providerUserId(providerUserId)
                        .build();
                userOAuthProviderRepository.save(newOauth);


            } else {
                // 4. Nếu email chưa tồn tại -> Ném lỗi GoogleUserNotFoundException để Frontend biết và điền sẵn form đăng ký
                String name = (String) googleClaims.get("name");
                if (name == null) {
                    name = "";
                }
                throw new GoogleUserNotFoundException(email, name, providerUserId, "Tài khoản Google chưa được đăng ký trên hệ thống.");
            }
        }

        // 5. Kiểm tra trạng thái tài khoản
        if (user.getAccountStatus() == AccountStatus.LOCKED) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }
        if (user.getAccountStatus() == AccountStatus.WAITING_APPROVAL) {
            throw new BadRequestException("Tài khoản của bạn đang chờ quản trị viên phê duyệt. Vui lòng đợi.");
        }
        if (user.getAccountStatus() == AccountStatus.PENDING) {
            String roleName = user.getRole().getName().toUpperCase();
            if (roleName.equals("STUDENT")) {
                user.setAccountStatus(AccountStatus.ACTIVE);
                user.setEmailVerified(true);
                user.setAccountVerified(true);
            } else if (roleName.equals("ALUMNI")) {
                user.setAccountStatus(AccountStatus.WAITING_APPROVAL);
                user.setEmailVerified(true);
                user.setAccountVerified(false);
                userRepository.save(user);
                throw new WaitingApprovalException("Tài khoản của bạn đang chờ quản trị viên phê duyệt. Vui lòng đợi.");
            }
            userRepository.save(user);
        }

        // 6. Cập nhật thời điểm đăng nhập cuối cùng
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        // 7. Tạo cặp JWT tokens
        String accessToken = jwtService.generateToken(user);
        String rawRefreshToken = jwtService.generateRefreshToken(user);

        // Băm và lưu Refresh Token vào database
        String tokenHash = hashToken(rawRefreshToken);
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                .revoked(false)
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .build();
        try {
            refreshTokenRepository.save(refreshTokenEntity);
        } catch (Exception e) {
            log.error("Lỗi khi lưu Refresh Token Google Login: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể tạo phiên đăng nhập mới");
        }

        // Lấy thông tin cá nhân
        String fullName = "";
        String avatarUrl = null;
        Optional<UserProfile> profileOpt = userProfileRepository.findById(user.getId());
        if (profileOpt.isPresent()) {
            fullName = profileOpt.get().getFullName();
            avatarUrl = profileOpt.get().getAvatarUrl();
        }

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .fullName(fullName)
                .avatarUrl(avatarUrl)
                .accountStatus(user.getAccountStatus().name())
                .build();
    }

    /**
     * Đăng ký tài khoản người dùng mới sử dụng tài khoản Google.
     * Xác thực token, lấy email từ Google, kiểm tra thông tin bổ sung và lưu vào DB.
     */
    @Override
    @Transactional
    public LoginResponse registerWithGoogle(GoogleRegisterRequest request, String userAgent, String ipAddress) {
        // 1. Xác thực Google token
        Map<String, Object> googleClaims = verifyGoogleToken(request.getToken());

        String providerUserId = (String) googleClaims.get("sub");
        String email = ((String) googleClaims.get("email")).trim().toLowerCase();

        // 2. Kiểm tra xem email đã tồn tại chưa
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
            }
            isNewUser = false;
        } else {
            user = new User();
            user.setEmail(email);
        }

        // 3. Kiểm tra xem liên kết OAuth này đã tồn tại chưa
        if (userOAuthProviderRepository.existsByProviderAndProviderUserId("GOOGLE", providerUserId)) {
            throw new ConflictException("Tài khoản Google này đã được liên kết với một tài khoản khác.");
        }

        // 3b. Kiểm tra mã số sinh viên đã được đăng ký chưa
        String studentCode = request.getStudentCode() != null ? request.getStudentCode().trim() : "";
        if (isNewUser) {
            if (userProfileRepository.existsByStudentCodeIgnoreCase(studentCode)) {
                throw new ConflictException("Mã số sinh viên này đã được đăng ký trong hệ thống.");
            }
        } else {
            if (userProfileRepository.existsByStudentCodeIgnoreCaseAndUserIdNot(studentCode, user.getId())) {
                throw new ConflictException("Mã số sinh viên này đã được đăng ký bởi tài khoản khác.");
            }
        }

        // 4. Lấy vai trò (STUDENT hoặc ALUMNI)
        String roleName = request.getRole().trim().toUpperCase();
        if (!roleName.equals("STUDENT") && !roleName.equals("ALUMNI")) {
            throw new BadRequestException("Vai trò không hợp lệ để đăng ký: " + roleName);
        }
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò không tồn tại: " + roleName));

        // 5. Lấy chuyên ngành
        Major major = majorRepository.findById(request.getMajorId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Chuyên ngành không tồn tại với ID: " + request.getMajorId()));

        // 5b. Ràng buộc với ALUMNI
        if (roleName.equals("ALUMNI")) {
            if (request.getGraduationYear() == null) {
                throw new BadRequestException("Năm tốt nghiệp là bắt buộc khi đăng ký với vai trò Cựu sinh viên");
            }
            int currentYear = LocalDate.now().getYear();
            if (request.getGraduationYear() > currentYear) {
                throw new BadRequestException("Năm tốt nghiệp không được lớn hơn năm hiện tại");
            }
            if (request.getProofUrl() == null || request.getProofUrl().trim().isEmpty()) {
                throw new BadRequestException("Ảnh minh chứng là bắt buộc khi đăng ký với vai trò Cựu sinh viên");
            }
        }

        // 6. Tạo/Cập nhật người dùng mới
        user.setRole(role);
        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setEmailVerified(true); // Google đã xác thực email
        if (isNewUser) {
            user.setPasswordHash(null); // Không sử dụng mật khẩu cho tài khoản đăng ký qua Google mới
        }

        if (roleName.equals("STUDENT")) {
            user.setAccountStatus(AccountStatus.ACTIVE);
            user.setAccountVerified(true);
        } else {
            user.setAccountStatus(AccountStatus.WAITING_APPROVAL); // Chờ phê duyệt của Admin đối với Alumni
            user.setAccountVerified(false);
        }

        try {
            user = userRepository.save(user);
        } catch (Exception e) {
            log.error("Lỗi khi lưu tài khoản người dùng Google: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể lưu tài khoản người dùng");
        }

        // 7. Tạo liên kết OAuth nếu chưa tồn tại
        if (!userOAuthProviderRepository.existsByProviderAndProviderUserId("GOOGLE", providerUserId)) {
            UserOAuthProvider oauth = UserOAuthProvider.builder()
                    .user(user)
                    .provider("GOOGLE")
                    .providerUserId(providerUserId)
                    .build();
            try {
                userOAuthProviderRepository.save(oauth);
            } catch (Exception e) {
                log.error("Lỗi khi lưu liên kết OAuth: ", e);
                throw new RuntimeException("Lỗi hệ thống: Không thể tạo liên kết OAuth2");
            }
        }

        // 8. Tạo hồ sơ cá nhân (UserProfile)
        UserProfile profile;
        if (isNewUser) {
            String picture = (String) googleClaims.get("picture");
            profile = UserProfile.builder()
                    .user(user)
                    .fullName(request.getFullName().trim())
                    .avatarUrl(picture) // lấy avatar mặc định của người dùng từ Google
                    .major(major)
                    .cohort(request.getCohort())
                    .studentCode(studentCode)
                    .build();
        } else {
            profile = userProfileRepository.findById(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ người dùng"));
            profile.setFullName(request.getFullName().trim());
            profile.setCohort(request.getCohort());
            profile.setStudentCode(studentCode);
            profile.setMajor(major);
            String picture = (String) googleClaims.get("picture");
            if (picture != null) {
                profile.setAvatarUrl(picture);
            }
        }

        try {
            userProfileRepository.save(profile);
        } catch (Exception e) {
            log.error("Lỗi khi lưu thông tin hồ sơ Google: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể lưu thông tin hồ sơ cá nhân");
        }

        // 9. Tạo cài đặt mặc định nếu là user mới
        if (isNewUser) {
            UserSettings settings = UserSettings.builder()
                    .user(user)
                    .theme("SYSTEM")
                    .language("vi")
                    .build();
            saveUserSettings(settings);
        }

        // 10. Nếu là ALUMNI, tạo/cập nhật yêu cầu xác minh
        if (roleName.equals("ALUMNI")) {
            VerificationRequest verRequest;
            Optional<VerificationRequest> existingVerRequestOpt = verificationRequestRepository.findByUser(user);
            if (existingVerRequestOpt.isPresent()) {
                verRequest = existingVerRequestOpt.get();
                verRequest.setGraduationYear(request.getGraduationYear());
                verRequest.setProofUrl(request.getProofUrl());
                verRequest.setNote(request.getNote());
                verRequest.setStatus(VerificationStatus.PENDING);
            } else {
                verRequest = VerificationRequest.builder()
                        .user(user)
                        .graduationYear(request.getGraduationYear())
                        .proofUrl(request.getProofUrl())
                        .note(request.getNote())
                        .status(VerificationStatus.PENDING)
                        .build();
            }
            verRequest.setMajor(major);

            try {
                verificationRequestRepository.save(verRequest);
            } catch (Exception e) {
                log.error("Lỗi khi lưu yêu cầu xác minh cựu sinh viên qua Google: ", e);
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

        // 11. Ghi nhận thời gian đăng nhập
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        // 12. Tạo token phản hồi nếu là STUDENT (được kích hoạt ngay)
        String accessToken = null;
        String rawRefreshToken = null;

        if (roleName.equals("STUDENT")) {
            accessToken = jwtService.generateToken(user);
            rawRefreshToken = jwtService.generateRefreshToken(user);
            String tokenHash = hashToken(rawRefreshToken);

            RefreshToken refreshTokenEntity = RefreshToken.builder()
                    .user(user)
                    .tokenHash(tokenHash)
                    .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
                    .revoked(false)
                    .userAgent(userAgent)
                    .ipAddress(ipAddress)
                    .build();
            try {
                refreshTokenRepository.save(refreshTokenEntity);
            } catch (Exception e) {
                log.error("Lỗi khi lưu Refresh Token Google Register: ", e);
                throw new RuntimeException("Lỗi hệ thống: Không thể tạo phiên đăng nhập mới");
            }
        }

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .fullName(profile.getFullName())
                .avatarUrl(profile.getAvatarUrl())
                .accountStatus(user.getAccountStatus().name())
                .build();
    }

    /**
     * Đăng xuất khỏi hệ thống.
     * Xác minh Refresh Token và thực hiện xóa khỏi CSDL để chấm dứt phiên.
     */
    @Override
    @Transactional
    public void logout(LogoutRequest request) {
        String tokenHash = hashToken(request.getRefreshToken());
        RefreshToken tokenEntity = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException("Phiên đăng nhập không tồn tại hoặc đã hết hạn."));

        try {
            refreshTokenRepository.delete(tokenEntity);
        } catch (Exception e) {
            log.error("Lỗi xảy ra khi xóa Refresh Token lúc đăng xuất: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể hoàn tất đăng xuất");
        }
    }

    /**
     * Đăng xuất người dùng khỏi tất cả các thiết bị bằng cách thu hồi toàn bộ refresh token.
     *
     * @param email Địa chỉ email của người dùng
     */
    @Override
    @Transactional
    public void logoutAllDevices(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với email: " + email));
        try {
            refreshTokenRepository.deleteByUser(user);
        } catch (Exception e) {
            log.error("Lỗi xảy ra khi xóa toàn bộ Refresh Token: ", e);
            throw new RuntimeException("Lỗi hệ thống: Không thể đăng xuất khỏi tất cả các thiết bị");
        }
    }
}
