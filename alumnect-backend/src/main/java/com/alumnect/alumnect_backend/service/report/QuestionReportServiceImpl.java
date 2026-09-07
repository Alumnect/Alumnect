package com.alumnect.alumnect_backend.service.report;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.constant.WebSocketDestinations;
import com.alumnect.alumnect_backend.common.enums.QuestionStatus;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.dao.forum.QuestionRepository;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.dto.request.report.CreateQuestionReportRequest;
import com.alumnect.alumnect_backend.dto.response.admin.AdminQuestionReportResponse;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.report.QuestionReportMapper;
import com.alumnect.alumnect_backend.specification.report.QuestionReportSpecification;
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
 * Service triển khai nghiệp vụ báo cáo câu hỏi vi phạm và kiểm duyệt dành cho Admin (UC78).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionReportServiceImpl implements QuestionReportService {

    private final ReportRepository reportRepository;
    private final QuestionRepository questionRepository;
    private final QuestionReportMapper questionReportMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public AdminQuestionReportResponse reportQuestion(Long questionId, CreateQuestionReportRequest request, User reporter) {
        // 1. Kiểm tra sự tồn tại của câu hỏi
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với ID: " + questionId));

        // 2. Không cho phép tự báo cáo câu hỏi của chính mình
        if (question.getAuthor().getId().equals(reporter.getId())) {
            throw new BadRequestException("Bạn không thể tự báo cáo câu hỏi của chính mình.");
        }

        // 3. Kiểm tra đã báo cáo câu hỏi này trước đó chưa
        if (reportRepository.existsByQuestionIdAndReporterId(questionId, reporter.getId())) {
            throw new ConflictException("Bạn đã gửi báo cáo cho câu hỏi này trước đó rồi.");
        }

        // 4. Khởi tạo và lưu bản ghi báo cáo
        Report report = Report.builder()
                .question(question)
                .reporter(reporter)
                .reason(request.getReason())
                .description(request.getDescription())
                .status(ReportStatus.PENDING)
                .build();

        Report savedReport = reportRepository.save(report);
        log.info("Người dùng ID={} vừa gửi báo cáo câu hỏi ID={} với lý do {}", reporter.getId(), questionId, request.getReason());

        // 5. Chuyển đổi sang Response DTO
        AdminQuestionReportResponse responseDto = questionReportMapper.toAdminResponse(savedReport);

        // 6. Phát thông báo WebSocket STOMP real-time tới Admin Dashboard
        try {
            messagingTemplate.convertAndSend(WebSocketDestinations.TOPIC_ADMIN_QUESTION_REPORTS, responseDto);
            log.info("Đã phát thông báo STOMP real-time báo cáo câu hỏi ID={} tới topic {}", savedReport.getId(), WebSocketDestinations.TOPIC_ADMIN_QUESTION_REPORTS);
        } catch (Exception e) {
            log.error("Lỗi gửi thông báo WebSocket real-time cho báo cáo câu hỏi: {}", e.getMessage());
        }

        return responseDto;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminQuestionReportResponse> getViolatingQuestions(String query, String reason, String status, Long topicId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Specification<Report> spec = QuestionReportSpecification.filterQuestionReports(query, reason, status, null, topicId);

        Page<Report> reportPage = reportRepository.findAll(spec, pageable);
        List<Report> reports = reportPage.getContent();

        if (reports.isEmpty()) {
            return PageResponse.<AdminQuestionReportResponse>builder()
                    .content(List.of())
                    .totalElements(reportPage.getTotalElements())
                    .totalPages(reportPage.getTotalPages())
                    .pageSize(reportPage.getSize())
                    .pageNumber(reportPage.getNumber())
                    .last(reportPage.isLast())
                    .build();
        }

        List<AdminQuestionReportResponse> dtoList = reports.stream()
                .map(questionReportMapper::toAdminResponse)
                .collect(Collectors.toList());

        return PageResponse.<AdminQuestionReportResponse>builder()
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
    public void updateReportStatus(Long id, String status, Boolean hideQuestion) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo vi phạm với ID: " + id));

        if (report.getQuestion() == null) {
            throw new BadRequestException("Bản ghi báo cáo ID: " + id + " không phải là báo cáo câu hỏi.");
        }

        try {
            ReportStatus newStatus = ReportStatus.valueOf(status.trim().toUpperCase());
            if (newStatus == ReportStatus.PENDING) {
                throw new BadRequestException("Không thể chuyển báo cáo về lại trạng thái PENDING.");
            }

            report.setStatus(newStatus);
            reportRepository.save(report);

            // Cập nhật trạng thái hiển thị của câu hỏi gốc nếu được yêu cầu
            if (hideQuestion != null) {
                Question question = report.getQuestion();
                QuestionStatus targetStatus = hideQuestion ? QuestionStatus.HIDDEN : QuestionStatus.ACTIVE;
                question.setStatus(targetStatus);
                questionRepository.save(question);
                log.info("Admin cập nhật trạng thái câu hỏi ID={} sang {}", question.getId(), targetStatus);
            }

            log.info("Admin cập nhật trạng thái báo cáo ID={} sang {}", id, newStatus);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái báo cáo không hợp lệ: " + status);
        }
    }
}
