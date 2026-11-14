package com.alumnect.alumnect_backend.dao.report;

import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.entity.report.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.Nullable;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Truy vấn dữ liệu báo cáo nội dung cho UC24 và các UC kiểm duyệt sau này.
 */
public interface ReportRepository extends JpaRepository<Report, Long>, JpaSpecificationExecutor<Report> {

    @Override
    @EntityGraph(attributePaths = {"reporter", "reporter.profile", "post", "post.author", "post.author.profile"})
    Page<Report> findAll(@Nullable Specification<Report> spec, Pageable pageable);

    long countByReporterIdAndCreatedAtGreaterThanEqual(Long reporterId, Instant createdAt);

    /**
     * Tìm báo cáo hệ thống đang chờ xử lý của một bài viết để cập nhật thay vì tạo bản ghi trùng.
     *
     * @param postId ID bài viết
     * @param status Trạng thái báo cáo
     * @return Báo cáo hệ thống đầu tiên nếu có
     */
    Optional<Report> findFirstByPostIdAndReporterIsNullAndStatus(Long postId, ReportStatus status);

    /**
     * Kiểm tra Admin đã xử lý báo cáo của bài viết với đúng tập từ khóa này hay chưa.
     *
     * @param postId           ID bài viết
     * @param status           Trạng thái báo cáo
     * @param detectedKeywords Danh sách từ khóa đã nối thành chuỗi
     * @return true nếu tồn tại báo cáo phù hợp
     */
    boolean existsByPostIdAndStatusAndDetectedKeywords(Long postId, ReportStatus status, String detectedKeywords);

    /**
     * Kiểm tra bài viết còn báo cáo tự động ẩn nào khác chưa bị bỏ qua hay không.
     *
     * @param postId   ID bài viết
     * @param status   Trạng thái cần loại trừ
     * @param reportId ID báo cáo cần loại trừ
     * @return true nếu còn báo cáo tự động ẩn khác giữ bài viết ở trạng thái ẩn
     */
    boolean existsByPostIdAndAutoModeratedTrueAndStatusNotAndIdNot(Long postId, ReportStatus status, Long reportId);

    /**
     * Đếm số lượt người dùng báo cáo của từng bài viết, dùng để cộng điểm rủi ro.
     * Mô tả chi tiết: chỉ đếm báo cáo có người gửi (bỏ báo cáo hệ thống) và bỏ qua báo cáo ở trạng thái loại trừ.
     *
     * @param postIds        Danh sách ID bài viết cần đếm
     * @param excludedStatus Trạng thái báo cáo không được tính (thường là DISMISSED)
     * @return Mỗi phần tử gồm [ID bài viết, số lượt báo cáo]
     */
    @Query("SELECT r.post.id, COUNT(r) FROM Report r "
            + "WHERE r.post.id IN :postIds AND r.reporter IS NOT NULL AND r.status <> :excludedStatus "
            + "GROUP BY r.post.id")
    List<Object[]> countUserReportsByPostIds(@Param("postIds") Collection<Long> postIds,
                                             @Param("excludedStatus") ReportStatus excludedStatus);
}
