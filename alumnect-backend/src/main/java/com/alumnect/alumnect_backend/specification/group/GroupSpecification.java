package com.alumnect.alumnect_backend.specification.group;

import com.alumnect.alumnect_backend.common.enums.GroupStatus;
import com.alumnect.alumnect_backend.common.util.VietnameseStringUtils;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Bộ lọc động cho danh sách khám phá hội nhóm: chỉ hội nhóm đang hoạt động, lọc theo danh mục và tìm theo
 * tên/mô tả (không phân biệt hoa thường và dấu tiếng Việt).
 */
public final class GroupSpecification {

    private GroupSpecification() {
    }

    public static Specification<CommunityGroup> discover(String keyword, String category) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), GroupStatus.ACTIVE));

            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(root.get("category"), category.trim()));
            }

            if (keyword != null && !keyword.isBlank()) {
                String raw = escapeLike(keyword.trim().toLowerCase());
                String unaccented = escapeLike(VietnameseStringUtils.removeAccents(keyword));

                Expression<String> nameLower = cb.lower(root.get("name"));
                Expression<String> descLower = cb.lower(root.get("description"));
                Expression<String> nameUnaccent = cb.function("unaccent", String.class, nameLower);
                Expression<String> descUnaccent = cb.function("unaccent", String.class, descLower);

                predicates.add(cb.or(
                        cb.like(nameLower, "%" + raw + "%", '\\'),
                        cb.like(nameUnaccent, "%" + unaccented + "%", '\\'),
                        cb.like(descLower, "%" + raw + "%", '\\'),
                        cb.like(descUnaccent, "%" + unaccented + "%", '\\')));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /** Vô hiệu hóa các ký tự đặc biệt của LIKE (%, _, \) để từ khóa được so khớp đúng nghĩa đen. */
    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
