package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.dto.response.admin.AdminReportResponse;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.admin.AdminReportMapper;
import com.alumnect.alumnect_backend.specification.report.ReportSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp dịch vụ thực thi logic quản lý báo cáo vi phạm bài viết của Admin.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminReportServiceImpl implements AdminReportService {

    private final ReportRepository reportRepository;
    private final AdminReportMapper adminReportMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminReportResponse> getReports(String query, String reason, String status, Long postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Specification<Report> spec = ReportSpecification.filterReports(query, reason, status, postId);

        Page<Report> reportPage = reportRepository.findAll(spec, pageable);
        List<Report> reports = reportPage.getContent();

        if (reports.isEmpty()) {
            return PageResponse.<AdminReportResponse>builder()
                    .content(List.of())
                    .totalElements(reportPage.getTotalElements())
                    .totalPages(reportPage.getTotalPages())
                    .pageSize(reportPage.getSize())
                    .pageNumber(reportPage.getNumber())
                    .last(reportPage.isLast())
                    .build();
        }

        List<AdminReportResponse> dtoList = reports.stream()
                .map(adminReportMapper::toDto)
                .collect(Collectors.toList());

        return PageResponse.<AdminReportResponse>builder()
                .content(dtoList)
                .totalElements(reportPage.getTotalElements())
                .totalPages(reportPage.getTotalPages())
                .pageSize(reportPage.getSize())
                .pageNumber(reportPage.getNumber())
                .last(reportPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public void updateReportStatus(Long id, String status) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo vi phạm với ID: " + id));

        try {
            ReportStatus newStatus = ReportStatus.valueOf(status.trim().toUpperCase());
            if (newStatus == ReportStatus.PENDING) {
                throw new BadRequestException("Không thể cập nhật báo cáo quay lại trạng thái PENDING.");
            }
            report.setStatus(newStatus);
            reportRepository.save(report);
            log.info("Admin đã cập nhật trạng thái báo cáo ID={} sang {}", id, newStatus);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái báo cáo không hợp lệ: " + status);
        }
    }
}
