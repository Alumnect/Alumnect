package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng user_profiles (Thông tin cá nhân người dùng).
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    /** Kiểm tra mã số sinh viên đã tồn tại chưa (dùng khi đăng ký tài khoản mới tinh) */
    boolean existsByStudentCodeIgnoreCase(String studentCode);

    /** Kiểm tra mã số sinh viên đã tồn tại ở tài khoản khác chưa (dùng khi đăng ký đè/sửa tài khoản PENDING của chính mình) */
    boolean existsByStudentCodeIgnoreCaseAndUserIdNot(String studentCode, Long userId);

    /** Lấy danh sách tất cả các khóa học (Cohort) duy nhất của các tài khoản ACTIVE */
    @Query("SELECT DISTINCT up.cohort FROM UserProfile up WHERE up.cohort IS NOT NULL AND up.user.accountStatus = com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE AND up.user.role.name != 'ADMIN' ORDER BY up.cohort DESC")
    List<Integer> findDistinctCohorts();

    /** Lấy danh sách tất cả các tỉnh / thành phố duy nhất của các tài khoản ACTIVE */
    @Query("SELECT DISTINCT up.city FROM UserProfile up WHERE up.city IS NOT NULL AND TRIM(up.city) != '' AND up.user.accountStatus = com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE AND up.user.role.name != 'ADMIN' ORDER BY up.city ASC")
    List<String> findDistinctCities();
}


