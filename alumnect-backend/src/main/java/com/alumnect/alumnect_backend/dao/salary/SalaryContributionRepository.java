package com.alumnect.alumnect_backend.dao.salary;

import com.alumnect.alumnect_backend.entity.salary.SalaryContribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng salary_contributions
 * (đóng góp dữ liệu lương ẩn danh — UC50 Contribute salary data).
 */
@Repository
public interface SalaryContributionRepository extends JpaRepository<SalaryContribution, Long> {
}
