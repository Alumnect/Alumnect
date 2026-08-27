package com.alumnect.alumnect_backend.service.user;

import com.alumnect.alumnect_backend.dto.request.user.ChangePasswordRequest;
import com.alumnect.alumnect_backend.dto.request.user.UpdateProfileRequest;
import com.alumnect.alumnect_backend.dto.response.user.UserProfileResponse;

/**
 * Giao diện dịch vụ (Service Interface) quản lý các hoạt động nghiệp vụ của người dùng.
 * Bao gồm các chức năng như cập nhật thông tin cá nhân và thay đổi mật khẩu.
 */
public interface UserService {

    /**
     * Thực hiện thay đổi mật khẩu của tài khoản người dùng hiện tại.
     * Kiểm tra tính chính xác của mật khẩu cũ và cập nhật mật khẩu mới.
     *
     * @param email Địa chỉ email của người dùng yêu cầu đổi mật khẩu
     * @param request DTO chứa thông tin mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới
     */
    void changePassword(String email, ChangePasswordRequest request);

    /**
     * Lấy thông tin hồ sơ cá nhân của tài khoản hiện tại qua email đăng nhập.
     *
     * @param email Địa chỉ email của người dùng đăng nhập hiện tại
     * @return DTO chứa thông tin hồ sơ chi tiết của người dùng
     */
    UserProfileResponse getOwnProfile(String email);

    /**
     * Lấy thông tin hồ sơ cá nhân của người dùng khác qua ID tài khoản.
     * Hỗ trợ truy cập công khai và chỉ trả về thông tin khi tài khoản ở trạng thái ACTIVE.
     *
     * @param userId ID của người dùng cần lấy thông tin hồ sơ
     * @return DTO chứa thông tin hồ sơ chi tiết của người dùng đó
     */
    UserProfileResponse getUserProfile(Long userId);

    /**
     * Tìm kiếm và lọc danh sách thành viên trong mạng lưới cựu sinh viên & sinh viên (Alumni Directory).
     *
     * @param query Từ khóa tìm kiếm đa năng (tên, kỹ năng, công ty, chuyên ngành...)
     * @param role Vai trò người dùng (STUDENT hoặc ALUMNI)
     * @param majorId ID chuyên ngành
     * @param cohort Niên khóa / Khóa nhập học
     * @param city Tỉnh / Thành phố
     * @param skill Kỹ năng cụ thể
     * @param company Công ty làm việc
     * @param page Số trang (bắt đầu từ 0)
     * @param size Kích thước trang
     * @param sortBy Trường sắp xếp (createdAt, fullName, cohort)
     * @param sortDirection Hướng sắp xếp (ASC, DESC)
     * @return Danh sách phân trang người dùng bọc trong PageResponse<UserDirectoryResponse>
     */
    com.alumnect.alumnect_backend.common.api.PageResponse<com.alumnect.alumnect_backend.dto.response.user.UserDirectoryResponse> searchUsers(
            String query,
            String role,
            Long majorId,
            Integer cohort,
            String city,
            String skill,
            String company,
            int page,
            int size,
            String sortBy,
            String sortDirection
    );

    /**
     * Cập nhật thông tin hồ sơ cá nhân của tài khoản đăng nhập hiện tại.
     * Cập nhật thông tin cơ bản, học tập, giới thiệu, kỹ năng và các liên kết cá nhân.
     *
     * @param email Địa chỉ email của người dùng đăng nhập hiện tại
     * @param request DTO chứa dữ liệu hồ sơ cá nhân cần cập nhật
     * @return DTO chứa thông tin hồ sơ chi tiết sau khi cập nhật
     */
    UserProfileResponse updateOwnProfile(String email, UpdateProfileRequest request);
}

