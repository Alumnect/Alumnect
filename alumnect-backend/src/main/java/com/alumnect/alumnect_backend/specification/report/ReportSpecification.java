package com.alumnect.alumnect_backend.specification.report;

import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Lớp hỗ trợ xây dựng truy vấn động (Specification) cho danh sách báo cáo vi phạm của Admin.
 */
public class ReportSpecification {

    /**
     * Tạo Specification lọc báo cáo vi phạm theo các tham số tìm kiếm của Admin.
     *
     * @param query Từ khóa tìm kiếm (trong nội dung bài viết, tên/email người báo cáo, hoặc tên/email tác giả bài viết)
     * @param reason Lý do báo cáo (SPAM, INAPPROPRIATE, etc. hoặc null/trống để bỏ qua)
     * @param status Trạng thái của báo cáo (PENDING, RESOLVED, DISMISSED hoặc null/trống để bỏ qua)
     * @param postId ID bài viết bị báo cáo (tùy chọn)
     * @return Specification của thực thể Report
     */
    @SuppressWarnings("unchecked")
    public static Specification<Report> filterReports(String query, String reason, String status, Long postId) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Lọc theo trạng thái báo cáo
            if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
                try {
                    ReportStatus statusEnum = ReportStatus.valueOf(status.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("status"), statusEnum));
                } catch (IllegalArgumentException e) {
                    // Bỏ qua nếu giá trị trạng thái không hợp lệ
                }
            }

            // 2. Lọc theo lý do báo cáo
            if (reason != null && !reason.trim().isEmpty() && !"ALL".equalsIgnoreCase(reason.trim())) {
                try {
                    ReportReason reasonEnum = ReportReason.valueOf(reason.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("reason"), reasonEnum));
                } catch (IllegalArgumentException e) {
                    // Bỏ qua nếu giá trị lý do không hợp lệ
                }
            }

            // 3. Lọc theo postId
            if (postId != null) {
                Join<Report, Post> postJoin = root.join("post");
                predicates.add(cb.equal(postJoin.get("id"), postId));
            }

            // 4. Tìm kiếm theo từ khóa (query)
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                
                // Sử dụng Join để tìm kiếm qua các thực thể liên quan
                Join<Report, Post> postJoinForQuery;
                if (postId != null) {
                    // Tái sử dụng join post nếu đã có sẵn trong criteria query
                    postJoinForQuery = root.getJoins().stream()
                            .filter(j -> "post".equals(j.getAttribute().getName()))
                            .map(j -> (Join<Report, Post>) j)
                            .findFirst()
                            .orElseGet(() -> root.join("post"));
                } else {
                    postJoinForQuery = root.join("post");
                }
                
                Join<Post, User> authorJoin = postJoinForQuery.join("author");
                Join<User, UserProfile> authorProfileJoin = authorJoin.join("profile");

                Join<Report, User> reporterJoin = root.join("reporter");
                Join<User, UserProfile> reporterProfileJoin = reporterJoin.join("profile");

                Predicate postContentPredicate = cb.like(cb.lower(postJoinForQuery.get("content")), pattern);
                Predicate reporterNamePredicate = cb.like(cb.lower(reporterProfileJoin.get("fullName")), pattern);
                Predicate reporterEmailPredicate = cb.like(cb.lower(reporterJoin.get("email")), pattern);
                Predicate authorNamePredicate = cb.like(cb.lower(authorProfileJoin.get("fullName")), pattern);
                Predicate authorEmailPredicate = cb.like(cb.lower(authorJoin.get("email")), pattern);

                predicates.add(cb.or(
                        postContentPredicate,
                        reporterNamePredicate,
                        reporterEmailPredicate,
                        authorNamePredicate,
                        authorEmailPredicate
                ));
            }

            // Mặc định sắp xếp theo ngày tạo báo cáo mới nhất (giảm dần)
            criteriaQuery.orderBy(cb.desc(root.get("createdAt")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
