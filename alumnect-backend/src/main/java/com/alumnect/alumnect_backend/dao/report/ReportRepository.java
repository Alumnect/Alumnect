package com.alumnect.alumnect_backend.dao.report;

import com.alumnect.alumnect_backend.entity.report.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.lang.Nullable;

import java.time.Instant;

/**
 * Truy vấn dữ liệu báo cáo nội dung cho UC24 và các UC kiểm duyệt sau này.
 */
public interface ReportRepository extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report> {

    @Override
    @EntityGraph(attributePaths = {"reporter", "reporter.profile", "post", "post.author", "post.author.profile"})
    Page<Report> findAll(@Nullable Specification<Report> spec, Pageable pageable);

    long countByReporterIdAndCreatedAtGreaterThanEqual(Long reporterId, Instant createdAt);
}
