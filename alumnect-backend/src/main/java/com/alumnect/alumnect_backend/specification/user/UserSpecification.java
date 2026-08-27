package com.alumnect.alumnect_backend.specification.user;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.user.UserSkill;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Lớp cung cấp các Specification để tạo câu truy vấn JPA động phục vụ tìm kiếm và lọc người dùng.
 * Sử dụng subquery đối với các bảng quan hệ 1-Nhiều (UserSkill, Experience) để tránh phải dùng DISTINCT,
 * từ đó tương thích 100% với cú pháp ORDER BY của PostgreSQL.
 */
public class UserSpecification {

    /**
     * Tạo Specification lọc danh sách người dùng theo nhiều điều kiện động.
     *
     * @param query Từ khóa tìm kiếm đa năng (họ tên, chức danh, kỹ năng, công ty, chuyên ngành, mã SV...)
     * @param role Phân loại vai trò người dùng (STUDENT hoặc ALUMNI)
     * @param majorId ID chuyên ngành học
     * @param cohort Khóa học / Niên khóa
     * @param city Tỉnh / Thành phố
     * @param skill Tên kỹ năng cụ thể hoặc nhóm kỹ năng
     * @param company Tên công ty hoặc nơi làm việc
     * @return Specification tương ứng
     */
    public static Specification<User> filterUsers(
            String query,
            String role,
            Long majorId,
            Integer cohort,
            String city,
            String skill,
            String company
    ) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Chỉ hiển thị các tài khoản đang hoạt động (ACTIVE)
            predicates.add(cb.equal(root.get("accountStatus"), AccountStatus.ACTIVE));

            // 2. Không hiển thị tài khoản Quản trị viên (ADMIN) trên danh bạ thành viên
            predicates.add(cb.notEqual(cb.upper(root.get("role").get("name")), "ADMIN"));

            // 3. Join sang bảng UserProfile và Major (1-1 và Many-1, không làm nhân bản số dòng)
            Join<User, UserProfile> profileJoin = root.join("profile", JoinType.INNER);
            Join<UserProfile, Major> majorJoin = profileJoin.join("major", JoinType.LEFT);

            // 4. Lọc theo vai trò (Role)
            if (role != null && !role.trim().isEmpty() && !"ALL".equalsIgnoreCase(role.trim())) {
                predicates.add(cb.equal(cb.upper(root.get("role").get("name")), role.trim().toUpperCase()));
            }

            // 5. Lọc theo chuyên ngành (Major ID)
            if (majorId != null && majorId > 0) {
                predicates.add(cb.equal(majorJoin.get("id"), majorId));
            }

            // 6. Lọc theo niên khóa (Cohort)
            if (cohort != null && cohort > 0) {
                predicates.add(cb.equal(profileJoin.get("cohort"), cohort));
            }

            // 7. Lọc theo tỉnh / thành phố (City)
            if (city != null && !city.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(profileJoin.get("city")), "%" + city.trim().toLowerCase() + "%"));
            }

            // 8. Lọc theo kỹ năng cụ thể (dùng EXISTS Subquery)
            if (skill != null && !skill.trim().isEmpty()) {
                Subquery<Long> skillSub = criteriaQuery.subquery(Long.class);
                Root<UserSkill> skillRoot = skillSub.from(UserSkill.class);
                String skillPattern = "%" + skill.trim().toLowerCase() + "%";
                skillSub.select(skillRoot.get("user").get("id"))
                        .where(
                                cb.equal(skillRoot.get("user").get("id"), root.get("id")),
                                cb.or(
                                        cb.like(cb.lower(skillRoot.get("skillName")), skillPattern),
                                        cb.like(cb.lower(skillRoot.get("groupName")), skillPattern)
                                )
                        );
                predicates.add(cb.exists(skillSub));
            }

            // 9. Lọc theo công ty / tổ chức (dùng EXISTS Subquery)
            if (company != null && !company.trim().isEmpty()) {
                Subquery<Long> expSub = criteriaQuery.subquery(Long.class);
                Root<Experience> expRoot = expSub.from(Experience.class);
                expSub.select(expRoot.get("user").get("id"))
                        .where(
                                cb.equal(expRoot.get("user").get("id"), root.get("id")),
                                cb.like(cb.lower(expRoot.get("company")), "%" + company.trim().toLowerCase() + "%")
                        );
                predicates.add(cb.exists(expSub));
            }

            // 10. Tìm kiếm từ khóa tổng hợp (Query Keyword)
            if (query != null && !query.trim().isEmpty()) {
                String searchPattern = "%" + query.trim().toLowerCase() + "%";

                Predicate namePred = cb.like(cb.lower(profileJoin.get("fullName")), searchPattern);
                Predicate headlinePred = cb.like(cb.lower(profileJoin.get("headline")), searchPattern);
                Predicate studentCodePred = cb.like(cb.lower(profileJoin.get("studentCode")), searchPattern);
                Predicate cityPred = cb.like(cb.lower(profileJoin.get("city")), searchPattern);
                Predicate majorNamePred = cb.like(cb.lower(majorJoin.get("name")), searchPattern);
                Predicate majorCodePred = cb.like(cb.lower(majorJoin.get("code")), searchPattern);

                Subquery<Long> qSkillSub = criteriaQuery.subquery(Long.class);
                Root<UserSkill> qSkillRoot = qSkillSub.from(UserSkill.class);
                qSkillSub.select(qSkillRoot.get("user").get("id"))
                        .where(
                                cb.equal(qSkillRoot.get("user").get("id"), root.get("id")),
                                cb.like(cb.lower(qSkillRoot.get("skillName")), searchPattern)
                        );

                Subquery<Long> qExpSub = criteriaQuery.subquery(Long.class);
                Root<Experience> qExpRoot = qExpSub.from(Experience.class);
                qExpSub.select(qExpRoot.get("user").get("id"))
                        .where(
                                cb.equal(qExpRoot.get("user").get("id"), root.get("id")),
                                cb.or(
                                        cb.like(cb.lower(qExpRoot.get("company")), searchPattern),
                                        cb.like(cb.lower(qExpRoot.get("title")), searchPattern)
                                )
                        );

                predicates.add(cb.or(
                        namePred,
                        headlinePred,
                        studentCodePred,
                        cityPred,
                        majorNamePred,
                        majorCodePred,
                        cb.exists(qSkillSub),
                        cb.exists(qExpSub)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
