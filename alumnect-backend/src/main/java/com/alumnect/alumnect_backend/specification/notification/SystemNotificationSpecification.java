package com.alumnect.alumnect_backend.specification.notification;

import com.alumnect.alumnect_backend.common.enums.SystemNotificationStatus;
import com.alumnect.alumnect_backend.entity.notification.SystemNotification;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Specification hỗ trợ xây dựng truy vấn động cho lịch sử thông báo hệ thống của Admin.
 */
public class SystemNotificationSpecification {

    /**
     * Tạo Specification lọc thông báo hệ thống theo khoảng thời gian và trạng thái.
     *
     * @param startDate Mốc thời gian bắt đầu (tùy chọn)
     * @param endDate Mốc thời gian kết thúc (tùy chọn)
     * @param status Trạng thái xử lý thông báo (tùy chọn)
     * @return Specification của thực thể SystemNotification
     */
    public static Specification<SystemNotification> filter(
            Instant startDate,
            Instant endDate,
            SystemNotificationStatus status
    ) {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            if (status != null) {
                if (status == SystemNotificationStatus.ACTIVE) {
                    predicates.add(root.get("status").in(SystemNotificationStatus.ACTIVE, SystemNotificationStatus.SENT));
                } else {
                    predicates.add(cb.equal(root.get("status"), status));
                }
            }

            if (criteriaQuery != null) {
                criteriaQuery.orderBy(cb.desc(root.get("createdAt")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
