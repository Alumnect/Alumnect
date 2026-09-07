package com.alumnect.alumnect_backend.controller.forum;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.request.report.CreateAnswerReportRequest;
import com.alumnect.alumnect_backend.dto.response.admin.AdminAnswerReportResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.service.report.AnswerReportService;
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
 * Controller xử lý việc gửi báo cáo câu trả lời vi phạm từ phía người dùng trên diễn đàn Q&A (UC79).
 */
@RestController
@RequestMapping("/answers")
@RequiredArgsConstructor
public class AnswerReportController {

    private final AnswerReportService answerReportService;

    /**
     * Gửi báo cáo câu trả lời vi phạm (UC79).
     *
     * @param id ID của câu trả lời bị báo cáo
     * @param request Thông tin báo cáo (lý do, mô tả)
     * @param currentUser Người dùng hiện tại thực hiện báo cáo
     * @return Báo cáo đã tạo thành công
     */
    @PostMapping("/{id}/reports")
    public ResponseEntity<ApiResponse<AdminAnswerReportResponse>> reportAnswer(
            @PathVariable Long id,
            @Valid @RequestBody CreateAnswerReportRequest request,
            @AuthenticationPrincipal User currentUser) {

        AdminAnswerReportResponse report = answerReportService.reportAnswer(id, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Báo cáo câu trả lời vi phạm thành công", report));
    }
}
