package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.salary.SalaryContributionRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.salary.CreateSalaryContributionRequest;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryContributionResponse;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.salary.SalaryContribution;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.salary.SalaryMapper;
import com.alumnect.alumnect_backend.service.salary.SalaryServiceImpl;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FE-38 Salary Board - Contribute & View Recent Data")
public class FE38_SalaryBoardContributeTest {

    @Mock
    private SalaryContributionRepository salaryContributionRepository;

    @Mock
    private IndustryRepository industryRepository;

    @Mock
    private UserRepository userRepository;

    @Spy
    private SalaryMapper salaryMapper = new SalaryMapper();

    @InjectMocks
    private SalaryServiceImpl salaryService;

    private Validator validator;

    private static final String ALUMNI_EMAIL = "alumni@fpt.edu.vn";
    private static final String STUDENT_EMAIL = "student@fpt.edu.vn";
    private static final String GHOST_EMAIL = "ghost@fpt.edu.vn";

    private User alumniUser;
    private User studentUser;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

        Role alumniRole = Role.builder().id(1L).name("ALUMNI").build();
        Role studentRole = Role.builder().id(2L).name("STUDENT").build();

        alumniUser = User.builder()
                .id(10L)
                .email(ALUMNI_EMAIL)
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        studentUser = User.builder()
                .id(20L)
                .email(STUDENT_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();
    }

    // ================= Contribute Salary (UTCID01 - UTCID14) =================

    @Test
    @DisplayName("UTCID01 - ALUMNI account exists -> SalaryContribution saved with trimmed jobTitle and default currency VND")
    void utcid01_createContribution_okTrimmedVnd() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("  Backend Developer  ")
                .grossAmount(new BigDecimal("25000000"))
                .currency(null)
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.save(any(SalaryContribution.class))).thenAnswer(inv -> {
            SalaryContribution c = inv.getArgument(0);
            c.setId(100L);
            c.setCreatedAt(Instant.now());
            return c;
        });

        // When
        SalaryContributionResponse response = salaryService.createContribution(ALUMNI_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getJobTitle()).isEqualTo("Backend Developer");
        assertThat(response.getCurrency()).isEqualTo("VND");

        ArgumentCaptor<SalaryContribution> captor = ArgumentCaptor.forClass(SalaryContribution.class);
        verify(salaryContributionRepository).save(captor.capture());
        SalaryContribution saved = captor.getValue();
        assertThat(saved.getJobTitle()).isEqualTo("Backend Developer");
        assertThat(saved.getCurrency()).isEqualTo("VND");
    }

    @Test
    @DisplayName("UTCID02 - currency = ' usd ' (lower-case with spaces) -> Currency normalised to 'USD'")
    void utcid02_createContribution_okNormaliseUsd() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Frontend Dev")
                .grossAmount(new BigDecimal("1500"))
                .currency(" usd ")
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.save(any(SalaryContribution.class))).thenAnswer(inv -> {
            SalaryContribution c = inv.getArgument(0);
            c.setId(101L);
            c.setCreatedAt(Instant.now());
            return c;
        });

        // When
        SalaryContributionResponse response = salaryService.createContribution(ALUMNI_EMAIL, request);

        // Then
        assertThat(response.getCurrency()).isEqualTo("USD");

        ArgumentCaptor<SalaryContribution> captor = ArgumentCaptor.forClass(SalaryContribution.class);
        verify(salaryContributionRepository).save(captor.capture());
        assertThat(captor.getValue().getCurrency()).isEqualTo("USD");
    }

    @Test
    @DisplayName("UTCID03 - industryId = 4, company, region -> Industry linked, company trimmed, locationCity derived from region = 'Hà Nội'")
    void utcid03_createContribution_okDeriveCity() {
        // Given
        Industry industry4 = Industry.builder().id(4L).name("Công nghệ thông tin").build();
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .industryId(4L)
                .jobTitle("DevOps Engineer")
                .company("  FPT  ")
                .region("Cầu Giấy, Hà Nội")
                .locationCity(null)
                .yearsExperience((short) 3)
                .grossAmount(new BigDecimal("35000000"))
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(industryRepository.findById(4L)).thenReturn(Optional.of(industry4));
        when(salaryContributionRepository.save(any(SalaryContribution.class))).thenAnswer(inv -> {
            SalaryContribution c = inv.getArgument(0);
            c.setId(102L);
            c.setCreatedAt(Instant.now());
            return c;
        });

        // When
        SalaryContributionResponse response = salaryService.createContribution(ALUMNI_EMAIL, request);

        // Then
        assertThat(response.getIndustryId()).isEqualTo(4L);
        assertThat(response.getIndustry()).isEqualTo("Công nghệ thông tin");
        assertThat(response.getCompany()).isEqualTo("FPT");
        assertThat(response.getLocationCity()).isEqualTo("Hà Nội");

        ArgumentCaptor<SalaryContribution> captor = ArgumentCaptor.forClass(SalaryContribution.class);
        verify(salaryContributionRepository).save(captor.capture());
        SalaryContribution saved = captor.getValue();
        assertThat(saved.getIndustry()).isEqualTo(industry4);
        assertThat(saved.getCompany()).isEqualTo("FPT");
        assertThat(saved.getLocationCity()).isEqualTo("Hà Nội");
    }

    @Test
    @DisplayName("UTCID04 - region = 'Quận 1, TP. HCM', locationCity = 'Đà Nẵng' (explicit) -> Explicit locationCity is kept")
    void utcid04_createContribution_okExplicitCity() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Solution Architect")
                .grossAmount(new BigDecimal("50000000"))
                .region("Quận 1, TP. HCM")
                .locationCity("Đà Nẵng")
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.save(any(SalaryContribution.class))).thenAnswer(inv -> {
            SalaryContribution c = inv.getArgument(0);
            c.setId(103L);
            c.setCreatedAt(Instant.now());
            return c;
        });

        // When
        SalaryContributionResponse response = salaryService.createContribution(ALUMNI_EMAIL, request);

        // Then
        assertThat(response.getLocationCity()).isEqualTo("Đà Nẵng");

        ArgumentCaptor<SalaryContribution> captor = ArgumentCaptor.forClass(SalaryContribution.class);
        verify(salaryContributionRepository).save(captor.capture());
        assertThat(captor.getValue().getLocationCity()).isEqualTo("Đà Nẵng");
    }

    @Test
    @DisplayName("UTCID05 - region = 'Quận 1, TP. HCM' (HCMC abbreviation) -> locationCity = 'Thành Phố Hồ Chí Minh'")
    void utcid05_createContribution_okHcmcCity() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Mobile Developer")
                .grossAmount(new BigDecimal("22000000"))
                .region("Quận 1, TP. HCM")
                .locationCity(null)
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.save(any(SalaryContribution.class))).thenAnswer(inv -> {
            SalaryContribution c = inv.getArgument(0);
            c.setId(104L);
            c.setCreatedAt(Instant.now());
            return c;
        });

        // When
        SalaryContributionResponse response = salaryService.createContribution(ALUMNI_EMAIL, request);

        // Then
        assertThat(response.getLocationCity()).isEqualTo("Thành Phố Hồ Chí Minh");

        ArgumentCaptor<SalaryContribution> captor = ArgumentCaptor.forClass(SalaryContribution.class);
        verify(salaryContributionRepository).save(captor.capture());
        assertThat(captor.getValue().getLocationCity()).isEqualTo("Thành Phố Hồ Chí Minh");
    }

    @Test
    @DisplayName("UTCID06 - region = 'Đà Lạt, Tỉnh Lâm Đồng' -> City taken from last comma part with prefix removed: 'Lâm Đồng'")
    void utcid06_createContribution_okPrefixClean() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Data Analyst")
                .grossAmount(new BigDecimal("18000000"))
                .region("Đà Lạt, Tỉnh Lâm Đồng")
                .locationCity(null)
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.save(any(SalaryContribution.class))).thenAnswer(inv -> {
            SalaryContribution c = inv.getArgument(0);
            c.setId(105L);
            c.setCreatedAt(Instant.now());
            return c;
        });

        // When
        SalaryContributionResponse response = salaryService.createContribution(ALUMNI_EMAIL, request);

        // Then
        assertThat(response.getLocationCity()).isEqualTo("Lâm Đồng");

        ArgumentCaptor<SalaryContribution> captor = ArgumentCaptor.forClass(SalaryContribution.class);
        verify(salaryContributionRepository).save(captor.capture());
        assertThat(captor.getValue().getLocationCity()).isEqualTo("Lâm Đồng");
    }

    @Test
    @DisplayName("UTCID07 - company = '   ', region = '' (blank optional fields) -> Blank optional fields stored as null")
    void utcid07_createContribution_okBlankAsNull() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("QA Engineer")
                .grossAmount(new BigDecimal("15000000"))
                .company("   ")
                .region("")
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.save(any(SalaryContribution.class))).thenAnswer(inv -> {
            SalaryContribution c = inv.getArgument(0);
            c.setId(106L);
            c.setCreatedAt(Instant.now());
            return c;
        });

        // When
        salaryService.createContribution(ALUMNI_EMAIL, request);

        // Then
        ArgumentCaptor<SalaryContribution> captor = ArgumentCaptor.forClass(SalaryContribution.class);
        verify(salaryContributionRepository).save(captor.capture());
        SalaryContribution saved = captor.getValue();
        assertThat(saved.getCompany()).isNull();
        assertThat(saved.getRegion()).isNull();
    }

    @Test
    @DisplayName("UTCID08 - Account role is STUDENT -> ForbiddenException: Chỉ cựu sinh viên mới được đóng góp dữ liệu lương")
    void utcid08_createContrib_forbiddenStudent() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Intern")
                .grossAmount(new BigDecimal("5000000"))
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));

        // When + Then
        assertThatThrownBy(() -> salaryService.createContribution(STUDENT_EMAIL, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ cựu sinh viên mới được đóng góp dữ liệu lương");
        verify(salaryContributionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID09 - No account for email -> ResourceNotFoundException: Không tìm thấy tài khoản người dùng")
    void utcid09_createContribution_notFoundUser() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Developer")
                .grossAmount(new BigDecimal("20000000"))
                .build();

        when(userRepository.findByEmail(GHOST_EMAIL)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> salaryService.createContribution(GHOST_EMAIL, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng");
        verify(salaryContributionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID10 - Industry 99 does not exist -> BadRequestException: Ngành nghề không tồn tại")
    void utcid10_createContribution_badReqIndustry() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .industryId(99L)
                .jobTitle("Developer")
                .grossAmount(new BigDecimal("20000000"))
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(industryRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> salaryService.createContribution(ALUMNI_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ngành nghề không tồn tại");
        verify(salaryContributionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID11 - currency = 'US' (2 letters) -> BadRequestException: Đơn vị tiền tệ phải là mã 3 chữ cái (VD: VND, USD)")
    void utcid11_createContrib_badReqCurrShort() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Developer")
                .grossAmount(new BigDecimal("20000000"))
                .currency("US")
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));

        // When + Then
        assertThatThrownBy(() -> salaryService.createContribution(ALUMNI_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Đơn vị tiền tệ phải là mã 3 chữ cái (VD: VND, USD)");
        verify(salaryContributionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID12 - currency = 'USDT' (4 letters) -> BadRequestException: Đơn vị tiền tệ phải là mã 3 chữ cái (VD: VND, USD)")
    void utcid12_createContrib_badReqCurrLong() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Developer")
                .grossAmount(new BigDecimal("20000000"))
                .currency("USDT")
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));

        // When + Then
        assertThatThrownBy(() -> salaryService.createContribution(ALUMNI_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Đơn vị tiền tệ phải là mã 3 chữ cái (VD: VND, USD)");
        verify(salaryContributionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID13 - currency = '   ' (blank) -> Blank currency falls back to VND")
    void utcid13_createContribution_okFallbackVnd() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Developer")
                .grossAmount(new BigDecimal("20000000"))
                .currency("   ")
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.save(any(SalaryContribution.class))).thenAnswer(inv -> {
            SalaryContribution c = inv.getArgument(0);
            c.setId(107L);
            c.setCreatedAt(Instant.now());
            return c;
        });

        // When
        SalaryContributionResponse response = salaryService.createContribution(ALUMNI_EMAIL, request);

        // Then
        assertThat(response.getCurrency()).isEqualTo("VND");

        ArgumentCaptor<SalaryContribution> captor = ArgumentCaptor.forClass(SalaryContribution.class);
        verify(salaryContributionRepository).save(captor.capture());
        assertThat(captor.getValue().getCurrency()).isEqualTo("VND");
    }

    @Test
    @DisplayName("UTCID14 - Database save fails -> RuntimeException: Lỗi hệ thống: Không thể lưu dữ liệu lương")
    void utcid14_createContrib_exceptionSaveFail() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Developer")
                .grossAmount(new BigDecimal("20000000"))
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.save(any(SalaryContribution.class))).thenThrow(new RuntimeException("DB Connection failure"));

        // When + Then
        assertThatThrownBy(() -> salaryService.createContribution(ALUMNI_EMAIL, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Lỗi hệ thống: Không thể lưu dữ liệu lương");
    }

    // ================= DTO Validation (UTCID15 - UTCID22) =================

    @Test
    @DisplayName("UTCID15 - grossAmount = 0.01 (smallest allowed) -> No constraint violation")
    void utcid15_createContrib_okMinGrossAmount() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Tester")
                .grossAmount(new BigDecimal("0.01"))
                .build();

        // When
        Set<ConstraintViolation<CreateSalaryContributionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("UTCID16 - grossAmount = 0.00 -> ConstraintViolation: Mức lương phải lớn hơn 0")
    void utcid16_createContrib_invalidZeroGross() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Tester")
                .grossAmount(new BigDecimal("0.00"))
                .build();

        // When
        Set<ConstraintViolation<CreateSalaryContributionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).anyMatch(v -> v.getMessage().equals("Mức lương phải lớn hơn 0"));
    }

    @Test
    @DisplayName("UTCID17 - grossAmount = 1.234 (3 decimal places) -> ConstraintViolation: Mức lương không hợp lệ")
    void utcid17_createContrib_invalidDecimals() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Tester")
                .grossAmount(new BigDecimal("1.234"))
                .build();

        // When
        Set<ConstraintViolation<CreateSalaryContributionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).anyMatch(v -> v.getMessage().equals("Mức lương không hợp lệ"));
    }

    @Test
    @DisplayName("UTCID18 - grossAmount = null -> ConstraintViolation: Mức lương không được để trống")
    void utcid18_createContrib_invalidNullGross() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("Tester")
                .grossAmount(null)
                .build();

        // When
        Set<ConstraintViolation<CreateSalaryContributionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).anyMatch(v -> v.getMessage().equals("Mức lương không được để trống"));
    }

    @Test
    @DisplayName("UTCID19 - yearsExperience = 0 and 60 (both bounds) -> No constraint violation")
    void utcid19_createContrib_okYearsExpBounds() {
        // Given
        CreateSalaryContributionRequest reqMin = CreateSalaryContributionRequest.builder()
                .jobTitle("Fresher")
                .grossAmount(new BigDecimal("10000000"))
                .yearsExperience((short) 0)
                .build();

        CreateSalaryContributionRequest reqMax = CreateSalaryContributionRequest.builder()
                .jobTitle("Senior")
                .grossAmount(new BigDecimal("10000000"))
                .yearsExperience((short) 60)
                .build();

        // When
        Set<ConstraintViolation<CreateSalaryContributionRequest>> violationsMin = validator.validate(reqMin);
        Set<ConstraintViolation<CreateSalaryContributionRequest>> violationsMax = validator.validate(reqMax);

        // Then
        assertThat(violationsMin).isEmpty();
        assertThat(violationsMax).isEmpty();
    }

    @Test
    @DisplayName("UTCID20 - yearsExperience = -1 and 61 (outside bounds) -> ConstraintViolations")
    void utcid20_createContrib_invalidYearsExp() {
        // Given
        CreateSalaryContributionRequest reqNeg = CreateSalaryContributionRequest.builder()
                .jobTitle("Dev")
                .grossAmount(new BigDecimal("10000000"))
                .yearsExperience((short) -1)
                .build();

        CreateSalaryContributionRequest reqOver = CreateSalaryContributionRequest.builder()
                .jobTitle("Dev")
                .grossAmount(new BigDecimal("10000000"))
                .yearsExperience((short) 61)
                .build();

        // When
        Set<ConstraintViolation<CreateSalaryContributionRequest>> violationsNeg = validator.validate(reqNeg);
        Set<ConstraintViolation<CreateSalaryContributionRequest>> violationsOver = validator.validate(reqOver);

        // Then
        assertThat(violationsNeg).anyMatch(v -> v.getMessage().equals("Số năm kinh nghiệm không được âm"));
        assertThat(violationsOver).anyMatch(v -> v.getMessage().equals("Số năm kinh nghiệm không hợp lệ"));
    }

    @Test
    @DisplayName("UTCID21 - jobTitle length = 150 (maximum) -> No constraint violation")
    void utcid21_createContrib_okMaxJobTitle() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("a".repeat(150))
                .grossAmount(new BigDecimal("10000000"))
                .build();

        // When
        Set<ConstraintViolation<CreateSalaryContributionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("UTCID22 - jobTitle length = 151 -> ConstraintViolation: Chức danh công việc không được vượt quá 150 ký tự")
    void utcid22_createContrib_invalidJobTitle() {
        // Given
        CreateSalaryContributionRequest request = CreateSalaryContributionRequest.builder()
                .jobTitle("a".repeat(151))
                .grossAmount(new BigDecimal("10000000"))
                .build();

        // When
        Set<ConstraintViolation<CreateSalaryContributionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).anyMatch(v -> v.getMessage().equals("Chức danh công việc không được vượt quá 150 ký tự"));
    }

    // ================= View Contributions (UTCID23 - UTCID24) =================

    @Test
    @DisplayName("UTCID23 - The alumnus has 2 contributions -> List of 2 SalaryContributionResponse (newest first, only own data)")
    void utcid23_getMyContributions_okTwoItems() {
        // Given
        SalaryContribution c1 = SalaryContribution.builder()
                .id(1L)
                .user(alumniUser)
                .jobTitle("Junior Dev")
                .grossAmount(new BigDecimal("15000000"))
                .currency("VND")
                .createdAt(Instant.now().minusSeconds(100))
                .build();

        SalaryContribution c2 = SalaryContribution.builder()
                .id(2L)
                .user(alumniUser)
                .jobTitle("Mid Dev")
                .grossAmount(new BigDecimal("25000000"))
                .currency("VND")
                .createdAt(Instant.now().minusSeconds(50))
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.findByUser_IdOrderByCreatedAtDesc(alumniUser.getId())).thenReturn(List.of(c2, c1));

        // When
        List<SalaryContributionResponse> responses = salaryService.getMyContributions(ALUMNI_EMAIL);

        // Then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getId()).isEqualTo("2");
        assertThat(responses.get(0).getJobTitle()).isEqualTo("Mid Dev");
        assertThat(responses.get(1).getId()).isEqualTo("1");
        assertThat(responses.get(1).getJobTitle()).isEqualTo("Junior Dev");
    }

    @Test
    @DisplayName("UTCID24 - email = ghost@fpt.edu.vn -> ResourceNotFoundException: Không tìm thấy tài khoản người dùng")
    void utcid24_getMyContributions_notFoundUser() {
        // Given
        when(userRepository.findByEmail(GHOST_EMAIL)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> salaryService.getMyContributions(GHOST_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng");
        verify(salaryContributionRepository, never()).findByUser_IdOrderByCreatedAtDesc(any());
    }
}
