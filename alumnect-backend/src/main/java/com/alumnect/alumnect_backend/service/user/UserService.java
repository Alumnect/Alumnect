package com.alumnect.alumnect_backend.service.user;

import com.alumnect.alumnect_backend.dto.request.user.ChangePasswordRequest;

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
}
