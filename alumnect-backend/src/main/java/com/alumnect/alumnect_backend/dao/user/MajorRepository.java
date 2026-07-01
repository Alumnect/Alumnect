package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.entity.user.Major;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng majors (Chuyên ngành).
 */
@Repository
public interface MajorRepository extends JpaRepository<Major, Long> {
}
