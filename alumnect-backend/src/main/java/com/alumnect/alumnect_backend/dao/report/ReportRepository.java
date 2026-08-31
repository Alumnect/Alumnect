package com.alumnect.alumnect_backend.dao.report;

import com.alumnect.alumnect_backend.entity.report.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;

/**
 * Truy vấn dữ liệu báo cáo nội dung cho UC24 và các UC kiểm duyệt sau này.
 */
public interface ReportRepository extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report> {

    long countByReporterIdAndCreatedAtGreaterThanEqual(Long reporterId, Instant createdAt);
}
