package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.VerificationStatus;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.verification.VerificationRequestRepository;
import com.alumnect.alumnect_backend.dto.response.admin.AdminDashboardSummaryDto;
import com.alumnect.alumnect_backend.dto.response.admin.DayRegistrationStatDto;
import com.alumnect.alumnect_backend.service.admin.AdminDashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * FE-12_Admin Overview Dashboard & Operations.
 * Report sheet : FE-12 (Report5_Unit_Test.xlsx)
 * Functions    : AdminDashboardServiceImpl.getDashboardSummary()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-12 Admin Overview Dashboard & Operations")
class FE12_AdminDashboardTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private VerificationRequestRepository verificationRequestRepository;

    @InjectMocks
    private AdminDashboardServiceImpl adminDashboardService;

    private final ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @BeforeEach
    void setUp() {
        // default empty responses for chart queries
        when(userRepository.countRegistrationsByDayInRange(any(), any())).thenReturn(Collections.emptyList());
        when(userRepository.countRegistrationsByMonthInRange(any(), any())).thenReturn(Collections.emptyList());
        when(userRepository.countRegistrationsByYear()).thenReturn(Collections.emptyList());
    }

    @Test
    @DisplayName("UTCID01 - getDashboardSummary() -> KPI counters match repository counts")
    void utcid01_getDashboardSummary_kpisMatch() {
        // Given
        when(userRepository.count()).thenReturn(100L);
        when(userRepository.countByRoleName("STUDENT")).thenReturn(60L);
        when(userRepository.countByRoleName("ALUMNI")).thenReturn(35L);
        when(userRepository.countByRoleName("ADMIN")).thenReturn(5L);
        when(userRepository.countByAccountStatus(AccountStatus.ACTIVE)).thenReturn(90L);
        when(userRepository.countByAccountStatus(AccountStatus.LOCKED)).thenReturn(4L);
        when(verificationRequestRepository.countByStatus(VerificationStatus.PENDING)).thenReturn(7L);

        // When
        AdminDashboardSummaryDto result = adminDashboardService.getDashboardSummary();

        // Then
        assertThat(result.getTotalUsers()).isEqualTo(100L);
        assertThat(result.getTotalStudents()).isEqualTo(60L);
        assertThat(result.getTotalAlumni()).isEqualTo(35L);
        assertThat(result.getTotalAdmins()).isEqualTo(5L);
        assertThat(result.getActiveUsers()).isEqualTo(90L);
        assertThat(result.getLockedUsers()).isEqualTo(4L);
        assertThat(result.getPendingVerifications()).isEqualTo(7L);
    }

    @Test
    @DisplayName("UTCID02 - No registrations in last 7 days -> 7 entries each with count 0")
    void utcid02_getDashboardSummary_noRegistrationsLast7Days() {
        // Given
        LocalDate today = LocalDate.now(zone);
        when(userRepository.count()).thenReturn(10L);

        // When
        AdminDashboardSummaryDto result = adminDashboardService.getDashboardSummary();

        // Then
        List<DayRegistrationStatDto> trend = result.getRegistrationsLast7Days();
        assertThat(trend).hasSize(7);
        assertThat(trend.get(0).getDate()).isEqualTo(today.minusDays(6).format(formatter));
        assertThat(trend.get(6).getDate()).isEqualTo(today.format(formatter));
        for (DayRegistrationStatDto stat : trend) {
            assertThat(stat.getCount()).isEqualTo(0L);
        }
    }

    @Test
    @DisplayName("UTCID03 - Registrations for today (sql.Date) and yesterday (LocalDate) mapped correctly")
    void utcid03_getDashboardSummary_sqlDateAndLocalDateMapped() {
        // Given
        LocalDate today = LocalDate.now(zone);
        LocalDate yesterday = today.minusDays(1);
        java.sql.Date sqlDateToday = java.sql.Date.valueOf(today);

        List<Object[]> rawStats = List.of(
                new Object[]{sqlDateToday, 3L},
                new Object[]{yesterday, 2L}
        );
        when(userRepository.countRegistrationsByDayInRange(any(), any())).thenReturn(rawStats);

        // When
        AdminDashboardSummaryDto result = adminDashboardService.getDashboardSummary();

        // Then
        List<DayRegistrationStatDto> trend = result.getRegistrationsLast7Days();
        assertThat(trend).hasSize(7);
        assertThat(trend.get(6).getCount()).isEqualTo(3L);
        assertThat(trend.get(5).getCount()).isEqualTo(2L);
        for (int i = 0; i < 5; i++) {
            assertThat(trend.get(i).getCount()).isEqualTo(0L);
        }
    }

    @Test
    @DisplayName("UTCID04 - String date mapped and null-date row ignored")
    void utcid04_getDashboardSummary_stringDateAndNullDateRow() {
        // Given
        LocalDate today = LocalDate.now(zone);
        String todayStr = today.format(formatter);

        List<Object[]> rawStats = List.of(
                new Object[]{todayStr, 4L},
                new Object[]{null, 10L}
        );
        when(userRepository.countRegistrationsByDayInRange(any(), any())).thenReturn(rawStats);

        // When
        AdminDashboardSummaryDto result = adminDashboardService.getDashboardSummary();

        // Then
        List<DayRegistrationStatDto> trend = result.getRegistrationsLast7Days();
        assertThat(trend.get(6).getCount()).isEqualTo(4L);
    }

    @Test
    @DisplayName("UTCID05 - No registrations by month -> exactly 12 months with count 0")
    void utcid05_getDashboardSummary_noRegistrationsByMonth() {
        // Given - default setUp returns empty list for countRegistrationsByMonthInRange

        // When
        AdminDashboardSummaryDto result = adminDashboardService.getDashboardSummary();

        // Then
        List<DayRegistrationStatDto> months = result.getRegistrationsByMonth();
        assertThat(months).hasSize(12);
        for (int i = 1; i <= 12; i++) {
            assertThat(months.get(i - 1).getDate()).isEqualTo("Tháng " + i);
            assertThat(months.get(i - 1).getCount()).isEqualTo(0L);
        }
    }

    @Test
    @DisplayName("UTCID06 - Registrations in month 3 and 12 mapped, other months 0")
    void utcid06_getDashboardSummary_specificMonthsMapped() {
        // Given
        List<Object[]> rawMonthStats = List.of(
                new Object[]{3, 8L},
                new Object[]{12, 5L}
        );
        when(userRepository.countRegistrationsByMonthInRange(any(), any())).thenReturn(rawMonthStats);

        // When
        AdminDashboardSummaryDto result = adminDashboardService.getDashboardSummary();

        // Then
        List<DayRegistrationStatDto> months = result.getRegistrationsByMonth();
        assertThat(months).hasSize(12);
        assertThat(months.get(2).getDate()).isEqualTo("Tháng 3");
        assertThat(months.get(2).getCount()).isEqualTo(8L);
        assertThat(months.get(11).getDate()).isEqualTo("Tháng 12");
        assertThat(months.get(11).getCount()).isEqualTo(5L);
        assertThat(months.get(0).getCount()).isEqualTo(0L);
        assertThat(months.get(1).getCount()).isEqualTo(0L);
    }

    @Test
    @DisplayName("UTCID07 - Registrations per year mapped -> 2024: 40, 2025: 60")
    void utcid07_getDashboardSummary_yearlyRegistrationsMapped() {
        // Given
        List<Object[]> rawYearStats = List.of(
                new Object[]{2024, 40L},
                new Object[]{2025, 60L}
        );
        when(userRepository.countRegistrationsByYear()).thenReturn(rawYearStats);

        // When
        AdminDashboardSummaryDto result = adminDashboardService.getDashboardSummary();

        // Then
        List<DayRegistrationStatDto> years = result.getRegistrationsByYear();
        assertThat(years).hasSize(2);
        assertThat(years.get(0).getDate()).isEqualTo("Năm 2024");
        assertThat(years.get(0).getCount()).isEqualTo(40L);
        assertThat(years.get(1).getDate()).isEqualTo("Năm 2025");
        assertThat(years.get(1).getCount()).isEqualTo(60L);
    }

    @Test
    @DisplayName("UTCID08 - Empty yearly rows fallback to current year with totalUsers count")
    void utcid08_getDashboardSummary_fallbackCurrentYearWhenEmpty() {
        // Given
        when(userRepository.count()).thenReturn(12L);
        LocalDate today = LocalDate.now(zone);

        // When
        AdminDashboardSummaryDto result = adminDashboardService.getDashboardSummary();

        // Then
        List<DayRegistrationStatDto> years = result.getRegistrationsByYear();
        assertThat(years).hasSize(1);
        assertThat(years.get(0).getDate()).isEqualTo("Năm " + today.getYear());
        assertThat(years.get(0).getCount()).isEqualTo(12L);
    }

    @Test
    @DisplayName("UTCID09 - Empty database -> all KPIs 0 and trend lists have 7 / 12 / 1 entries")
    void utcid09_getDashboardSummary_emptyDatabaseAllZero() {
        // Given
        when(userRepository.count()).thenReturn(0L);
        when(userRepository.countByRoleName("STUDENT")).thenReturn(0L);
        when(userRepository.countByRoleName("ALUMNI")).thenReturn(0L);
        when(userRepository.countByRoleName("ADMIN")).thenReturn(0L);
        when(userRepository.countByAccountStatus(AccountStatus.ACTIVE)).thenReturn(0L);
        when(userRepository.countByAccountStatus(AccountStatus.LOCKED)).thenReturn(0L);
        when(verificationRequestRepository.countByStatus(VerificationStatus.PENDING)).thenReturn(0L);

        // When
        AdminDashboardSummaryDto result = adminDashboardService.getDashboardSummary();

        // Then
        assertThat(result.getTotalUsers()).isEqualTo(0L);
        assertThat(result.getTotalStudents()).isEqualTo(0L);
        assertThat(result.getTotalAlumni()).isEqualTo(0L);
        assertThat(result.getTotalAdmins()).isEqualTo(0L);
        assertThat(result.getActiveUsers()).isEqualTo(0L);
        assertThat(result.getLockedUsers()).isEqualTo(0L);
        assertThat(result.getPendingVerifications()).isEqualTo(0L);
        assertThat(result.getRegistrationsLast7Days()).hasSize(7);
        assertThat(result.getRegistrationsByMonth()).hasSize(12);
        assertThat(result.getRegistrationsByYear()).hasSize(1);
        assertThat(result.getRegistrationsByYear().get(0).getCount()).isEqualTo(0L);
    }
}
