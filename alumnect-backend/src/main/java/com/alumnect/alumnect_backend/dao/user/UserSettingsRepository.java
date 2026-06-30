package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.entity.user.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng user_settings (Cài đặt hiển thị và ngôn ngữ của người dùng).
 */
@Repository
public interface UserSettingsRepository extends JpaRepository<UserSettings, Long> {
}
