package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.admin.AdminReportResponse;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.admin.AdminReportMapper;
import com.alumnect.alumnect_backend.service.admin.AdminReportServiceImpl;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-18_Violation Reports & Content Moderation Queue.
 * Report sheet : FE-18 (Report5_Unit_Test.xlsx)
 * Functions    : AdminReportServiceImpl.getReports(), AdminReportServiceImpl.updateReportStatus()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-18 Violation Reports & Content Moderation Queue")
class FE18_AdminReportedPostTest {

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private AdminReportMapper adminReportMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AdminReportServiceImpl adminReportService;

    private static final String ADMIN_EMAIL = "admin@alumnect.vn";

    @BeforeEach
    void setUp() {
        lenient().when(userRepository.findByEmail(ADMIN_EMAIL))
                .thenReturn(Optional.of(User.builder().id(1L).email(ADMIN_EMAIL).build()));
    }

    // ================= getReports =================

    @Test
    @DisplayName("UTCID01 - Filters match 2 reports -> PageResponse with 2 responses and totalElements=2")
    @SuppressWarnings("unchecked")
    void utcid01_getReports_filtersMatchTwoReports() {
        // Given
        Report r1 = Report.builder().id(1L).build();
        Report r2 = Report.builder().id(2L).build();
        Page<Report> page = new PageImpl<>(List.of(r1, r2), PageRequest.of(0, 10), 2);
        when(reportRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        AdminReportResponse dto1 = AdminReportResponse.builder().id(1L).build();
        AdminReportResponse dto2 = AdminReportResponse.builder().id(2L).build();
        when(adminReportMapper.toDto(r1)).thenReturn(dto1);
        when(adminReportMapper.toDto(r2)).thenReturn(dto2);

        // When
        PageResponse<AdminReportResponse> result = adminReportService.getReports(
                "spam", "", "SPAM", "PENDING", "GENERAL", 10L, null, 0, 10
        );

        // Then
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2L);
        verify(adminReportMapper).toDto(r1);
        verify(adminReportMapper).toDto(r2);
    }

    @Test
    @DisplayName("UTCID02 - No report matches -> empty PageResponse, mapper never called")
    @SuppressWarnings("unchecked")
    void utcid02_getReports_noMatchesEmptyResponse() {
        // Given
        Page<Report> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(reportRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        // When
        PageResponse<AdminReportResponse> result = adminReportService.getReports(
                null, null, null, null, null, null, null, 0, 10
        );

        // Then
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0L);
        verify(adminReportMapper, never()).toDto(any());
    }

    // ================= updateReportStatus =================

    @Test
    @DisplayName("UTCID03 - Report 3 PENDING -> update status to RESOLVED saves report")
    void utcid03_updateReportStatus_resolved() {
        // Given
        Report report = Report.builder().id(3L).status(ReportStatus.PENDING).build();
        when(reportRepository.findById(3L)).thenReturn(Optional.of(report));

        // When
        adminReportService.updateReportStatus(3L, "RESOLVED", ADMIN_EMAIL);

        // Then
        assertThat(report.getStatus()).isEqualTo(ReportStatus.RESOLVED);
        verify(reportRepository).save(report);
    }

    @Test
    @DisplayName("UTCID04 - Lower-case with whitespace ' dismissed ' trimmed to DISMISSED")
    void utcid04_updateReportStatus_dismissedWithWhitespace() {
        // Given
        Report report = Report.builder().id(3L).status(ReportStatus.PENDING).build();
        when(reportRepository.findById(3L)).thenReturn(Optional.of(report));

        // When
        adminReportService.updateReportStatus(3L, " dismissed ", ADMIN_EMAIL);

        // Then
        assertThat(report.getStatus()).isEqualTo(ReportStatus.DISMISSED);
        verify(reportRepository).save(report);
    }

    @Test
    @DisplayName("UTCID05 - Cannot revert report back to PENDING -> BadRequestException")
    void utcid05_updateReportStatus_cannotRevertToPending() {
        // Given
        Report report = Report.builder().id(3L).status(ReportStatus.RESOLVED).build();
        when(reportRepository.findById(3L)).thenReturn(Optional.of(report));

        // When + Then
        assertThatThrownBy(() -> adminReportService.updateReportStatus(3L, "PENDING", ADMIN_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Không thể cập nhật báo cáo quay lại trạng thái PENDING.");
    }

    @Test
    @DisplayName("UTCID06 - Invalid report status 'FOO' -> BadRequestException")
    void utcid06_updateReportStatus_invalidStatusFoo() {
        // Given
        Report report = Report.builder().id(3L).status(ReportStatus.PENDING).build();
        when(reportRepository.findById(3L)).thenReturn(Optional.of(report));

        // When + Then
        assertThatThrownBy(() -> adminReportService.updateReportStatus(3L, "FOO", ADMIN_EMAIL))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Trạng thái báo cáo không hợp lệ: FOO");
    }

    @Test
    @DisplayName("UTCID07 - No report with id 404 -> ResourceNotFoundException")
    void utcid07_updateReportStatus_notFound() {
        // Given
        when(reportRepository.findById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> adminReportService.updateReportStatus(404L, "RESOLVED", ADMIN_EMAIL))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy báo cáo vi phạm với ID: 404");
    }
}
