package com.alumnect.alumnect_backend.service.user;

import com.alumnect.alumnect_backend.dto.request.user.ChangePasswordRequest;
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
     * Cập nhật thông tin hồ sơ cá nhân của tài khoản đăng nhập hiện tại.
     * Cập nhật thông tin cơ bản, học tập, giới thiệu, kỹ năng và các liên kết cá nhân.
     *
     * @param email Địa chỉ email của người dùng đăng nhập hiện tại
     * @param request DTO chứa dữ liệu hồ sơ cá nhân cần cập nhật
     * @return DTO chứa thông tin hồ sơ chi tiết sau khi cập nhật
     */
    UserProfileResponse updateOwnProfile(String email, com.alumnect.alumnect_backend.dto.request.user.UpdateProfileRequest request);

}

