package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng user_profiles (Thông tin cá nhân người dùng).
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
}
