package com.alumnect.alumnect_backend.specification.mentorship;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.common.util.VietnameseStringUtils;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorSearchCriteria;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSupportedField;
import com.alumnect.alumnect_backend.entity.mentorship.MentorTopic;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.user.UserSkill;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Lớp cung cấp JPA Specification tạo câu truy vấn động cho chức năng Tìm kiếm & Lọc Mentor (UC98).
 * Áp dụng Subquery đối với các quan hệ một-nhiều (Skills, Topics, Fields, Experiences)
 * để tránh hiện tượng nhân bản số dòng (Cartesian product), đảm bảo phân trang chính xác tuyệt đối.
 */
public class MentorSpecification {

    /**
     * Tạo Specification lọc danh sách Mentor theo tiêu chí tổng hợp.
     *
     * @param criteria Tiêu chí tìm kiếm & bộ lọc từ client
     * @param now Thời điểm hiện tại dùng kiểm tra hiệu lực gói đăng ký
     * @return Specification lọc MentorProfile
     */
    public static Specification<MentorProfile> filterMentors(MentorSearchCriteria criteria, Instant now) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Chỉ lấy hồ sơ Mentor ở trạng thái ACTIVE (BR-02 & Tiền điều kiện UC98)
            predicates.add(cb.equal(root.get("mentorStatus"), MentorStatus.ACTIVE));

            // 2. Chỉ lấy tài khoản người dùng đang hoạt động (ACTIVE)
            Join<MentorProfile, User> userJoin = root.join("user", JoinType.INNER);
            predicates.add(cb.equal(userJoin.get("accountStatus"), AccountStatus.ACTIVE));

            // 3. Gói đăng ký Mentor Subscription phải đang có hiệu lực (ACTIVE hoặc PAID và chưa hết hạn)
            Subquery<Long> subQuery = query.subquery(Long.class);
            Root<MentorSubscription> subRoot = subQuery.from(MentorSubscription.class);
            subQuery.select(subRoot.get("id"));
            Predicate subProfileMatch = cb.equal(subRoot.get("mentorProfile").get("id"), root.get("id"));
            Predicate subStatusMatch = subRoot.get("status").in(
                    MentorSubscriptionStatus.ACTIVE,
                    MentorSubscriptionStatus.PAID
            );
            Predicate subNotExpired = cb.greaterThan(subRoot.get("endDate"), now);
            subQuery.where(subProfileMatch, subStatusMatch, subNotExpired);
            predicates.add(cb.exists(subQuery));

            // Join UserProfile & Major (quan hệ 1-1 và Many-to-1)
            Join<User, UserProfile> profileJoin = userJoin.join("profile", JoinType.INNER);
            Join<UserProfile, Major> majorJoin = profileJoin.join("major", JoinType.LEFT);

            // 4. Lọc theo lĩnh vực / ngành nghề chuyên môn (Field / Industry)
            if (criteria.getFieldId() != null && criteria.getFieldId() > 0) {
                Subquery<Long> fieldSub = query.subquery(Long.class);
                Root<MentorSupportedField> fieldRoot = fieldSub.from(MentorSupportedField.class);
                fieldSub.select(fieldRoot.get("id"));
                fieldSub.where(
                        cb.equal(fieldRoot.get("mentorProfile").get("id"), root.get("id")),
                        cb.equal(fieldRoot.get("industry").get("id"), criteria.getFieldId())
                );
                predicates.add(cb.exists(fieldSub));
            }

            // 5. Lọc theo chuyên ngành học (Specialization / Major)
            if (criteria.getSpecializationId() != null && criteria.getSpecializationId() > 0) {
                predicates.add(cb.equal(majorJoin.get("id"), criteria.getSpecializationId()));
            } else if (criteria.getSpecialization() != null && !criteria.getSpecialization().trim().isEmpty()) {
                String rawSpec = criteria.getSpecialization().trim().toLowerCase();
                String unaccentedSpec = VietnameseStringUtils.removeAccents(rawSpec);
                String specPattern = "%" + unaccentedSpec + "%";

                Expression<String> unaccentMajorName = cb.function("unaccent", String.class, cb.lower(majorJoin.get("name")));
                Expression<String> unaccentMajorCode = cb.function("unaccent", String.class, cb.lower(majorJoin.get("code")));

                Subquery<Long> topicSub = query.subquery(Long.class);
                Root<MentorTopic> topicRoot = topicSub.from(MentorTopic.class);
                topicSub.select(topicRoot.get("id"));
                Expression<String> unaccentTopic = cb.function("unaccent", String.class, cb.lower(topicRoot.get("topicName")));
                topicSub.where(
                        cb.equal(topicRoot.get("mentorProfile").get("id"), root.get("id")),
                        cb.like(unaccentTopic, specPattern)
                );

                predicates.add(cb.or(
                        cb.like(unaccentMajorName, specPattern),
                        cb.like(unaccentMajorCode, specPattern),
                        cb.exists(topicSub)
                ));
            }

            // 6. Lọc theo kỹ năng chuyên môn (Skills)
            List<String> targetSkills = new ArrayList<>();
            if (criteria.getSkill() != null && !criteria.getSkill().trim().isEmpty()) {
                targetSkills.add(criteria.getSkill().trim());
            }
            if (criteria.getSkills() != null && !criteria.getSkills().isEmpty()) {
                for (String s : criteria.getSkills()) {
                    if (s != null && !s.trim().isEmpty() && !targetSkills.contains(s.trim())) {
                        targetSkills.add(s.trim());
                    }
                }
            }

            for (String singleSkill : targetSkills) {
                String unaccentedSkill = VietnameseStringUtils.removeAccents(singleSkill.toLowerCase());
                String skillPattern = "%" + unaccentedSkill + "%";

                Subquery<Long> skillSub = query.subquery(Long.class);
                Root<UserSkill> skillRoot = skillSub.from(UserSkill.class);
                skillSub.select(skillRoot.get("id"));
                Expression<String> unaccentSkillExpr = cb.function("unaccent", String.class, cb.lower(skillRoot.get("skillName")));
                Expression<String> unaccentGroupExpr = cb.function("unaccent", String.class, cb.lower(skillRoot.get("groupName")));

                skillSub.where(
                        cb.equal(skillRoot.get("user").get("id"), userJoin.get("id")),
                        cb.or(
                                cb.like(unaccentSkillExpr, skillPattern),
                                cb.like(unaccentGroupExpr, skillPattern)
                        )
                );
                predicates.add(cb.exists(skillSub));
            }

            // 7. Lọc theo hình thức làm việc / hướng dẫn (Working Mode)
            if (criteria.getWorkingMode() != null) {
                if (criteria.getWorkingMode() == MentoringWorkingMode.ONLINE) {
                    predicates.add(root.get("workingMode").in(MentoringWorkingMode.ONLINE, MentoringWorkingMode.BOTH));
                } else if (criteria.getWorkingMode() == MentoringWorkingMode.OFFLINE) {
                    predicates.add(root.get("workingMode").in(MentoringWorkingMode.OFFLINE, MentoringWorkingMode.BOTH));
                } else {
                    predicates.add(cb.equal(root.get("workingMode"), MentoringWorkingMode.BOTH));
                }
            }

            // 8. Lọc theo loại hình cố vấn (Mentoring Type)
            if (criteria.getMentoringType() != null) {
                if (criteria.getMentoringType() == MentoringType.INDIVIDUAL) {
                    predicates.add(root.get("mentoringType").in(MentoringType.INDIVIDUAL, MentoringType.BOTH));
                } else if (criteria.getMentoringType() == MentoringType.GROUP) {
                    predicates.add(root.get("mentoringType").in(MentoringType.GROUP, MentoringType.BOTH));
                } else {
                    predicates.add(cb.equal(root.get("mentoringType"), MentoringType.BOTH));
                }
            }

            // 9. Tìm kiếm theo từ khóa tổng hợp (Keyword)
            if (criteria.getKeyword() != null && !criteria.getKeyword().trim().isEmpty()) {
                String rawKw = criteria.getKeyword().trim().toLowerCase();
                String unaccentedKw = VietnameseStringUtils.removeAccents(rawKw);
                String kwPattern = "%" + unaccentedKw + "%";

                Expression<String> unaccentFullName = cb.function("unaccent", String.class, cb.lower(profileJoin.get("fullName")));
                Expression<String> unaccentHeadline = cb.function("unaccent", String.class, cb.lower(profileJoin.get("headline")));
                Expression<String> unaccentBio = cb.function("unaccent", String.class, cb.lower(root.get("bio")));
                Expression<String> unaccentMajorName = cb.function("unaccent", String.class, cb.lower(majorJoin.get("name")));
                Expression<String> unaccentMajorCode = cb.function("unaccent", String.class, cb.lower(majorJoin.get("code")));

                // Subquery tìm trong danh sách MentorTopic
                Subquery<Long> kwTopicSub = query.subquery(Long.class);
                Root<MentorTopic> kwTopicRoot = kwTopicSub.from(MentorTopic.class);
                kwTopicSub.select(kwTopicRoot.get("id"));
                Expression<String> unaccentTopicName = cb.function("unaccent", String.class, cb.lower(kwTopicRoot.get("topicName")));
                kwTopicSub.where(
                        cb.equal(kwTopicRoot.get("mentorProfile").get("id"), root.get("id")),
                        cb.like(unaccentTopicName, kwPattern)
                );

                // Subquery tìm trong danh sách UserSkill
                Subquery<Long> kwSkillSub = query.subquery(Long.class);
                Root<UserSkill> kwSkillRoot = kwSkillSub.from(UserSkill.class);
                kwSkillSub.select(kwSkillRoot.get("id"));
                Expression<String> unaccentSkillName = cb.function("unaccent", String.class, cb.lower(kwSkillRoot.get("skillName")));
                kwSkillSub.where(
                        cb.equal(kwSkillRoot.get("user").get("id"), userJoin.get("id")),
                        cb.like(unaccentSkillName, kwPattern)
                );

                // Subquery tìm trong kinh nghiệm làm việc (Company, Title)
                Subquery<Long> kwExpSub = query.subquery(Long.class);
                Root<Experience> kwExpRoot = kwExpSub.from(Experience.class);
                kwExpSub.select(kwExpRoot.get("id"));
                Expression<String> unaccentExpCompany = cb.function("unaccent", String.class, cb.lower(kwExpRoot.get("company")));
                Expression<String> unaccentExpTitle = cb.function("unaccent", String.class, cb.lower(kwExpRoot.get("title")));
                kwExpSub.where(
                        cb.equal(kwExpRoot.get("user").get("id"), userJoin.get("id")),
                        cb.or(
                                cb.like(unaccentExpCompany, kwPattern),
                                cb.like(unaccentExpTitle, kwPattern)
                        )
                );

                predicates.add(cb.or(
                        cb.like(unaccentFullName, kwPattern),
                        cb.like(unaccentHeadline, kwPattern),
                        cb.like(unaccentBio, kwPattern),
                        cb.like(unaccentMajorName, kwPattern),
                        cb.like(unaccentMajorCode, kwPattern),
                        cb.exists(kwTopicSub),
                        cb.exists(kwSkillSub),
                        cb.exists(kwExpSub)
                ));
            }

            // 10. Áp dụng quy tắc sắp xếp (Sorting) cho truy vấn Select
            if (Long.class != query.getResultType()) {
                List<Order> orders = new ArrayList<>();
                String sortBy = criteria.getSortBy() != null ? criteria.getSortBy().trim() : "reputationScore";
                boolean isAsc = "ASC".equalsIgnoreCase(criteria.getSortDirection());

                switch (sortBy) {
                    case "rating" -> {
                        orders.add(isAsc ? cb.asc(root.get("rating")) : cb.desc(root.get("rating")));
                        orders.add(cb.desc(root.get("reviewCount")));
                        orders.add(cb.desc(root.get("reputationScore")));
                    }
                    case "completedTasks" -> {
                        orders.add(isAsc ? cb.asc(root.get("completedTasks")) : cb.desc(root.get("completedTasks")));
                        orders.add(cb.desc(root.get("reputationScore")));
                    }
                    case "newest" -> {
                        orders.add(isAsc ? cb.asc(root.get("createdAt")) : cb.desc(root.get("createdAt")));
                    }
                    default -> { // "reputationScore"
                        orders.add(isAsc ? cb.asc(root.get("reputationScore")) : cb.desc(root.get("reputationScore")));
                        orders.add(cb.desc(root.get("completedTasks")));
                        orders.add(cb.desc(root.get("rating")));
                    }
                }
                orders.add(cb.asc(root.get("id"))); // Tie-breaker để thứ tự luôn xác định
                query.orderBy(orders);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
