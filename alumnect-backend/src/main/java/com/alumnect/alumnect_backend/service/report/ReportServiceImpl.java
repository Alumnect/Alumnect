package com.alumnect.alumnect_backend.service.report;

import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.report.CreatePostReportRequest;
import com.alumnect.alumnect_backend.dto.response.report.ReportResponse;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.report.ReportMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/** Cài đặt UC24: lưu report, không tự động ẩn bài và chặn lạm dụng cơ bản. */
@Service
@Slf4j
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ReportMapper reportMapper;

    @Override
    @Transactional
    public ReportResponse reportPost(String email, Long postId, CreatePostReportRequest request) {
        User reporter = resolveMemberOrThrow(email);
        Post post = postRepository.findDetailById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết này không còn khả dụng"));

        if (post.getStatus() != PostStatus.ACTIVE) {
            throw new ResourceNotFoundException("Bài viết này không còn khả dụng");
        }
        if (reportRepository.countByReporterIdAndCreatedAtGreaterThanEqual(
                reporter.getId(), Instant.now().minus(Duration.ofMinutes(10))) >= 5) {
            throw new BadRequestException("Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau 10 phút");
        }
        ReportReason reason = parseReason(request.getReason());
        validateOtherReason(reason, request);

        Report report = reportRepository.save(Report.builder()
                .reporter(reporter)
                .post(post)
                .reason(reason)
                .description(normalizeDescription(request.getDescription()))
                .status(ReportStatus.PENDING)
                .build());

        log.info("Đã tạo báo cáo UC24: reportId={}, postId={}, reporterId={}, reason={}",
                report.getId(), postId, reporter.getId(), report.getReason());
        return reportMapper.toResponse(report);
    }

    private User resolveMemberOrThrow(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));
        String role = user.getRole() == null ? "" : user.getRole().getName().toUpperCase();
        if (!"STUDENT".equals(role) && !"ALUMNI".equals(role)) {
            throw new ForbiddenException("Chỉ sinh viên và cựu sinh viên mới được báo cáo bài viết");
        }
        return user;
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }

    private ReportReason parseReason(String reason) {
        if (reason == null) {
            throw new BadRequestException("Vui lòng chọn lý do báo cáo");
        }
        try {
            return ReportReason.valueOf(reason.trim());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Vui lòng chọn lý do báo cáo");
        }
    }

    private void validateOtherReason(ReportReason reason, CreatePostReportRequest request) {
        if (reason == ReportReason.OTHER
                && (request.getDescription() == null || request.getDescription().isBlank())) {
            throw new BadRequestException("Vui lòng mô tả lý do báo cáo khác");
        }
    }
}
