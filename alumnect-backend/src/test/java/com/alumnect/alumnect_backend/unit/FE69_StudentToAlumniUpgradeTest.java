package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.VerificationStatus;
import com.alumnect.alumnect_backend.controller.verification.VerificationController;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.RoleRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.verification.VerificationRequestRepository;
import com.alumnect.alumnect_backend.dto.request.verification.AdminReviewVerificationDto;
import com.alumnect.alumnect_backend.dto.request.verification.SubmitVerificationRequestDto;
import com.alumnect.alumnect_backend.dto.response.verification.VerificationStatusResponseDto;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.GlobalExceptionHandler;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.verification.AdminVerificationMapper;
import com.alumnect.alumnect_backend.mapper.verification.VerificationMapper;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import com.alumnect.alumnect_backend.service.verification.AdminVerificationServiceImpl;
import com.alumnect.alumnect_backend.service.verification.VerificationServiceImpl;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.time.Year;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kiểm thử đơn vị cho UC08 - Chuyển đổi tài khoản Sinh viên (STUDENT) lên Cựu sinh viên (ALUMNI).
 * Bao gồm: VerificationServiceImpl (getMyVerificationStatus, submitAlumniUpgradeRequest),
 * AdminVerificationServiceImpl (reviewVerificationRequest cho STUDENT) và JSR-380 DTO Validation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UC08 - Upgrade Student to Alumni Verification Flow")
class FE69_StudentToAlumniUpgradeTest {

    @Mock
    private VerificationRequestRepository verificationRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private MajorRepository majorRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AdminVerificationMapper adminVerificationMapper;

    @Mock
    private NotificationService notificationService;

    @Spy
    private VerificationMapper verificationMapper = new VerificationMapper() {};

    @InjectMocks
    private VerificationServiceImpl verificationService;

    private AdminVerificationServiceImpl adminVerificationService;

    private Validator validator;
    private Role studentRole;
    private Role alumniRole;
    private Role adminRole;
    private Major seMajor;
    private User studentUser;
    private UserProfile studentProfile;
    private User adminUser;

    @BeforeEach
    void setUp() {
        validator = Validation.buildDefaultValidatorFactory().getValidator();

        adminVerificationService = new AdminVerificationServiceImpl(
                verificationRequestRepository,
                userRepository,
                userProfileRepository,
                roleRepository,
                adminVerificationMapper,
                notificationService
        );

        studentRole = Role.builder().id(1L).name("STUDENT").build();
        alumniRole = Role.builder().id(2L).name("ALUMNI").build();
        adminRole = Role.builder().id(3L).name("ADMIN").build();

        seMajor = Major.builder().id(1L).code("SE").name("Kỹ thuật phần mềm").build();

        studentUser = User.builder()
                .id(15L)
                .email("student15@fpt.edu.vn")
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(true)
                .isAccountVerified(true)
                .build();

        studentProfile = UserProfile.builder()
                .userId(15L)
                .user(studentUser)
                .fullName("Nguyễn Văn Sinh Viên")
                .studentCode("SE170015")
                .cohort(17)
                .graduationYear(2025)
                .major(seMajor)
                .build();

        adminUser = User.builder()
                .id(99L)
                .email("admin@fpt.edu.vn")
                .role(adminRole)
                .accountStatus(AccountStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("UTCID01 - getMyVerificationStatus: Sinh viên chưa từng gửi yêu cầu -> trả về NONE kèm thông tin gợi ý từ hồ sơ")
    void utcid01_getMyVerificationStatus_none() {
        when(userRepository.findByEmail("student15@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        when(userProfileRepository.findById(15L)).thenReturn(Optional.of(studentProfile));
        when(verificationRequestRepository.findFirstByUserIdOrderByCreatedAtDesc(15L)).thenReturn(Optional.empty());

        VerificationStatusResponseDto res = verificationService.getMyVerificationStatus("student15@fpt.edu.vn");

        assertThat(res.isHasSubmitted()).isFalse();
        assertThat(res.getStatus()).isEqualTo("NONE");
        assertThat(res.getCurrentRole()).isEqualTo("STUDENT");
        assertThat(res.getGraduationYear()).isEqualTo(2025);
        assertThat(res.getMajorId()).isEqualTo(1L);
        assertThat(res.getMajorName()).isEqualTo("Kỹ thuật phần mềm");
    }

    @Test
    @DisplayName("UTCID02 - submitAlumniUpgradeRequest: Sinh viên gửi yêu cầu hợp lệ -> tạo phiếu PENDING & cập nhật hồ sơ")
    void utcid02_submitAlumniUpgradeRequest_success() {
        SubmitVerificationRequestDto reqDto = SubmitVerificationRequestDto.builder()
                .proofUrl("https://pub-xxxx.r2.dev/proofs/bang-tot-nghiep-se170015.pdf")
                .graduationYear(2026)
                .majorId(1L)
                .build();

        when(userRepository.findByEmail("student15@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        when(verificationRequestRepository.existsByUserIdAndStatus(15L, VerificationStatus.PENDING)).thenReturn(false);
        when(majorRepository.findById(1L)).thenReturn(Optional.of(seMajor));
        when(userProfileRepository.findById(15L)).thenReturn(Optional.of(studentProfile));
        when(verificationRequestRepository.save(any(VerificationRequest.class))).thenAnswer(inv -> {
            VerificationRequest saved = inv.getArgument(0);
            saved.setId(101L);
            saved.setCreatedAt(Instant.now());
            return saved;
        });

        VerificationStatusResponseDto res = verificationService.submitAlumniUpgradeRequest("student15@fpt.edu.vn", reqDto);

        assertThat(res.getId()).isEqualTo(101L);
        assertThat(res.isHasSubmitted()).isTrue();
        assertThat(res.getStatus()).isEqualTo("PENDING");
        assertThat(res.getGraduationYear()).isEqualTo(2026);
        assertThat(studentProfile.getGraduationYear()).isEqualTo(2026);
        verify(userProfileRepository).save(studentProfile);
        verify(verificationRequestRepository).save(any(VerificationRequest.class));
    }

    @Test
    @DisplayName("UTCID03 - submitAlumniUpgradeRequest: Tài khoản đã là ALUMNI -> ném ConflictException")
    void utcid03_submitAlumniUpgradeRequest_alreadyAlumni() {
        studentUser.setRole(alumniRole);
        when(userRepository.findByEmail("student15@fpt.edu.vn")).thenReturn(Optional.of(studentUser));

        SubmitVerificationRequestDto reqDto = SubmitVerificationRequestDto.builder()
                .proofUrl("https://pub-xxxx.r2.dev/proofs/proof.png")
                .graduationYear(2025)
                .majorId(1L)
                .build();

        assertThatThrownBy(() -> verificationService.submitAlumniUpgradeRequest("student15@fpt.edu.vn", reqDto))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Tài khoản của bạn đã là Cựu sinh viên.");
    }

    @Test
    @DisplayName("UTCID04 - submitAlumniUpgradeRequest: Đang có yêu cầu PENDING -> ném ConflictException")
    void utcid04_submitAlumniUpgradeRequest_alreadyPending() {
        when(userRepository.findByEmail("student15@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        when(verificationRequestRepository.existsByUserIdAndStatus(15L, VerificationStatus.PENDING)).thenReturn(true);

        SubmitVerificationRequestDto reqDto = SubmitVerificationRequestDto.builder()
                .proofUrl("https://pub-xxxx.r2.dev/proofs/proof.png")
                .graduationYear(2025)
                .majorId(1L)
                .build();

        assertThatThrownBy(() -> verificationService.submitAlumniUpgradeRequest("student15@fpt.edu.vn", reqDto))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Bạn đang có một yêu cầu nâng cấp Cựu sinh viên chờ xét duyệt. Vui lòng đợi Quản trị viên phản hồi.");
    }

    @Test
    @DisplayName("UTCID05 - submitAlumniUpgradeRequest: Năm tốt nghiệp vượt quá năm hiện tại + 1 -> ném BadRequestException")
    void utcid05_submitAlumniUpgradeRequest_graduationYearTooFarInFuture() {
        when(userRepository.findByEmail("student15@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        when(verificationRequestRepository.existsByUserIdAndStatus(15L, VerificationStatus.PENDING)).thenReturn(false);

        int invalidYear = Year.now().getValue() + 2;
        SubmitVerificationRequestDto reqDto = SubmitVerificationRequestDto.builder()
                .proofUrl("https://pub-xxxx.r2.dev/proofs/proof.png")
                .graduationYear(invalidYear)
                .majorId(1L)
                .build();

        assertThatThrownBy(() -> verificationService.submitAlumniUpgradeRequest("student15@fpt.edu.vn", reqDto))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Năm tốt nghiệp không được lớn hơn năm hiện tại quá 1 năm.");
    }

    @Test
    @DisplayName("UTCID06 - Admin phê duyệt (APPROVED) yêu cầu của STUDENT -> chuyển role sang ALUMNI, gửi thông báo nâng cấp")
    void utcid06_adminApproveStudentUpgrade_switchesRoleToAlumni() {
        VerificationRequest upgradeReq = VerificationRequest.builder()
                .id(55L)
                .user(studentUser)
                .major(seMajor)
                .proofUrl("https://pub-xxxx.r2.dev/proofs/degree.pdf")
                .status(VerificationStatus.PENDING)
                .build();

        when(verificationRequestRepository.findById(55L)).thenReturn(Optional.of(upgradeReq));
        when(roleRepository.findByName("ALUMNI")).thenReturn(Optional.of(alumniRole));

        AdminReviewVerificationDto decisionDto = AdminReviewVerificationDto.builder()
                .status("APPROVED")
                .reviewNote("Bằng tốt nghiệp hợp lệ")
                .build();

        adminVerificationService.reviewVerificationRequest(55L, decisionDto, adminUser);

        assertThat(upgradeReq.getStatus()).isEqualTo(VerificationStatus.APPROVED);
        assertThat(studentUser.getRole().getName()).isEqualTo("ALUMNI");
        assertThat(studentUser.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(studentUser.isAccountVerified()).isTrue();
        verify(userRepository).save(studentUser);
        verify(notificationService).sendAlumniVerificationResultNotification(adminUser, studentUser, upgradeReq, true);
        verify(notificationService, never()).sendWelcomeNotification(any());
    }

    @Test
    @DisplayName("UTCID07 - Admin từ chối (REJECTED) yêu cầu của STUDENT -> giữ nguyên role STUDENT và trạng thái ACTIVE (không khóa tài khoản)")
    void utcid07_adminRejectStudentUpgrade_keepsStudentActive() {
        VerificationRequest upgradeReq = VerificationRequest.builder()
                .id(56L)
                .user(studentUser)
                .major(seMajor)
                .proofUrl("https://pub-xxxx.r2.dev/proofs/blurry.jpg")
                .status(VerificationStatus.PENDING)
                .build();

        when(verificationRequestRepository.findById(56L)).thenReturn(Optional.of(upgradeReq));

        AdminReviewVerificationDto decisionDto = AdminReviewVerificationDto.builder()
                .status("REJECTED")
                .reviewNote("Ảnh chụp bằng tốt nghiệp bị mờ, vui lòng chụp rõ nét hơn")
                .build();

        adminVerificationService.reviewVerificationRequest(56L, decisionDto, adminUser);

        assertThat(upgradeReq.getStatus()).isEqualTo(VerificationStatus.REJECTED);
        assertThat(upgradeReq.getReviewNote()).isEqualTo("Ảnh chụp bằng tốt nghiệp bị mờ, vui lòng chụp rõ nét hơn");
        assertThat(studentUser.getRole().getName()).isEqualTo("STUDENT");
        assertThat(studentUser.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(studentUser.isAccountVerified()).isTrue();
        verify(userRepository).save(studentUser);
        verify(notificationService).sendAlumniVerificationResultNotification(adminUser, studentUser, upgradeReq, false);
    }

    @Test
    @DisplayName("UTCID08 - DTO Validation: Kiểm tra thông báo lỗi tiếng Việt của SubmitVerificationRequestDto")
    void utcid08_dtoValidation_vietnameseErrorMessages() {
        SubmitVerificationRequestDto invalidDto = SubmitVerificationRequestDto.builder()
                .proofUrl("")
                .graduationYear(2000)
                .majorId(null)
                .build();

        Set<ConstraintViolation<SubmitVerificationRequestDto>> violations = validator.validate(invalidDto);

        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .contains(
                        "Vui lòng tải lên tài liệu minh chứng tốt nghiệp",
                        "Năm tốt nghiệp phải từ năm 2006 trở đi",
                        "Vui lòng chọn chuyên ngành tốt nghiệp"
                );
    }

    @Test
    @DisplayName("UTCID09 - Controller HTTP API: GET /verifications/me & POST /verifications/upgrade-alumni (200, 201, 400)")
    void utcid09_controllerHttpApi_endpointsVerification() throws Exception {
        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(new VerificationController(verificationService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("student15@fpt.edu.vn", null, Collections.emptyList())
        );

        when(userRepository.findByEmail("student15@fpt.edu.vn")).thenReturn(Optional.of(studentUser));
        when(userProfileRepository.findById(15L)).thenReturn(Optional.of(studentProfile));
        when(verificationRequestRepository.findFirstByUserIdOrderByCreatedAtDesc(15L)).thenReturn(Optional.empty());

        // 1. GET /verifications/me -> 200 OK
        mockMvc.perform(get("/verifications/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.error").value(0))
                .andExpect(jsonPath("$.message").value("Lấy trạng thái xác minh cựu sinh viên thành công!"))
                .andExpect(jsonPath("$.data.status").value("NONE"))
                .andExpect(jsonPath("$.data.currentRole").value("STUDENT"));

        // 2. POST /verifications/upgrade-alumni (Hợp lệ) -> 201 Created
        when(verificationRequestRepository.existsByUserIdAndStatus(15L, VerificationStatus.PENDING)).thenReturn(false);
        when(majorRepository.findById(1L)).thenReturn(Optional.of(seMajor));
        when(verificationRequestRepository.save(any(VerificationRequest.class))).thenAnswer(inv -> {
            VerificationRequest saved = inv.getArgument(0);
            saved.setId(202L);
            saved.setCreatedAt(Instant.now());
            return saved;
        });

        mockMvc.perform(post("/verifications/upgrade-alumni")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"proofUrl\":\"https://pub-xxxx.r2.dev/proofs/degree.pdf\",\"graduationYear\":2026,\"majorId\":1}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.error").value(0))
                .andExpect(jsonPath("$.data.id").value(202))
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        // 3. POST /verifications/upgrade-alumni (Dữ liệu rỗng/sai) -> 400 Bad Request
        mockMvc.perform(post("/verifications/upgrade-alumni")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"proofUrl\":\"\",\"graduationYear\":2000}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value(-1))
                .andExpect(jsonPath("$.message").value("Dữ liệu gửi lên không hợp lệ"))
                .andExpect(jsonPath("$.data.proofUrl").exists())
                .andExpect(jsonPath("$.data.graduationYear").value("Năm tốt nghiệp phải từ năm 2006 trở đi"))
                .andExpect(jsonPath("$.data.majorId").value("Vui lòng chọn chuyên ngành tốt nghiệp"));
    }
}
