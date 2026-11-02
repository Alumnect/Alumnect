package com.alumnect.alumnect_backend.specification.post;

import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import java.util.ArrayList;
import java.util.List;

/**
 * Lớp hỗ trợ xây dựng truy vấn động (Specification) cho bảng posts của Admin.
 */
public class PostSpecification {

    /**
     * Tạo Specification lọc bài viết theo các tham số tìm kiếm của Admin.
     *
     * @param query Từ khóa tìm kiếm trong nội dung bài viết
     * @param author Từ khóa tìm kiếm theo tên hoặc email tác giả
     * @param status Trạng thái bài viết lọc (VISIBLE, HIDDEN, hoặc ALL)
     * @return Specification của thực thể Post
     */
    public static Specification<Post> filterPosts(String query, String author, String status, String type) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Tìm theo từ khóa nội dung (content)
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("content")), pattern));
            }

            // 2. Tìm theo tác giả (FullName hoặc Email)
            if (author != null && !author.trim().isEmpty()) {
                String pattern = "%" + author.trim().toLowerCase() + "%";
                Join<Post, User> userJoin = root.join("author");
                // The User entity doesn't have a direct profile relationship, or wait, it does! (mappedBy = "user")
                // Yes, User has private UserProfile profile;
                Join<User, UserProfile> profileJoin = userJoin.join("profile");

                Predicate emailPredicate = cb.like(cb.lower(userJoin.get("email")), pattern);
                Predicate namePredicate = cb.like(cb.lower(profileJoin.get("fullName")), pattern);
                predicates.add(cb.or(emailPredicate, namePredicate));
            }

            // 3. Lọc theo trạng thái ẩn
            if (status != null && !status.trim().isEmpty()) {
                String statusUpper = status.trim().toUpperCase();
                if ("VISIBLE".equals(statusUpper)) {
                    predicates.add(cb.equal(root.get("status"), PostStatus.ACTIVE));
                } else if ("HIDDEN".equals(statusUpper)) {
                    predicates.add(cb.equal(root.get("status"), PostStatus.HIDDEN));
                } else if ("DELETED".equals(statusUpper)) {
                    predicates.add(cb.equal(root.get("status"), PostStatus.DELETED));
                }
            }

            // 4. Lọc theo loại bài viết (category)
            if (type != null && !type.trim().isEmpty() && !"ALL".equalsIgnoreCase(type.trim())) {
                try {
                    String typeStr = type.trim().toUpperCase();
                    if ("NORMAL".equals(typeStr)) {
                        typeStr = "GENERAL";
                    }
                    predicates.add(cb.equal(cb.upper(root.get("category").as(String.class)), typeStr));
                } catch (Exception e) {
                    // Bỏ qua nếu có lỗi convert
                }
            }

            // Mặc định sắp xếp theo ngày tạo mới nhất (giảm dần)
            criteriaQuery.orderBy(cb.desc(root.get("createdAt")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
