package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.user.ExperienceRequest;
import com.alumnect.alumnect_backend.dto.request.user.PromotionRequest;
import com.alumnect.alumnect_backend.dto.response.user.ExperienceResponse;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.user.ExperienceMapper;
import com.alumnect.alumnect_backend.service.user.ExperienceServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-07 Manage Career Timeline.
 * Report sheet : FE-07 (Report5_Unit_Test.xlsx)
 * Functions    : ExperienceServiceImpl.getOwnExperiences(), createExperience(), updateExperience(), deleteExperience(), promoteExperience()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-07 Manage Career Timeline")
class FE07_CareerTimelineTest {

    // ===== Mocks (dependencies) =====
    @Mock UserRepository userRepository;
    @Mock ExperienceRepository experienceRepository;
    @Mock ExperienceMapper experienceMapper;

    // ===== System under test =====
    @InjectMocks ExperienceServiceImpl experienceService;

    // ===== Test data =====
    private static final String EMAIL = "student@fpt.edu.vn";
    private User user;
    private Experience exp1;
    private Experience exp2;

    @BeforeEach
    void setUp() {
        user = User.builder().id(1L).email(EMAIL).build();
        exp1 = Experience.builder().id(1L).user(user).title("Dev").startDate(LocalDate.of(2021, 1, 1)).build();
        exp2 = Experience.builder().id(2L).user(user).title("Senior Dev").startDate(LocalDate.of(2022, 1, 1)).build();
    }

    // ================= getOwnExperiences() =================

    @Test
    @DisplayName("UTCID01 - User has 2 experiences -> returns list of 2 ordered by start date desc")
    void utcid01_getOwnExperiences_ok() {
        // Given
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceRepository.findByUserIdOrderByStartDateDesc(1L)).thenReturn(List.of(exp2, exp1));
        when(experienceMapper.toResponse(exp2)).thenReturn(ExperienceResponse.builder().id(2L).title("Senior Dev").build());
        when(experienceMapper.toResponse(exp1)).thenReturn(ExperienceResponse.builder().id(1L).title("Dev").build());

        // When
        List<ExperienceResponse> responses = experienceService.getOwnExperiences(EMAIL);

        // Then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getTitle()).isEqualTo("Senior Dev");
        assertThat(responses.get(1).getTitle()).isEqualTo("Dev");
    }

    // ================= createExperience() =================

    @Test
    @DisplayName("UTCID02 - isCurrent = true & no previous primary -> saved as primary + current, endDate = null")
    void utcid02_createExperience_okCurrentAutoPrimary() {
        // Given
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Software Engineer")
                .company("FPT")
                .isCurrent(true)
                .startDate(LocalDate.of(2023, 1, 1))
                .build();
        Experience entity = Experience.builder()
                .title("Software Engineer")
                .company("FPT")
                .isCurrent(true)
                .startDate(LocalDate.of(2023, 1, 1))
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceMapper.toEntity(req)).thenReturn(entity);
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(1L)).thenReturn(Optional.empty());
        when(experienceRepository.save(entity)).thenReturn(entity);
        when(experienceMapper.toResponse(entity)).thenReturn(ExperienceResponse.builder().id(10L).isPrimary(true).build());

        // When
        ExperienceResponse response = experienceService.createExperience(EMAIL, req);

        // Then
        assertThat(response.isPrimary()).isTrue();
        assertThat(entity.isCurrent()).isTrue();
        assertThat(entity.isPrimary()).isTrue();
        assertThat(entity.getEndDate()).isNull();
        verify(experienceRepository).save(entity);
    }

    @Test
    @DisplayName("UTCID03 - isCurrent = false with valid start and end dates -> saved as non-primary")
    void utcid03_createExperience_okNonPrimaryPast() {
        // Given
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Intern")
                .company("FPT")
                .isCurrent(false)
                .startDate(LocalDate.of(2020, 1, 1))
                .endDate(LocalDate.of(2021, 1, 1))
                .build();
        Experience entity = Experience.builder()
                .title("Intern")
                .company("FPT")
                .isCurrent(false)
                .startDate(LocalDate.of(2020, 1, 1))
                .endDate(LocalDate.of(2021, 1, 1))
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceMapper.toEntity(req)).thenReturn(entity);
        when(experienceRepository.save(entity)).thenReturn(entity);
        when(experienceMapper.toResponse(entity)).thenReturn(ExperienceResponse.builder().id(11L).isPrimary(false).build());

        // When
        ExperienceResponse response = experienceService.createExperience(EMAIL, req);

        // Then
        assertThat(response.isPrimary()).isFalse();
        assertThat(entity.isPrimary()).isFalse();
        verify(experienceRepository).save(entity);
    }

    @Test
    @DisplayName("UTCID04 - startDate = null -> BadRequestException")
    void utcid04_createExperience_badRequestNullStartDate() {
        // Given
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Intern")
                .company("FPT")
                .startDate(null)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        // When + Then
        assertThatThrownBy(() -> experienceService.createExperience(EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ngày bắt đầu không được để trống");

        verify(experienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID05 - isCurrent = false & endDate = null -> BadRequestException")
    void utcid05_createExperience_badRequestPastNullEndDate() {
        // Given
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Intern")
                .company("FPT")
                .isCurrent(false)
                .startDate(LocalDate.of(2020, 1, 1))
                .endDate(null)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        // When + Then
        assertThatThrownBy(() -> experienceService.createExperience(EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ngày kết thúc không được để trống khi đã kết thúc công việc");

        verify(experienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID06 - endDate < startDate -> BadRequestException")
    void utcid06_createExperience_badRequestEndDateBeforeStart() {
        // Given
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Intern")
                .company("FPT")
                .isCurrent(false)
                .startDate(LocalDate.of(2020, 1, 1))
                .endDate(LocalDate.of(2019, 12, 31))
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        // When + Then
        assertThatThrownBy(() -> experienceService.createExperience(EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ngày kết thúc không được trước ngày bắt đầu");

        verify(experienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID07 - endDate = startDate -> Accepted, experience saved")
    void utcid07_createExperience_okEndDateEqualsStartDate() {
        // Given
        LocalDate sameDate = LocalDate.of(2020, 1, 1);
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Intern")
                .company("FPT")
                .isCurrent(false)
                .startDate(sameDate)
                .endDate(sameDate)
                .build();
        Experience entity = Experience.builder()
                .title("Intern")
                .company("FPT")
                .isCurrent(false)
                .startDate(sameDate)
                .endDate(sameDate)
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceMapper.toEntity(req)).thenReturn(entity);
        when(experienceRepository.save(entity)).thenReturn(entity);
        when(experienceMapper.toResponse(entity)).thenReturn(ExperienceResponse.builder().id(12L).build());

        // When
        ExperienceResponse response = experienceService.createExperience(EMAIL, req);

        // Then
        assertThat(response).isNotNull();
        verify(experienceRepository).save(entity);
    }

    @Test
    @DisplayName("UTCID08 - isPrimary = true & isCurrent = false -> BadRequestException")
    void utcid08_createExperience_badRequestPrimaryNonCurrent() {
        // Given
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Intern")
                .company("FPT")
                .isPrimary(true)
                .isCurrent(false)
                .startDate(LocalDate.of(2020, 1, 1))
                .endDate(LocalDate.of(2021, 1, 1))
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        // When + Then
        assertThatThrownBy(() -> experienceService.createExperience(EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Chỉ kinh nghiệm hiện tại mới được đặt làm chính (primary)");

        verify(experienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID09 - latitude present, longitude null -> BadRequestException")
    void utcid09_createExperience_badRequestLatWithoutLng() {
        // Given
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Dev")
                .company("FPT")
                .isCurrent(true)
                .startDate(LocalDate.of(2020, 1, 1))
                .latitude(BigDecimal.valueOf(10.5))
                .longitude(null)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        // When + Then
        assertThatThrownBy(() -> experienceService.createExperience(EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vĩ độ và kinh độ phải cùng tồn tại hoặc cùng trống");

        verify(experienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID10 - latitude=90, longitude=180 (bounds) -> Accepted")
    void utcid10_createExperience_okLatLongBounds() {
        // Given
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Dev")
                .company("FPT")
                .isCurrent(true)
                .startDate(LocalDate.of(2020, 1, 1))
                .latitude(BigDecimal.valueOf(90))
                .longitude(BigDecimal.valueOf(180))
                .build();
        Experience entity = Experience.builder().isCurrent(true).build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceMapper.toEntity(req)).thenReturn(entity);
        when(experienceRepository.save(entity)).thenReturn(entity);
        when(experienceMapper.toResponse(entity)).thenReturn(ExperienceResponse.builder().id(14L).build());

        // When
        ExperienceResponse response = experienceService.createExperience(EMAIL, req);

        // Then
        assertThat(response).isNotNull();
        verify(experienceRepository).save(entity);
    }

    @Test
    @DisplayName("UTCID11 - latitude=90.1 (above bound) -> BadRequestException")
    void utcid11_createExperience_badRequestLatAbove90() {
        // Given
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Dev")
                .company("FPT")
                .isCurrent(true)
                .startDate(LocalDate.of(2020, 1, 1))
                .latitude(BigDecimal.valueOf(90.1))
                .longitude(BigDecimal.valueOf(100))
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        // When + Then
        assertThatThrownBy(() -> experienceService.createExperience(EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Vĩ độ phải nằm trong khoảng -90 đến 90");

        verify(experienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID12 - longitude=-180.1 (below bound) -> BadRequestException")
    void utcid12_createExperience_badRequestLngBelowMinus180() {
        // Given
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Dev")
                .company("FPT")
                .isCurrent(true)
                .startDate(LocalDate.of(2020, 1, 1))
                .latitude(BigDecimal.valueOf(10))
                .longitude(BigDecimal.valueOf(-180.1))
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        // When + Then
        assertThatThrownBy(() -> experienceService.createExperience(EMAIL, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Kinh độ phải nằm trong khoảng -180 đến 180");

        verify(experienceRepository, never()).save(any());
    }

    // ================= updateExperience() =================

    @Test
    @DisplayName("UTCID13 - id = 5 belongs to user -> updated & saved, endDate cleared for current")
    void utcid13_updateExperience_ok() {
        // Given
        Experience existing = Experience.builder().id(5L).user(user).isCurrent(false).endDate(LocalDate.of(2022, 1, 1)).build();
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Lead Developer")
                .company("FPT")
                .isCurrent(true)
                .startDate(LocalDate.of(2021, 1, 1))
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(existing));
        when(experienceRepository.save(existing)).thenReturn(existing);
        when(experienceMapper.toResponse(existing)).thenReturn(ExperienceResponse.builder().id(5L).title("Lead Developer").build());

        // When
        ExperienceResponse response = experienceService.updateExperience(EMAIL, 5L, req);

        // Then
        assertThat(response.getTitle()).isEqualTo("Lead Developer");
        verify(experienceMapper).updateEntityFromRequest(req, existing);
        verify(experienceRepository).save(existing);
    }

    @Test
    @DisplayName("UTCID14 - id = 404 does not exist -> ResourceNotFoundException")
    void utcid14_updateExperience_notFound() {
        // Given
        ExperienceRequest req = ExperienceRequest.builder()
                .title("Dev")
                .company("FPT")
                .startDate(LocalDate.of(2021, 1, 1))
                .isCurrent(true)
                .build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceRepository.findByIdAndUserId(404L, 1L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> experienceService.updateExperience(EMAIL, 404L, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy kinh nghiệm làm việc với ID: 404");

        verify(experienceRepository, never()).save(any());
    }

    // ================= deleteExperience() =================

    @Test
    @DisplayName("UTCID15 - Primary exp id 5 deleted -> latest current promoted to primary")
    void utcid15_deleteExperience_okPromoteNext() {
        // Given
        Experience primaryExp = Experience.builder().id(5L).user(user).isPrimary(true).build();
        Experience nextCurrent = Experience.builder().id(6L).user(user).isCurrent(true).startDate(LocalDate.of(2022, 1, 1)).build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(primaryExp));
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(1L)).thenReturn(Optional.empty());
        when(experienceRepository.findByUserIdAndIsCurrentTrue(1L)).thenReturn(List.of(nextCurrent));

        // When
        experienceService.deleteExperience(EMAIL, 5L);

        // Then
        verify(experienceRepository).delete(primaryExp);
        assertThat(nextCurrent.isPrimary()).isTrue();
        verify(experienceRepository).save(nextCurrent);
    }

    @Test
    @DisplayName("UTCID16 - Exp id 404 does not exist -> ResourceNotFoundException")
    void utcid16_deleteExperience_notFound() {
        // Given
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceRepository.findByIdAndUserId(404L, 1L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> experienceService.deleteExperience(EMAIL, 404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy kinh nghiệm làm việc với ID: 404");

        verify(experienceRepository, never()).delete(any());
    }

    // ================= promoteExperience() =================

    @Test
    @DisplayName("UTCID17 - Exp id 5 promoted -> old ended, new becomes primary")
    void utcid17_promoteExperience_ok() {
        // Given
        Experience oldExp = Experience.builder()
                .id(5L)
                .user(user)
                .title("Senior Dev")
                .company("FPT")
                .isCurrent(true)
                .isPrimary(true)
                .startDate(LocalDate.of(2022, 1, 1))
                .build();
        PromotionRequest req = PromotionRequest.builder()
                .newTitle("Tech Lead")
                .newStartDate(LocalDate.of(2024, 1, 1))
                .reuseLocation(true)
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(oldExp));
        when(experienceRepository.save(any(Experience.class))).thenAnswer(inv -> inv.getArgument(0));
        when(experienceMapper.toResponse(any(Experience.class)))
                .thenReturn(ExperienceResponse.builder().title("Tech Lead").isPrimary(true).build());

        // When
        ExperienceResponse response = experienceService.promoteExperience(EMAIL, 5L, req);

        // Then
        assertThat(response.getTitle()).isEqualTo("Tech Lead");
        assertThat(oldExp.isCurrent()).isFalse();
        assertThat(oldExp.isPrimary()).isFalse();
        assertThat(oldExp.getEndDate()).isEqualTo(LocalDate.of(2023, 12, 31));

        ArgumentCaptor<Experience> captor = ArgumentCaptor.forClass(Experience.class);
        verify(experienceRepository).save(captor.capture());
        Experience newSaved = captor.getValue();
        assertThat(newSaved.getTitle()).isEqualTo("Tech Lead");
        assertThat(newSaved.isPrimary()).isTrue();
        assertThat(newSaved.isCurrent()).isTrue();
    }

    @Test
    @DisplayName("UTCID18 - Exp id 5 already ended -> BadRequestException")
    void utcid18_promoteExperience_badRequestEnded() {
        // Given
        Experience endedExp = Experience.builder()
                .id(5L)
                .user(user)
                .isCurrent(false)
                .startDate(LocalDate.of(2020, 1, 1))
                .endDate(LocalDate.of(2021, 1, 1))
                .build();
        PromotionRequest req = PromotionRequest.builder()
                .newTitle("Tech Lead")
                .newStartDate(LocalDate.of(2024, 1, 1))
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(endedExp));

        // When + Then
        assertThatThrownBy(() -> experienceService.promoteExperience(EMAIL, 5L, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Không thể thăng chức cho kinh nghiệm làm việc đã kết thúc");

        verify(experienceRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID19 - newStartDate <= oldStartDate -> BadRequestException")
    void utcid19_promoteExperience_badRequestStartDateNotAfter() {
        // Given
        Experience currentExp = Experience.builder()
                .id(5L)
                .user(user)
                .isCurrent(true)
                .startDate(LocalDate.of(2022, 1, 1))
                .build();
        PromotionRequest req = PromotionRequest.builder()
                .newTitle("Tech Lead")
                .newStartDate(LocalDate.of(2022, 1, 1))
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(experienceRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(currentExp));

        // When + Then
        assertThatThrownBy(() -> experienceService.promoteExperience(EMAIL, 5L, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ngày bắt đầu vai trò mới phải sau ngày bắt đầu vai trò cũ");

        verify(experienceRepository, never()).save(any());
    }
}
