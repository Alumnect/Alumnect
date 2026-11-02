package com.alumnect.alumnect_backend.controller.user;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.user.ChangePasswordRequest;
import com.alumnect.alumnect_backend.dto.request.user.UpdateProfileRequest;
import com.alumnect.alumnect_backend.dto.response.user.ConnectionSuggestionResponse;
import com.alumnect.alumnect_backend.dto.response.user.UserDirectoryResponse;
import com.alumnect.alumnect_backend.dto.response.user.UserFilterOptionsResponse;
import com.alumnect.alumnect_backend.dto.response.user.UserProfileResponse;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


/**
 * Controller xử lý các yêu cầu liên quan đến quản lý thông tin tài khoản người dùng.
 * Được map tự động với prefix global /api/v1/users.
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * API Tìm kiếm và lọc danh sách thành viên trong mạng lưới AlumNect (Alumni Directory).
     * Hỗ trợ tìm kiếm từ khóa đa trường, lọc theo vai trò, chuyên ngành, niên khóa, địa điểm, kỹ năng, công ty.
     * Endpoint công khai cho cả khách vãng lai và thành viên đã đăng nhập.
     *
     * @param query Từ khóa tìm kiếm
     * @param role Vai trò người dùng (STUDENT / ALUMNI)
     * @param majorId ID chuyên ngành
     * @param cohort Niên khóa
     * @param city Tỉnh / Thành phố
     * @param skill Kỹ năng
     * @param company Công ty
     * @param page Số trang (mặc định: 0, tối thiểu 0)
     * @param size Kích thước trang (mặc định: 12, từ 1 đến 100)
     * @param sortBy Tiêu chí sắp xếp (createdAt, fullName, cohort)
     * @param sortDirection Hướng sắp xếp (ASC, DESC)
     * @return Danh sách phân trang người dùng phù hợp
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<UserDirectoryResponse>>> searchUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long majorId,
            @RequestParam(required = false) Integer cohort,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String company,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        if (page < 0) {
            throw new BadRequestException("Số trang (page) không được nhỏ hơn 0.");
        }
        if (size <= 0 || size > 100) {
            throw new BadRequestException("Kích thước trang (size) phải từ 1 đến 100.");
        }

        PageResponse<UserDirectoryResponse> result = userService.searchUsers(
                query, role, majorId, cohort, city, skill, company, page, size, sortBy, sortDirection
        );
        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm danh sách người dùng thành công!", result));
    }

    /**
     * API Lấy danh sách các tùy chọn lọc động (Khóa học, Tỉnh/Thành phố) có sẵn trong Database.
     * Endpoint công khai phục vụ render Modal bộ lọc.
     *
     * @return DTO chứa danh sách khóa học và thành phố thực tế
     */
    @GetMapping("/filter-options")
    public ResponseEntity<ApiResponse<UserFilterOptionsResponse>> getFilterOptions() {
        UserFilterOptionsResponse options = userService.getFilterOptions();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tùy chọn bộ lọc thành công!", options));
    }

    /**
     * API Gợi ý kết nối thành viên (UC10 - View Connection Suggestions).
     * Endpoint công khai cho cả khách vãng lai và thành viên đã đăng nhập.
     * Nếu đã đăng nhập, tự động lấy thông tin từ SecurityContext để cá nhân hóa đề xuất (cùng ngành, cùng khóa, cùng địa điểm).
     *
     * @param limit Số lượng đề xuất (mặc định 5, từ 1 đến 50)
     * @return Danh sách thành viên được gợi ý kèm lý do
     */
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<ConnectionSuggestionResponse>>> getConnectionSuggestions(
            @RequestParam(defaultValue = "5") int limit
    ) {
        if (limit <= 0 || limit > 50) {
            throw new BadRequestException("Số lượng gợi ý (limit) phải từ 1 đến 50.");
        }

        String email = null;
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getName())) {
            email = authentication.getName();
        }

        List<ConnectionSuggestionResponse> suggestions = userService.getConnectionSuggestions(email, limit);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách gợi ý kết nối thành công!", suggestions));
    }



    /**
     * API Đổi mật khẩu tài khoản người dùng hiện tại.
     * Tiếp nhận dữ liệu, kiểm tra hợp lệ DTO, lấy email tài khoản đăng nhập từ token để tiến hành đổi.
     *
     * @param request DTO chứa mật khẩu cũ, mật khẩu mới và xác nhận
     * @return Response phản hồi đổi mật khẩu thành công
     */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.changePassword(email, request);
        return ResponseEntity.ok(ApiResponse.success("Đổi mật khẩu thành công!", null));
    }

    /**
     * API Lấy thông tin hồ sơ cá nhân của người dùng hiện tại (Own Profile).
     * Yêu cầu xác thực JWT qua Token.
     *
     * @return Response phản hồi chứa DTO hồ sơ cá nhân
     */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getOwnProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserProfileResponse profile = userService.getOwnProfile(email);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ cá nhân thành công!", profile));
    }

    /**
     * API Lấy thông tin hồ sơ cá nhân của người dùng khác qua ID (Other Profile).
     * Endpoint này là công khai, không yêu cầu xác thực JWT.
     *
     * @param userId ID của người dùng cần xem hồ sơ
     * @return Response phản hồi chứa DTO hồ sơ cá nhân
     */
    @GetMapping("/profile/{userId}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserProfile(@PathVariable Long userId) {
        UserProfileResponse profile = userService.getUserProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ người dùng thành công!", profile));
    }

    /**
     * API Cập nhật thông tin hồ sơ cá nhân của người dùng hiện tại (Update Own Profile).
     * Yêu cầu xác thực JWT qua Token.
     *
     * @param request DTO chứa thông tin hồ sơ cá nhân cần cập nhật
     * @return Response phản hồi chứa DTO hồ sơ cá nhân sau khi cập nhật thành công
     */
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateOwnProfile(@Valid @RequestBody UpdateProfileRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        UserProfileResponse profile = userService.updateOwnProfile(email, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin hồ sơ cá nhân thành công!", profile));
    }
}



