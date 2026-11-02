package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.salary.SalaryContributionRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.salary.UpdateSalaryContributionRequest;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryContributionResponse;
import com.alumnect.alumnect_backend.entity.salary.SalaryContribution;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.salary.SalaryMapper;
import com.alumnect.alumnect_backend.service.salary.SalaryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FE-39 Salary Board - Edit & Delete My Data")
public class FE39_SalaryBoardEditDeleteTest {

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

    private static final String ALUMNI_EMAIL = "alumni@fpt.edu.vn";

    private User alumniUser;
    private User otherUser;
    private SalaryContribution contribution9;

    @BeforeEach
    void setUp() {
        Role alumniRole = Role.builder().id(1L).name("ALUMNI").build();

        alumniUser = User.builder()
                .id(10L)
                .email(ALUMNI_EMAIL)
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        otherUser = User.builder()
                .id(11L)
                .email("other@fpt.edu.vn")
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        contribution9 = SalaryContribution.builder()
                .id(9L)
                .user(alumniUser)
                .jobTitle("Junior Developer")
                .grossAmount(new BigDecimal("20000000"))
                .currency("VND")
                .locationCity("Hà Nội")
                .region("Cầu Giấy, Hà Nội")
                .createdAt(Instant.now().minusSeconds(1000))
                .build();
    }

    // ================= Edit Contribution (UTCID01 - UTCID05) =================

    @Test
    @DisplayName("UTCID01 - The alumnus owns contribution 9 -> SalaryContributionResponse; jobTitle and amount updated and saved")
    void utcid01_updateContribution_okUpdated() {
        // Given
        UpdateSalaryContributionRequest request = UpdateSalaryContributionRequest.builder()
                .jobTitle("Senior Developer")
                .grossAmount(new BigDecimal("40000000"))
                .currency("VND")
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.findById(9L)).thenReturn(Optional.of(contribution9));
        when(salaryContributionRepository.save(any(SalaryContribution.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        SalaryContributionResponse response = salaryService.updateContribution(ALUMNI_EMAIL, 9L, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getJobTitle()).isEqualTo("Senior Developer");
        assertThat(response.getGrossAmount()).isEqualByComparingTo("40000000");

        assertThat(contribution9.getJobTitle()).isEqualTo("Senior Developer");
        assertThat(contribution9.getGrossAmount()).isEqualByComparingTo("40000000");
        verify(salaryContributionRepository).save(contribution9);
    }

    @Test
    @DisplayName("UTCID02 - Contribution 9 belongs to another alumnus -> ForbiddenException: Chỉ chính chủ mới được chỉnh sửa lượt đóng góp này")
    void utcid02_updateContrib_forbiddenNotOwner() {
        // Given
        contribution9.setUser(otherUser);
        UpdateSalaryContributionRequest request = UpdateSalaryContributionRequest.builder()
                .jobTitle("Lead Dev")
                .grossAmount(new BigDecimal("50000000"))
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.findById(9L)).thenReturn(Optional.of(contribution9));

        // When + Then
        assertThatThrownBy(() -> salaryService.updateContribution(ALUMNI_EMAIL, 9L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ chính chủ mới được chỉnh sửa lượt đóng góp này");
        verify(salaryContributionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID03 - Contribution 404 does not exist -> ResourceNotFoundException: Không tìm thấy lượt đóng góp với id: 404")
    void utcid03_updateContrib_notFoundId() {
        // Given
        UpdateSalaryContributionRequest request = UpdateSalaryContributionRequest.builder()
                .jobTitle("Dev")
                .grossAmount(new BigDecimal("30000000"))
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.findById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> salaryService.updateContribution(ALUMNI_EMAIL, 404L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy lượt đóng góp với id: 404");
        verify(salaryContributionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID04 - Contribution 9 already has locationCity 'Hà Nội' -> Existing locationCity 'Hà Nội' is kept")
    void utcid04_updateContrib_okKeepLocationCity() {
        // Given
        contribution9.setLocationCity("Hà Nội");
        UpdateSalaryContributionRequest request = UpdateSalaryContributionRequest.builder()
                .jobTitle("Mid Developer")
                .grossAmount(new BigDecimal("30000000"))
                .locationCity(null)
                .region("Quận 1, TP. HCM")
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.findById(9L)).thenReturn(Optional.of(contribution9));
        when(salaryContributionRepository.save(any(SalaryContribution.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        SalaryContributionResponse response = salaryService.updateContribution(ALUMNI_EMAIL, 9L, request);

        // Then
        assertThat(response.getLocationCity()).isEqualTo("Hà Nội");
        assertThat(contribution9.getLocationCity()).isEqualTo("Hà Nội");
        verify(salaryContributionRepository).save(contribution9);
    }

    @Test
    @DisplayName("UTCID05 - currency = 'EURO' (4 letters) -> BadRequestException: Đơn vị tiền tệ phải là mã 3 chữ cái (VD: VND, USD)")
    void utcid05_updateContrib_badRequestCurrency() {
        // Given
        UpdateSalaryContributionRequest request = UpdateSalaryContributionRequest.builder()
                .jobTitle("Dev")
                .grossAmount(new BigDecimal("25000000"))
                .currency("EURO")
                .build();

        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.findById(9L)).thenReturn(Optional.of(contribution9));

        // When + Then
        assertThatThrownBy(() -> salaryService.updateContribution(ALUMNI_EMAIL, 9L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Đơn vị tiền tệ phải là mã 3 chữ cái (VD: VND, USD)");
        verify(salaryContributionRepository, never()).save(any());
    }

    // ================= Delete Contribution (UTCID06 - UTCID08) =================

    @Test
    @DisplayName("UTCID06 - The alumnus owns contribution 9 -> Void; contribution deleted (hard delete)")
    void utcid06_deleteContribution_okHardDelete() {
        // Given
        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.findById(9L)).thenReturn(Optional.of(contribution9));

        // When
        salaryService.deleteContribution(ALUMNI_EMAIL, 9L);

        // Then
        verify(salaryContributionRepository).delete(contribution9);
    }

    @Test
    @DisplayName("UTCID07 - Contribution 9 belongs to another alumnus -> ForbiddenException: Chỉ chính chủ mới được xóa lượt đóng góp này")
    void utcid07_deleteContrib_forbiddenNotOwner() {
        // Given
        contribution9.setUser(otherUser);
        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.findById(9L)).thenReturn(Optional.of(contribution9));

        // When + Then
        assertThatThrownBy(() -> salaryService.deleteContribution(ALUMNI_EMAIL, 9L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ chính chủ mới được xóa lượt đóng góp này");
        verify(salaryContributionRepository, never()).delete(any(SalaryContribution.class));
    }

    @Test
    @DisplayName("UTCID08 - Contribution 404 does not exist -> ResourceNotFoundException: Không tìm thấy lượt đóng góp với id: 404")
    void utcid08_deleteContrib_notFoundId() {
        // Given
        when(userRepository.findByEmail(ALUMNI_EMAIL)).thenReturn(Optional.of(alumniUser));
        when(salaryContributionRepository.findById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> salaryService.deleteContribution(ALUMNI_EMAIL, 404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy lượt đóng góp với id: 404");
        verify(salaryContributionRepository, never()).delete(any(SalaryContribution.class));
    }
}
