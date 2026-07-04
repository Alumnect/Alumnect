package com.alumnect.alumnect_backend.dao.alumnemap;

import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository quản lý các truy vấn dữ liệu liên quan đến bản đồ cựu sinh viên.
 * Định nghĩa phương thức truy xuất thông tin địa lý và hồ sơ công khai của Alumni.
 */
@Repository
public interface AlumniMapRepository extends JpaRepository<UserProfile, Long> {

    /**
     * Truy vấn danh sách hồ sơ cựu sinh viên (ALUMNI) có tọa độ hợp lệ,
     * tài khoản đang ở trạng thái ACTIVE và hồ sơ ở chế độ công khai (isPublic = true).
     *
     * @return Danh sách thực thể UserProfile đáp ứng các điều kiện trên
     */
    @Query("SELECT up FROM UserProfile up JOIN up.user u " +
           "WHERE up.latitude IS NOT NULL AND up.longitude IS NOT NULL " +
           "AND u.accountStatus = com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE " +
           "AND u.role.name = 'ALUMNI'")
    List<UserProfile> findAllActiveAlumniWithCoordinates();
}
