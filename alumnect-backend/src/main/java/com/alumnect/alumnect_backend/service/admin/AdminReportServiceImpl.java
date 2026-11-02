package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.admin.AdminReportResponse;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.admin.AdminReportMapper;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import com.alumnect.alumnect_backend.specification.report.ReportSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminReportResponse> getReports(String query, String author, String reason, String status, String type, Long postId, String riskLevel, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Specification<Report> spec = ReportSpecification.filterReports(query, author, reason, status, type, postId, riskLevel);

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
    public void updateReportStatus(Long id, String status, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản quản trị viên"));
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo vi phạm với ID: " + id));

        try {
            ReportStatus newStatus = ReportStatus.valueOf(status.trim().toUpperCase());
            if (newStatus == ReportStatus.PENDING) {
                throw new BadRequestException("Không thể cập nhật báo cáo quay lại trạng thái PENDING.");
            }
            report.setStatus(newStatus);
            report.setReviewedAt(Instant.now());
            report.setReviewedBy(admin);
            reportRepository.save(report);
            if (newStatus == ReportStatus.DISMISSED) {
                restoreAutoHiddenPost(report);
            }
            log.info("Admin ID={} đã cập nhật trạng thái báo cáo ID={} sang {}", admin.getId(), id, newStatus);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái báo cáo không hợp lệ: " + status);
        }
    }

    /**
     * Khôi phục bài viết khi Admin kết luận hệ thống ẩn nhầm.
     * Không khôi phục nếu bài còn báo cáo tự động ẩn khác chưa được xác nhận là an toàn.
     *
     * @param report Báo cáo vừa được bỏ qua
     */
    private void restoreAutoHiddenPost(Report report) {
        Post post = report.getPost();
        if (!Boolean.TRUE.equals(report.getAutoModerated()) || post == null
                || post.getStatus() != PostStatus.HIDDEN) {
            return;
        }
        boolean heldByAnotherReport = reportRepository.existsByPostIdAndAutoModeratedTrueAndStatusNotAndIdNot(
                post.getId(), ReportStatus.DISMISSED, report.getId());
        if (heldByAnotherReport) {
            return;
        }
        post.setStatus(PostStatus.ACTIVE);
        postRepository.save(post);
        notificationService.sendContentRestoredNotification(post);
        log.info("Đã khôi phục bài viết bị tự động ẩn nhầm: postId={}", post.getId());
    }
}
