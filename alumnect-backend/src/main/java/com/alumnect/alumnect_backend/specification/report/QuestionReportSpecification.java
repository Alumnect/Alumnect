package com.alumnect.alumnect_backend.specification.report;

import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.entity.forum.ForumTopic;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Lớp hỗ trợ xây dựng truy vấn động (Specification) cho danh sách báo cáo câu hỏi vi phạm của Admin (UC78).
 */
public class QuestionReportSpecification {

    /**
     * Tạo Specification lọc báo cáo câu hỏi vi phạm theo các tham số tìm kiếm của Admin.
     *
     * @param query Từ khóa tìm kiếm (trong tiêu đề/nội dung câu hỏi, tên/email người báo cáo, hoặc tên/email tác giả câu hỏi)
     * @param reason Lý do báo cáo (SPAM, INAPPROPRIATE, etc. hoặc null/trống để bỏ qua)
     * @param status Trạng thái của báo cáo (PENDING, RESOLVED, DISMISSED hoặc null/trống để bỏ qua)
     * @param questionId ID câu hỏi bị báo cáo (tùy chọn)
     * @param topicId ID chủ đề diễn đàn (tùy chọn)
     * @return Specification của thực thể Report đối với loại nội dung câu hỏi
     */
    public static Specification<Report> filterQuestionReports(String query, String reason, String status, Long questionId, Long topicId) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 0. Bắt buộc phải là báo cáo câu hỏi (question_id IS NOT NULL)
            predicates.add(cb.isNotNull(root.get("question")));

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

            // 3. Lọc theo questionId
            if (questionId != null) {
                Join<Report, Question> questionJoin = root.join("question");
                predicates.add(cb.equal(questionJoin.get("id"), questionId));
            }

            // 4. Lọc theo topicId của câu hỏi
            if (topicId != null) {
                Join<Report, Question> questionJoin = root.join("question");
                Join<Question, ForumTopic> topicJoin = questionJoin.join("topic");
                predicates.add(cb.equal(topicJoin.get("id"), topicId));
            }

            // 5. Tìm kiếm theo từ khóa (query)
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";

                Join<Report, Question> questionJoin = root.join("question", JoinType.INNER);
                Join<Question, User> authorJoin = questionJoin.join("author", JoinType.INNER);
                Join<User, UserProfile> authorProfileJoin = authorJoin.join("profile", JoinType.LEFT);

                Join<Report, User> reporterJoin = root.join("reporter", JoinType.INNER);
                Join<User, UserProfile> reporterProfileJoin = reporterJoin.join("profile", JoinType.LEFT);

                Predicate questionTitlePredicate = cb.like(cb.lower(questionJoin.get("title")), pattern);
                Predicate questionBodyPredicate = cb.like(cb.lower(questionJoin.get("body")), pattern);
                Predicate authorNamePredicate = cb.like(cb.lower(authorProfileJoin.get("fullName")), pattern);
                Predicate authorEmailPredicate = cb.like(cb.lower(authorJoin.get("email")), pattern);
                Predicate reporterNamePredicate = cb.like(cb.lower(reporterProfileJoin.get("fullName")), pattern);
                Predicate reporterEmailPredicate = cb.like(cb.lower(reporterJoin.get("email")), pattern);

                predicates.add(cb.or(
                        questionTitlePredicate,
                        questionBodyPredicate,
                        authorNamePredicate,
                        authorEmailPredicate,
                        reporterNamePredicate,
                        reporterEmailPredicate
                ));
            }

            // Sắp xếp theo ngày tạo báo cáo mới nhất (giảm dần)
            criteriaQuery.orderBy(cb.desc(root.get("createdAt")));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
