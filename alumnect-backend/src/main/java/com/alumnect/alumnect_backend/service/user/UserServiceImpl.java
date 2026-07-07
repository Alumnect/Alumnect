package com.alumnect.alumnect_backend.service.user;

import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.user.ChangePasswordRequest;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lớp triển khai dịch vụ (Service Implementation) quản lý thông tin tài khoản người dùng.
 * Thực thi interface {@link UserService}.
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    /**
     * Thực hiện thay đổi mật khẩu tài khoản người dùng.
     * Quy trình xử lý bao gồm:
     * 1. Tìm người dùng trong DB qua email.
     * 2. Xác thực mật khẩu cũ bằng BCrypt. Nếu passwordHash là null hoặc không khớp, ném BadRequestException.
     * 3. So sánh mật khẩu mới với mật khẩu cũ để tránh trùng lặp.
     * 4. Kiểm tra sự trùng khớp của xác nhận mật khẩu mới.
     * 5. Mã hóa mật khẩu mới và lưu vào DB.
     *
     * @param email Địa chỉ email của người dùng yêu cầu đổi mật khẩu
     * @param request DTO chứa thông tin mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới
     */
    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với email: " + email));

        // 1. Xác thực mật khẩu hiện tại (so khớp BCrypt)
        // Nếu passwordHash null (đăng ký qua Google chưa tạo pass) hoặc passwordEncoder so khớp không trùng
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác.");
        }

        // 2. Kiểm tra mật khẩu mới trùng mật khẩu cũ
        if (request.getNewPassword().equals(request.getOldPassword())) {
            throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
        }

        // 3. Kiểm tra mật khẩu mới khớp với confirm mật khẩu mới
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new BadRequestException("Xác nhận mật khẩu mới không trùng khớp.");
        }

        // 4. Cập nhật mật khẩu mới mã hóa
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
