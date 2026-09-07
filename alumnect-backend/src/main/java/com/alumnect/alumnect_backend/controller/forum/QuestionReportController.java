package com.alumnect.alumnect_backend.controller.forum;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.report.CreateQuestionReportRequest;
import com.alumnect.alumnect_backend.dto.response.admin.AdminQuestionReportResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.service.report.QuestionReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý việc gửi báo cáo câu hỏi vi phạm từ phía người dùng trên diễn đàn Q&A (UC78).
 */
@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
public class QuestionReportController {

    private final QuestionReportService questionReportService;

    /**
     * Gửi báo cáo câu hỏi vi phạm (UC78).
     *
     * @param id ID của câu hỏi bị báo cáo
     * @param request Thông tin báo cáo (lý do, mô tả)
     * @param currentUser Người dùng hiện tại thực hiện báo cáo
     * @return Báo cáo đã tạo thành công
     */
    @PostMapping("/{id}/reports")
    public ResponseEntity<ApiResponse<AdminQuestionReportResponse>> reportQuestion(
            @PathVariable Long id,
            @Valid @RequestBody CreateQuestionReportRequest request,
            @AuthenticationPrincipal User currentUser) {

        AdminQuestionReportResponse report = questionReportService.reportQuestion(id, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Báo cáo câu hỏi vi phạm thành công", report));
    }
}
