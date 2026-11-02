package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.salary.SalaryContributionRepository;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryContributionResponse;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryStatisticsResponse;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.salary.SalaryContribution;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.mapper.salary.SalaryMapper;
import com.alumnect.alumnect_backend.service.salary.SalaryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FE-40 Salary Board - Statistics & Filter")
public class FE40_SalaryBoardStatisticsFilterTest {

    @Mock
    private SalaryContributionRepository salaryContributionRepository;

    @Mock
    private IndustryRepository industryRepository;

    @Spy
    private SalaryMapper salaryMapper = new SalaryMapper();

    @InjectMocks
    private SalaryServiceImpl salaryService;

    private SalaryContribution contribution1;
    private SalaryContribution contribution2;

    @BeforeEach
    void setUp() {
        Industry itIndustry = Industry.builder().id(4L).name("Công nghệ thông tin").build();

        contribution1 = SalaryContribution.builder()
                .id(1L)
                .industry(itIndustry)
                .jobTitle("Backend Developer")
                .company("FPT Software")
                .region("Cầu Giấy, Hà Nội")
                .locationCity("Hà Nội")
                .yearsExperience((short) 3)
                .grossAmount(new BigDecimal("30000000"))
                .currency("VND")
                .createdAt(Instant.now().minusSeconds(2000))
                .build();

        contribution2 = SalaryContribution.builder()
                .id(2L)
                .industry(itIndustry)
                .jobTitle("Frontend Developer")
                .company("VNG")
                .region("Quận 7, TP. HCM")
                .locationCity("Thành Phố Hồ Chí Minh")
                .yearsExperience((short) 5)
                .grossAmount(new BigDecimal("45000000"))
                .currency("VND")
                .createdAt(Instant.now().minusSeconds(1000))
                .build();
    }

    // ================= Statistics (UTCID01 - UTCID08) =================

    @Test
    @DisplayName("UTCID01 - No filter -> 12 contributions, median 30M, 1 grouped position Backend Developer / Mid / Hà Nội")
    void utcid01_getStatistics_okOverallMedian() {
        // Given
        Object[] row = new Object[]{
                "Backend Developer", "Mid", "Hà Nội", 5L,
                new BigDecimal("25000000"), new BigDecimal("30000000"), new BigDecimal("35000000")
        };

        when(salaryContributionRepository.countFiltered(false, null, false, null, false, null, false, null))
                .thenReturn(12L);
        when(salaryContributionRepository.findOverallMedianVnd(false, null, false, null, false, null, false, null))
                .thenReturn(new BigDecimal("30000000"));
        when(salaryContributionRepository.findGroupedStatistics(false, null, false, null, false, null, false, null, 1))
                .thenReturn(Collections.singletonList(row));

        // When
        SalaryStatisticsResponse response = salaryService.getStatistics(null, null, null, null);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTotalContributions()).isEqualTo(12L);
        assertThat(response.getTrackedPositions()).isEqualTo(1);
        assertThat(response.getOverallMedian()).isEqualByComparingTo("30000000");
        assertThat(response.getRows()).hasSize(1);
        assertThat(response.getRows().get(0).getRole()).isEqualTo("Backend Developer");
        assertThat(response.getRows().get(0).getLevel()).isEqualTo("Mid");
        assertThat(response.getRows().get(0).getRegion()).isEqualTo("Hà Nội");
        assertThat(response.getRows().get(0).getSamples()).isEqualTo(5L);
        assertThat(response.getRows().get(0).getP25()).isEqualByComparingTo("25000000");
        assertThat(response.getRows().get(0).getMedian()).isEqualByComparingTo("30000000");
        assertThat(response.getRows().get(0).getP75()).isEqualByComparingTo("35000000");
    }

    @Test
    @DisplayName("UTCID02 - jobTitle = 'No Such Job' -> No contribution matches, overallMedian is null, empty rows")
    void utcid02_getStatistics_okNoMatch() {
        // Given
        when(salaryContributionRepository.countFiltered(false, null, false, null, true, "%No Such Job%", false, null))
                .thenReturn(0L);
        when(salaryContributionRepository.findOverallMedianVnd(false, null, false, null, true, "%No Such Job%", false, null))
                .thenReturn(null);
        when(salaryContributionRepository.findGroupedStatistics(false, null, false, null, true, "%No Such Job%", false, null, 1))
                .thenReturn(Collections.emptyList());

        // When
        SalaryStatisticsResponse response = salaryService.getStatistics(null, null, "No Such Job", null);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTotalContributions()).isEqualTo(0L);
        assertThat(response.getTrackedPositions()).isEqualTo(0);
        assertThat(response.getOverallMedian()).isNull();
        assertThat(response.getRows()).isEmpty();
    }

    @Test
    @DisplayName("UTCID03 - industryId = 99 does not exist -> BadRequestException: Ngành nghề không tồn tại")
    void utcid03_getStatistics_badReqIndustry() {
        // Given
        when(industryRepository.existsById(99L)).thenReturn(false);

        // When + Then
        assertThatThrownBy(() -> salaryService.getStatistics(99L, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ngành nghề không tồn tại");
    }

    @Test
    @DisplayName("UTCID04 - level = 'Lead' (not Junior/Mid/Senior) -> BadRequestException: Cấp bậc không hợp lệ")
    void utcid04_getStatistics_badReqLevel() {
        // When + Then
        assertThatThrownBy(() -> salaryService.getStatistics(null, null, null, "Lead"))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Cấp bậc không hợp lệ (chỉ chấp nhận Junior/Mid/Senior)");
    }

    @Test
    @DisplayName("UTCID05 - industryId = 4, level = ' Senior ' -> Valid with spaces, trimmed to 'Senior'")
    void utcid05_getStatistics_okFilterIndLevel() {
        // Given
        when(industryRepository.existsById(4L)).thenReturn(true);
        when(salaryContributionRepository.countFiltered(true, 4L, false, null, false, null, true, "Senior"))
                .thenReturn(3L);
        when(salaryContributionRepository.findOverallMedianVnd(true, 4L, false, null, false, null, true, "Senior"))
                .thenReturn(new BigDecimal("45000000"));
        when(salaryContributionRepository.findGroupedStatistics(true, 4L, false, null, false, null, true, "Senior", 1))
                .thenReturn(Collections.emptyList());

        // When
        SalaryStatisticsResponse response = salaryService.getStatistics(4L, null, null, " Senior ");

        // Then
        assertThat(response).isNotNull();
        verify(salaryContributionRepository).countFiltered(true, 4L, false, null, false, null, true, "Senior");
        verify(salaryContributionRepository).findGroupedStatistics(true, 4L, false, null, false, null, true, "Senior", 1);
    }

    @Test
    @DisplayName("UTCID06 - Blank filters level = '   ', region = '  ', jobTitle = '' -> All filter flags false")
    void utcid06_getStatistics_okBlankIgnored() {
        // Given
        when(salaryContributionRepository.countFiltered(false, null, false, null, false, null, false, ""))
                .thenReturn(10L);
        when(salaryContributionRepository.findOverallMedianVnd(false, null, false, null, false, null, false, ""))
                .thenReturn(new BigDecimal("28000000"));
        when(salaryContributionRepository.findGroupedStatistics(false, null, false, null, false, null, false, "", 1))
                .thenReturn(Collections.emptyList());

        // When
        SalaryStatisticsResponse response = salaryService.getStatistics(null, "  ", "", "   ");

        // Then
        assertThat(response).isNotNull();
        verify(salaryContributionRepository).countFiltered(false, null, false, null, false, null, false, "");
    }

    @Test
    @DisplayName("UTCID07 - region = 'Hà Nội', jobTitle = '50%_dev' -> LIKE wildcards escaped: '%50\\%\\_dev%'")
    void utcid07_getStatistics_okEscapedWildcards() {
        // Given
        when(salaryContributionRepository.countFiltered(false, null, true, "%Hà Nội%", true, "%50\\%\\_dev%", false, null))
                .thenReturn(1L);
        when(salaryContributionRepository.findOverallMedianVnd(false, null, true, "%Hà Nội%", true, "%50\\%\\_dev%", false, null))
                .thenReturn(new BigDecimal("32000000"));
        when(salaryContributionRepository.findGroupedStatistics(false, null, true, "%Hà Nội%", true, "%50\\%\\_dev%", false, null, 1))
                .thenReturn(Collections.emptyList());

        // When
        SalaryStatisticsResponse response = salaryService.getStatistics(null, "Hà Nội", "50%_dev", null);

        // Then
        assertThat(response).isNotNull();
        verify(salaryContributionRepository).countFiltered(false, null, true, "%Hà Nội%", true, "%50\\%\\_dev%", false, null);
    }

    @Test
    @DisplayName("UTCID08 - getStatistics -> Grouped statistics requested with minimum sample size of 1")
    void utcid08_getStatistics_okMinSampleSizeOne() {
        // Given
        when(salaryContributionRepository.countFiltered(false, null, false, null, false, null, false, null))
                .thenReturn(0L);
        when(salaryContributionRepository.findOverallMedianVnd(false, null, false, null, false, null, false, null))
                .thenReturn(null);
        when(salaryContributionRepository.findGroupedStatistics(anyBoolean(), any(), anyBoolean(), any(), anyBoolean(), any(), anyBoolean(), any(), eq(1)))
                .thenReturn(Collections.emptyList());

        // When
        salaryService.getStatistics(null, null, null, null);

        // Then
        verify(salaryContributionRepository).findGroupedStatistics(anyBoolean(), any(), anyBoolean(), any(), anyBoolean(), any(), anyBoolean(), any(), eq(1));
    }

    // ================= Feed & Filter (UTCID09 - UTCID16) =================

    @Test
    @DisplayName("UTCID09 - page = -1 -> BadRequestException: Tham số page phải là số nguyên không âm")
    void utcid09_getFeed_badRequestPageNegative() {
        // When + Then
        assertThatThrownBy(() -> salaryService.getFeed(-1, 10))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số page phải là số nguyên không âm");
    }

    @Test
    @DisplayName("UTCID10 - size = 0 -> BadRequestException: Tham số size phải là số nguyên dương")
    void utcid10_getFeed_badRequestSizeZero() {
        // When + Then
        assertThatThrownBy(() -> salaryService.getFeed(0, 0))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số size phải là số nguyên dương");
    }

    @Test
    @DisplayName("UTCID11 - page = 0, size = 10 (default feed) -> 2 items sorted by createdAt DESC")
    void utcid11_getFeed_okDefaultCreatedAtDesc() {
        // Given
        Page<SalaryContribution> page = new PageImpl<>(List.of(contribution2, contribution1), PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")), 2);
        when(salaryContributionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        // When
        PageResponse<SalaryContributionResponse> response = salaryService.getFeed(0, 10);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getTotalElements()).isEqualTo(2);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(salaryContributionRepository).findAll(any(Specification.class), pageableCaptor.capture());
        Pageable usedPageable = pageableCaptor.getValue();
        assertThat(usedPageable.getSort().getOrderFor("createdAt")).isNotNull();
        assertThat(usedPageable.getSort().getOrderFor("createdAt").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("UTCID12 - sortBy = 'salaryDesc' -> Sorted by grossAmount DESC")
    void utcid12_getFeed_okSortSalaryDesc() {
        // Given
        Page<SalaryContribution> page = new PageImpl<>(List.of(contribution2, contribution1));
        when(salaryContributionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        // When
        salaryService.getFeed(0, 10, null, null, null, "salaryDesc");

        // Then
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(salaryContributionRepository).findAll(any(Specification.class), pageableCaptor.capture());
        Pageable usedPageable = pageableCaptor.getValue();
        assertThat(usedPageable.getSort().getOrderFor("grossAmount")).isNotNull();
        assertThat(usedPageable.getSort().getOrderFor("grossAmount").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("UTCID13 - sortBy = 'SALARYASC' (case-insensitive) -> Sorted by grossAmount ASC")
    void utcid13_getFeed_okSortSalaryAsc() {
        // Given
        Page<SalaryContribution> page = new PageImpl<>(List.of(contribution1, contribution2));
        when(salaryContributionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        // When
        salaryService.getFeed(0, 10, null, null, null, "SALARYASC");

        // Then
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(salaryContributionRepository).findAll(any(Specification.class), pageableCaptor.capture());
        Pageable usedPageable = pageableCaptor.getValue();
        assertThat(usedPageable.getSort().getOrderFor("grossAmount")).isNotNull();
        assertThat(usedPageable.getSort().getOrderFor("grossAmount").getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    @DisplayName("UTCID14 - sortBy = 'unknown' -> Unknown sort key falls back to createdAt DESC")
    void utcid14_getFeed_okSortUnknownFallback() {
        // Given
        Page<SalaryContribution> page = new PageImpl<>(List.of(contribution2, contribution1));
        when(salaryContributionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        // When
        salaryService.getFeed(0, 10, null, null, null, "unknown");

        // Then
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(salaryContributionRepository).findAll(any(Specification.class), pageableCaptor.capture());
        Pageable usedPageable = pageableCaptor.getValue();
        assertThat(usedPageable.getSort().getOrderFor("createdAt")).isNotNull();
        assertThat(usedPageable.getSort().getOrderFor("createdAt").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("UTCID15 - Filter feed with industry, region, search -> PageResponse with 1 item")
    void utcid15_getFeed_okFilteredPaging() {
        // Given
        Page<SalaryContribution> page = new PageImpl<>(List.of(contribution1), PageRequest.of(0, 5), 1);
        when(salaryContributionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        // When
        PageResponse<SalaryContributionResponse> response = salaryService.getFeed(0, 5, 4L, "  Hà Nội ", " developer ", "latest");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getPageNumber()).isEqualTo(0);
        assertThat(response.getPageSize()).isEqualTo(5);
        assertThat(response.getTotalElements()).isEqualTo(1);
        assertThat(response.isLast()).isTrue();
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getId()).isEqualTo("1");
    }

    @Test
    @DisplayName("UTCID16 - search = 'zzz' (no match) -> Empty PageResponse (content = [], totalElements = 0)")
    void utcid16_getFeed_okEmptyNoMatch() {
        // Given
        Page<SalaryContribution> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(salaryContributionRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        // When
        PageResponse<SalaryContributionResponse> response = salaryService.getFeed(0, 10, null, null, "zzz", "latest");

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEmpty();
        assertThat(response.getTotalElements()).isEqualTo(0);
    }
}
