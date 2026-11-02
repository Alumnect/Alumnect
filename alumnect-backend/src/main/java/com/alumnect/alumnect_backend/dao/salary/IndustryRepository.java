package com.alumnect.alumnect_backend.dao.salary;

import com.alumnect.alumnect_backend.entity.salary.Industry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng industries (danh mục ngành nghề — UC50).
 */
@Repository
public interface IndustryRepository extends JpaRepository<Industry, Long> {
}
