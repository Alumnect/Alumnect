package com.alumnect.alumnect_backend.dao.report;

import com.alumnect.alumnect_backend.entity.report.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

/** Truy vấn dữ liệu báo cáo nội dung cho UC24 và các UC kiểm duyệt sau này. */
public interface ReportRepository extends JpaRepository<Report, Long> {

    long countByReporterIdAndCreatedAtGreaterThanEqual(Long reporterId, Instant createdAt);
}
