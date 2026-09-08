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
     * @param query Từ khóa tìm kiếm nội dung bài viết
     * @param author Từ khóa tìm kiếm tác giả hoặc người báo cáo
     * @param reason Lý do báo cáo (SPAM, INAPPROPRIATE, etc. hoặc null/trống để bỏ qua)
     * @param status Trạng thái của báo cáo (PENDING, RESOLVED, DISMISSED hoặc null/trống để bỏ qua)
     * @param type Loại bài viết (GENERAL, ACHIEVEMENT, RECRUITMENT, EVENT hoặc null/trống để bỏ qua)
     * @param postId ID bài viết bị báo cáo (tùy chọn)
     * @return Specification của thực thể Report
     */
    @SuppressWarnings("unchecked")
    public static Specification<Report> filterReports(String query, String author, String reason, String status, String type, Long postId) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 0. Báo cáo bài viết chỉ lấy các bản ghi có bài viết (post IS NOT NULL)
            predicates.add(cb.isNotNull(root.get("post")));

            // Hàm hỗ trợ lấy hoặc tái sử dụng join tới Post
            java.util.function.Supplier<Join<Report, Post>> getPostJoin = () ->
                    root.getJoins().stream()
                            .filter(j -> "post".equals(j.getAttribute().getName()))
                            .map(j -> (Join<Report, Post>) j)
                            .findFirst()
                            .orElseGet(() -> root.join("post"));

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
                predicates.add(cb.equal(getPostJoin.get().get("id"), postId));
            }

            // 4. Lọc theo loại bài viết (category: GENERAL, ACHIEVEMENT, RECRUITMENT, EVENT)
            if (type != null && !type.trim().isEmpty() && !"ALL".equalsIgnoreCase(type.trim())) {
                try {
                    String typeStr = type.trim().toUpperCase();
                    if ("NORMAL".equals(typeStr)) {
                        typeStr = "GENERAL";
                    }
                    predicates.add(cb.equal(cb.upper(getPostJoin.get().get("category").as(String.class)), typeStr));
                } catch (Exception ignored) {
                }
            }

            // 5. Tìm kiếm theo nội dung bài viết (query)
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Join<Report, Post> postJoinForQuery = getPostJoin.get();
                predicates.add(cb.like(cb.lower(postJoinForQuery.get("content")), pattern));
            }

            // 6. Tìm kiếm theo tác giả bài viết hoặc người gửi báo cáo (author)
            if (author != null && !author.trim().isEmpty()) {
                String pattern = "%" + author.trim().toLowerCase() + "%";
                Join<Report, Post> postJoinForAuthor = getPostJoin.get();
                Join<Post, User> authorJoin = postJoinForAuthor.join("author");
                Join<User, UserProfile> authorProfileJoin = authorJoin.join("profile");

                Join<Report, User> reporterJoin = root.join("reporter");
                Join<User, UserProfile> reporterProfileJoin = reporterJoin.join("profile");

                predicates.add(cb.or(
                        cb.like(cb.lower(reporterProfileJoin.get("fullName")), pattern),
                        cb.like(cb.lower(reporterJoin.get("email")), pattern),
                        cb.like(cb.lower(authorProfileJoin.get("fullName")), pattern),
                        cb.like(cb.lower(authorJoin.get("email")), pattern)
                ));
            }

            // Mặc định sắp xếp theo ngày tạo báo cáo mới nhất (giảm dần)
            criteriaQuery.orderBy(cb.desc(root.get("createdAt")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
