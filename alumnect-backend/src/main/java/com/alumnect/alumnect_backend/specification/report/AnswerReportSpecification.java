package com.alumnect.alumnect_backend.specification.report;

import com.alumnect.alumnect_backend.common.enums.ReportReason;
import com.alumnect.alumnect_backend.common.enums.ReportStatus;
import com.alumnect.alumnect_backend.entity.forum.Answer;
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
 * Lớp hỗ trợ xây dựng truy vấn động (Specification) cho danh sách báo cáo câu trả lời vi phạm của Admin (UC79).
 */
public class AnswerReportSpecification {

    /**
     * Tạo Specification lọc báo cáo câu trả lời vi phạm theo các tham số tìm kiếm của Admin.
     *
     * @param query Từ khóa tìm kiếm (trong nội dung câu trả lời, tiêu đề câu hỏi, tên/email người báo cáo, hoặc tên/email tác giả câu trả lời)
     * @param reason Lý do báo cáo (SPAM, INAPPROPRIATE, etc. hoặc null/trống để bỏ qua)
     * @param status Trạng thái của báo cáo (PENDING, RESOLVED, DISMISSED hoặc null/trống để bỏ qua)
     * @param answerId ID câu trả lời bị báo cáo (tùy chọn)
     * @param questionId ID câu hỏi chứa câu trả lời (tùy chọn)
     * @return Specification của thực thể Report đối với loại nội dung câu trả lời
     */
    public static Specification<Report> filterAnswerReports(String query, String reason, String status, Long answerId, Long questionId) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 0. Bắt buộc phải là báo cáo câu trả lời (answer_id IS NOT NULL)
            predicates.add(cb.isNotNull(root.get("answer")));

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

            // 3. Lọc theo answerId
            if (answerId != null) {
                Join<Report, Answer> answerJoin = root.join("answer");
                predicates.add(cb.equal(answerJoin.get("id"), answerId));
            }

            // 4. Lọc theo questionId của câu hỏi chứa câu trả lời này
            if (questionId != null) {
                Join<Report, Answer> answerJoin = root.join("answer");
                Join<Answer, Question> questionJoin = answerJoin.join("question");
                predicates.add(cb.equal(questionJoin.get("id"), questionId));
            }

            // 5. Tìm kiếm theo từ khóa (query)
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";

                Join<Report, Answer> answerJoin = root.join("answer", JoinType.INNER);
                Join<Answer, Question> questionJoin = answerJoin.join("question", JoinType.INNER);
                Join<Answer, User> authorJoin = answerJoin.join("author", JoinType.INNER);
                Join<User, UserProfile> authorProfileJoin = authorJoin.join("profile", JoinType.LEFT);

                Join<Report, User> reporterJoin = root.join("reporter", JoinType.INNER);
                Join<User, UserProfile> reporterProfileJoin = reporterJoin.join("profile", JoinType.LEFT);

                Predicate answerContentPredicate = cb.like(cb.lower(answerJoin.get("body")), pattern);
                Predicate questionTitlePredicate = cb.like(cb.lower(questionJoin.get("title")), pattern);
                Predicate authorNamePredicate = cb.like(cb.lower(authorProfileJoin.get("fullName")), pattern);
                Predicate authorEmailPredicate = cb.like(cb.lower(authorJoin.get("email")), pattern);
                Predicate reporterNamePredicate = cb.like(cb.lower(reporterProfileJoin.get("fullName")), pattern);
                Predicate reporterEmailPredicate = cb.like(cb.lower(reporterJoin.get("email")), pattern);

                predicates.add(cb.or(
                        answerContentPredicate,
                        questionTitlePredicate,
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
