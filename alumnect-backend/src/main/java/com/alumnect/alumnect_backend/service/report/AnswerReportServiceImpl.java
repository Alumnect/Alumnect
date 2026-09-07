package com.alumnect.alumnect_backend.service.report;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.constant.WebSocketDestinations;
import com.alumnect.alumnect_backend.common.enums.AnswerStatus;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.dao.forum.AnswerRepository;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.dto.request.report.CreateAnswerReportRequest;
import com.alumnect.alumnect_backend.dto.response.admin.AdminAnswerReportResponse;
import com.alumnect.alumnect_backend.entity.forum.Answer;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.report.AnswerReportMapper;
import com.alumnect.alumnect_backend.specification.report.AnswerReportSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service triển khai nghiệp vụ báo cáo câu trả lời vi phạm và kiểm duyệt dành cho Admin (UC79).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnswerReportServiceImpl implements AnswerReportService {

    private final ReportRepository reportRepository;
    private final AnswerRepository answerRepository;
    private final AnswerReportMapper answerReportMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public AdminAnswerReportResponse reportAnswer(Long answerId, CreateAnswerReportRequest request, User reporter) {
        // 1. Kiểm tra sự tồn tại của câu trả lời
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu trả lời với ID: " + answerId));

        // 2. Không cho phép tự báo cáo câu trả lời của chính mình
        if (answer.getAuthor().getId().equals(reporter.getId())) {
            throw new BadRequestException("Bạn không thể tự báo cáo câu trả lời của chính mình.");
        }

        // 3. Kiểm tra đã báo cáo câu trả lời này trước đó chưa
        if (reportRepository.existsByAnswerIdAndReporterId(answerId, reporter.getId())) {
            throw new ConflictException("Bạn đã gửi báo cáo cho câu trả lời này trước đó rồi.");
        }

        // 4. Khởi tạo và lưu bản ghi báo cáo
        Report report = Report.builder()
                .answer(answer)
                .reporter(reporter)
                .reason(request.getReason())
                .description(request.getDescription())
                .status(ReportStatus.PENDING)
                .build();

        Report savedReport = reportRepository.save(report);
        log.info("Người dùng ID={} vừa gửi báo cáo câu trả lời ID={} với lý do {}", reporter.getId(), answerId, request.getReason());

        // 5. Chuyển đổi sang Response DTO
        AdminAnswerReportResponse responseDto = answerReportMapper.toAdminResponse(savedReport);

        // 6. Phát thông báo WebSocket STOMP real-time tới Admin Dashboard
        try {
            messagingTemplate.convertAndSend(WebSocketDestinations.TOPIC_ADMIN_ANSWER_REPORTS, responseDto);
            log.info("Đã phát thông báo STOMP real-time báo cáo câu trả lời ID={} tới topic {}", savedReport.getId(), WebSocketDestinations.TOPIC_ADMIN_ANSWER_REPORTS);
        } catch (Exception e) {
            log.error("Lỗi gửi thông báo WebSocket real-time cho báo cáo câu trả lời: {}", e.getMessage());
        }

        return responseDto;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminAnswerReportResponse> getViolatingAnswers(String query, String reason, String status, Long questionId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Specification<Report> spec = AnswerReportSpecification.filterAnswerReports(query, reason, status, null, questionId);

        Page<Report> reportPage = reportRepository.findAll(spec, pageable);
        List<Report> reports = reportPage.getContent();

        if (reports.isEmpty()) {
            return PageResponse.<AdminAnswerReportResponse>builder()
                    .content(List.of())
                    .totalElements(reportPage.getTotalElements())
                    .totalPages(reportPage.getTotalPages())
                    .pageSize(reportPage.getSize())
                    .pageNumber(reportPage.getNumber())
                    .last(reportPage.isLast())
                    .build();
        }

        List<AdminAnswerReportResponse> dtoList = reports.stream()
                .map(answerReportMapper::toAdminResponse)
                .collect(Collectors.toList());

        return PageResponse.<AdminAnswerReportResponse>builder()
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
    public void updateReportStatus(Long id, String status, Boolean hideAnswer) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo vi phạm với ID: " + id));

        if (report.getAnswer() == null) {
            throw new BadRequestException("Bản ghi báo cáo ID: " + id + " không phải là báo cáo câu trả lời.");
        }

        try {
            ReportStatus newStatus = ReportStatus.valueOf(status.trim().toUpperCase());
            if (newStatus == ReportStatus.PENDING) {
                throw new BadRequestException("Không thể chuyển báo cáo về lại trạng thái PENDING.");
            }

            report.setStatus(newStatus);
            reportRepository.save(report);

            // Cập nhật trạng thái hiển thị của câu trả lời gốc nếu được yêu cầu
            if (hideAnswer != null) {
                Answer answer = report.getAnswer();
                AnswerStatus targetStatus = hideAnswer ? AnswerStatus.HIDDEN : AnswerStatus.ACTIVE;
                answer.setStatus(targetStatus);
                answerRepository.save(answer);
                log.info("Admin cập nhật trạng thái câu trả lời ID={} sang {}", answer.getId(), targetStatus);
            }

            log.info("Admin cập nhật trạng thái báo cáo ID={} sang {}", id, newStatus);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái báo cáo không hợp lệ: " + status);
        }
    }
}
