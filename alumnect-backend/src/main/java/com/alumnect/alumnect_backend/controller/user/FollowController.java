package com.alumnect.alumnect_backend.controller.user;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.user.FollowUserResponse;
import com.alumnect.alumnect_backend.service.user.FollowService;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các yêu cầu liên quan đến chức năng theo dõi (Follow) và hủy theo dõi (Unfollow).
 * Được map tự động với prefix global /api/v1/users.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Validated
@Slf4j
public class FollowController {

    private final FollowService followService;

    // [H-03] Giới hạn tối đa page size để tránh tấn công DOS
    private static final int MAX_PAGE_SIZE = 50;

    /**
     * API Theo dõi một người dùng.
     * POST /{userId}/follow — Tạo mối quan hệ follow (REST cầu).
     * Yêu cầu xác thực JWT qua Token.
     *
     * @param userId ID của người dùng cần theo dõi
     * @return Response phản hồi thành công
     */
    @PostMapping("/{userId}/follow")
    public ResponseEntity<ApiResponse<Void>> followUser(@PathVariable @Positive Long userId) {
        String email = getAuthenticatedUserEmail();
        log.info("API Follow: user {} yêu cầu follow user {}", email, userId);
        followService.followUser(email, userId);
        return ResponseEntity.ok(ApiResponse.success("Theo dõi người dùng thành công!", null));
    }

    /**
     * API Hủy theo dõi một người dùng.
     * DELETE /{userId}/follow — Xóa mối quan hệ follow (REST chuẩn).
     * Yêu cầu xác thực JWT qua Token.
     *
     * @param userId ID của người dùng cần hủy theo dõi
     * @return Response phản hồi thành công
     */
    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<ApiResponse<Void>> unfollowUser(@PathVariable @Positive Long userId) {
        String email = getAuthenticatedUserEmail();
        log.info("API Unfollow: user {} yêu cầu unfollow user {}", email, userId);
        followService.unfollowUser(email, userId);
        return ResponseEntity.ok(ApiResponse.success("Hủy theo dõi người dùng thành công!", null));
    }

    /**
     * API Lấy danh sách người theo dõi (followers) của một người dùng.
     * Cho phép truy cập công khai không cần token (GET).
     *
     * @param userId ID của người dùng cần xem danh sách người theo dõi
     * @param page Số thứ tự trang cần lấy (mặc định = 0)
     * @param size Kích thước mỗi trang (mặc định = 10)
     * @return Phản hồi bọc PageResponse của danh sách FollowUserResponse
     */
    @GetMapping("/{userId}/followers")
    public ResponseEntity<ApiResponse<PageResponse<FollowUserResponse>>> getFollowers(
            @PathVariable @Positive Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (page < 0) page = 0;
        if (size <= 0) size = 10;
        if (size > MAX_PAGE_SIZE) size = MAX_PAGE_SIZE; // [H-03] Giới hạn tối đa
        String currentViewerEmail = getAuthenticatedUserEmailOrNull();
        log.info("API Get Followers: userId={}, page={}, size={}, viewer={}", userId, page, size, currentViewerEmail);
        // [H-02] Sort theo createdAt DESC — mới nhất lên đầu
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<FollowUserResponse> result = followService.getFollowers(currentViewerEmail, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người theo dõi thành công!", result));
    }

    /**
     * API Lấy danh sách người mà người dùng đang theo dõi (following).
     * Cho phép truy cập công khai không cần token (GET).
     *
     * @param userId ID của người dùng cần xem danh sách đang theo dõi
     * @param page Số thứ tự trang cần lấy (mặc định = 0)
     * @param size Kích thước mỗi trang (mặc định = 10)
     * @return Phản hồi bọc PageResponse của danh sách FollowUserResponse
     */
    @GetMapping("/{userId}/following")
    public ResponseEntity<ApiResponse<PageResponse<FollowUserResponse>>> getFollowing(
            @PathVariable @Positive Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (page < 0) page = 0;
        if (size <= 0) size = 10;
        if (size > MAX_PAGE_SIZE) size = MAX_PAGE_SIZE; // [H-03] Giới hạn tối đa
        String currentViewerEmail = getAuthenticatedUserEmailOrNull();
        log.info("API Get Following: userId={}, page={}, size={}, viewer={}", userId, page, size, currentViewerEmail);
        // [H-02] Sort theo createdAt DESC
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<FollowUserResponse> result = followService.getFollowing(currentViewerEmail, userId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đang theo dõi thành công!", result));
    }

    private String getAuthenticatedUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private String getAuthenticatedUserEmailOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !"anonymousUser".equals(authentication.getName())) {
            return authentication.getName();
        }
        return null;
    }
}
