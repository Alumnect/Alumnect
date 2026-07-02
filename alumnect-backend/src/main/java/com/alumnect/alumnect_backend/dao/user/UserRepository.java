package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.entity.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng users (Tài khoản người dùng).
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Tìm kiếm người dùng bằng địa chỉ email.
     *
     * @param email Địa chỉ email cần tìm
     * @return Optional chứa thông tin người dùng nếu tìm thấy
     */
    Optional<User> findByEmail(String email);

    /**
     * Kiểm tra xem địa chỉ email đã tồn tại trong hệ thống chưa.
     *
     * @param email Địa chỉ email cần kiểm tra
     * @return true nếu email đã tồn tại, ngược lại false
     */
    boolean existsByEmail(String email);
}
