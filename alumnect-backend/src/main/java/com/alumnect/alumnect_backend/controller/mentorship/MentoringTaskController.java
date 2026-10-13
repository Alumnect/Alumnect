package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskStatus;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Controller truy vấn và quản lý Mentoring Task sau khi đã được kích hoạt (UC105 & Flow 3, 4).
 */
@Slf4j
@RestController
@RequestMapping("/mentoring/tasks")
@RequiredArgsConstructor
@Tag(name = "Mentoring Tasks", description = "Quản lý Mentoring Tasks chính thức (UC105)")
public class MentoringTaskController {

    private final MentoringTaskService taskService;
    private final UserRepository userRepository;

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết Mentoring Task theo ID",
               description = "Cho phép Student hoặc Mentor của Task xem chi tiết nhiệm vụ và trạng thái")
    public ResponseEntity<ApiResponse<MentoringTaskResponse>> getTaskDetail(@PathVariable Long id) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskResponse response = taskService.getTaskDetail(currentUserId, id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin chi tiết Mentoring Task thành công", response));
    }

    @GetMapping("/by-deal/{dealId}")
    @Operation(summary = "Lấy thông tin Mentoring Task theo Deal ID",
               description = "Tra cứu Task đã được kích hoạt từ thỏa thuận Deal tương ứng")
    public ResponseEntity<ApiResponse<MentoringTaskResponse>> getTaskByDealId(@PathVariable Long dealId) {
        Long currentUserId = getCurrentUserId();
        MentoringTaskResponse response = taskService.getTaskByDealId(currentUserId, dealId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin Mentoring Task theo Deal thành công", response));
    }

    @GetMapping("/my-tasks")
    @Operation(summary = "Lấy danh sách Mentoring Tasks của người dùng hiện tại",
               description = "Trả về danh sách các Task mà người dùng tham gia (Student hoặc Mentor) có phân trang")
    public ResponseEntity<ApiResponse<PageResponse<MentoringTaskResponse>>> getMyTasks(
            @RequestParam(required = false) MentoringTaskStatus status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Long currentUserId = getCurrentUserId();
        PageResponse<MentoringTaskResponse> response = taskService.getMyTasks(currentUserId, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách Mentoring Tasks thành công", response));
    }

    private Long getCurrentUserId() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng đang đăng nhập."));
        return user.getId();
    }
}
