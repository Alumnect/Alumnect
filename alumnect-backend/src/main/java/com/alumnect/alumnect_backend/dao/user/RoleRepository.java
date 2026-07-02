package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.entity.user.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng roles (Vai trò).
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    /**
     * Tìm kiếm vai trò theo tên (STUDENT, ALUMNI, ADMIN).
     *
     * @param name Tên vai trò cần tìm
     * @return Optional chứa vai trò nếu tìm thấy
     */
    Optional<Role> findByName(String name);
}
