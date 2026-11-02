package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.ConfirmMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RejectMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateMentoringWorkLogRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWorkLogResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringWorkLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller truy vấn và quản lý Mentoring Task và Work Log (UC106 & UC107).
 */
@Slf4j
@RestController
@RequestMapping("/mentoring/tasks")
@RequiredArgsConstructor
@Tag(name = "Mentoring Tasks & Work Logs", description = "Quản lý Mentoring Tasks và Work Logs (UC106 & UC107)")
public class MentoringTaskController {

    private final MentoringTaskService taskService;
    private final MentoringWorkLogService workLogService;
    private final UserRepository userRepository;

    @GetMapping({"", "/my-tasks"})
    @Operation(summary = "Lấy danh sách Mentoring Tasks của người dùng hiện tại (UC106)",
               description = "Trả về danh sách các Task mà người dùng tham gia (Student hoặc Mentor) có phân trang và lọc theo stage/status")
    public ResponseEntity<ApiResponse<PageResponse<MentoringTaskResponse>>> getMyTasks(
            @RequestParam(required = false) String stage,
            @RequestParam(required = false) MentoringTaskStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long currentUserId = getCurrentUserId();
        PageResponse<MentoringTaskResponse> response = taskService.getMyTasks(currentUserId, stage, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Mentoring Tasks thành công", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết Mentoring Task đầy đủ 10 sections theo ID (UC106)",
               description = "Cho phép Student hoặc Mentor của Task xem chi tiết toàn diện nhiệm vụ, thỏa thuận Deal, thanh toán, nhật ký và tiến độ")
    public ResponseEntity<ApiResponse<MentoringTaskDetailResponse>> getTaskDetail(@PathVariable Long id) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskDetailResponse response = taskService.getTaskDetail(currentUserId, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết Mentoring Task thành công", response));
    }

    @GetMapping("/{id}/report")
    @Operation(summary = "Xem báo cáo kết quả Task & trạng thái thanh toán (UC114)",
               description = "Cho phép Student hoặc Mentor xem tổng kết chi tiết Task, deadline, logs nghiệm thu, deliverables và phân chia dòng tiền thực nhận/hoàn tiền")
    public ResponseEntity<ApiResponse<com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskReportResponse>> getTaskReport(
            @PathVariable Long id) {
        Long currentUserId = getCurrentUserId();
        com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskReportResponse response =
                taskService.getTaskReport(currentUserId, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy báo cáo kết quả Task và tài chính thành công", response));
    }

    @GetMapping("/by-deal/{dealId}")
    @Operation(summary = "Lấy thông tin chi tiết Mentoring Task theo Deal ID (UC106)",
               description = "Tra cứu Task đã được kích hoạt từ thỏa thuận Deal tương ứng")
    public ResponseEntity<ApiResponse<MentoringTaskDetailResponse>> getTaskByDealId(@PathVariable Long dealId) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskDetailResponse response = taskService.getTaskByDealId(currentUserId, dealId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin Mentoring Task theo Deal thành công", response));
    }

    @GetMapping("/{taskId}/work-logs")
    @Operation(summary = "Lấy danh sách Work Logs của Mentoring Task (UC106 & UC107)",
               description = "Trả về toàn bộ nhật ký công việc của Task theo thứ tự ngày làm việc mới nhất")
    public ResponseEntity<ApiResponse<List<MentoringWorkLogResponse>>> getWorkLogs(@PathVariable Long taskId) {
        Long currentUserId = getCurrentUserId();
        List<MentoringWorkLogResponse> response = workLogService.getWorkLogsByTaskId(currentUserId, taskId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách nhật ký công việc thành công", response));
    }

    @GetMapping("/{taskId}/work-logs/{workLogId}")
    @Operation(summary = "Xem chi tiết một bản ghi Work Log theo ID (UC107)",
               description = "Cho phép Student hoặc Mentor của Task xem chi tiết một bản ghi Work Log")
    public ResponseEntity<ApiResponse<MentoringWorkLogResponse>> getWorkLogDetail(
            @PathVariable Long taskId,
            @PathVariable Long workLogId) {
        Long currentUserId = getCurrentUserId();
        MentoringWorkLogResponse response = workLogService.getWorkLogDetail(currentUserId, taskId, workLogId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết nhật ký công việc thành công", response));
    }

    @PostMapping("/{taskId}/work-logs")
    @Operation(summary = "Mentor tạo nhật ký công việc mới (UC107)",
               description = "Chỉ Mentor phụ trách Task mới có quyền tạo Work Log. Trạng thái ban đầu là PENDING_CONFIRMATION và gửi thông báo tới Student")
    public ResponseEntity<ApiResponse<MentoringWorkLogResponse>> createWorkLog(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateMentoringWorkLogRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringWorkLogResponse response = workLogService.createWorkLog(currentUserId, taskId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo nhật ký công việc thành công, đang chờ học viên xác nhận", response));
    }

    @PutMapping("/{taskId}/work-logs/{workLogId}")
    @Operation(summary = "Mentor cập nhật nhật ký công việc chưa được xác nhận (UC107)",
               description = "Chỉ Mentor phụ trách Task mới có quyền chỉnh sửa khi Work Log đang ở trạng thái PENDING_CONFIRMATION")
    public ResponseEntity<ApiResponse<MentoringWorkLogResponse>> updateWorkLog(
            @PathVariable Long taskId,
            @PathVariable Long workLogId,
            @Valid @RequestBody UpdateMentoringWorkLogRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringWorkLogResponse response = workLogService.updateWorkLog(currentUserId, taskId, workLogId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật nhật ký công việc thành công", response));
    }

    @PostMapping("/{taskId}/work-logs/{workLogId}/confirm")
    @Operation(summary = "Học viên xác nhận nghiệm thu Work Log (UC108)",
               description = "Chỉ Student của Task mới có quyền xác nhận khi Work Log đang ở trạng thái PENDING_CONFIRMATION")
    public ResponseEntity<ApiResponse<MentoringWorkLogResponse>> confirmWorkLog(
            @PathVariable Long taskId,
            @PathVariable Long workLogId,
            @Valid @RequestBody(required = false) ConfirmMentoringWorkLogRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringWorkLogResponse response = workLogService.confirmWorkLog(currentUserId, taskId, workLogId, request);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận nghiệm thu nhật ký công việc thành công", response));
    }

    @PostMapping(value = {"/{taskId}/work-logs/{workLogId}/reject", "/{taskId}/work-logs/{workLogId}/request-clarification"})
    @Operation(summary = "Học viên yêu cầu làm rõ / điều chỉnh Work Log (UC108)",
               description = "Chỉ Student của Task mới có quyền yêu cầu điều chỉnh khi Work Log đang ở trạng thái PENDING_CONFIRMATION")
    public ResponseEntity<ApiResponse<MentoringWorkLogResponse>> rejectWorkLog(
            @PathVariable Long taskId,
            @PathVariable Long workLogId,
            @Valid @RequestBody RejectMentoringWorkLogRequest request) {
        Long currentUserId = getCurrentUserId();
        MentoringWorkLogResponse response = workLogService.rejectWorkLog(currentUserId, taskId, workLogId, request);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu điều chỉnh nhật ký công việc thành công", response));
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng đang đăng nhập."));
        return user.getId();
    }
}
