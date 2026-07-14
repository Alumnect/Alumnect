package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng user_profiles (Thông tin cá nhân người dùng).
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    /** Kiểm tra mã số sinh viên đã tồn tại chưa (dùng khi đăng ký tài khoản mới tinh) */
    boolean existsByStudentCodeIgnoreCase(String studentCode);

    /** Kiểm tra mã số sinh viên đã tồn tại ở tài khoản khác chưa (dùng khi đăng ký đè/sửa tài khoản PENDING của chính mình) */
    boolean existsByStudentCodeIgnoreCaseAndUserIdNot(String studentCode, Long userId);
}
