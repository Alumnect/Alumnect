package com.alumnect.alumnect_backend.dao.notification;

import com.alumnect.alumnect_backend.common.enums.SystemNotificationStatus;
import com.alumnect.alumnect_backend.entity.notification.SystemNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Repository truy xuất và thao tác dữ liệu thông báo hệ thống (system_notifications).
 */
@Repository
public interface SystemNotificationRepository extends JpaRepository<SystemNotification, Long>, JpaSpecificationExecutor<SystemNotification> {

    /**
     * Tìm kiếm các thông báo đang ở trạng thái SCHEDULED mà thời điểm hẹn giờ đã đến hoặc đã qua.
     */
    List<SystemNotification> findByStatusAndScheduledAtLessThanEqual(SystemNotificationStatus status, Instant time);

    /**
     * Tìm kiếm các thông báo đang ở trạng thái SENT hoặc ACTIVE mà thời điểm hết hạn đã qua.
     */
    List<SystemNotification> findByStatusInAndExpiresAtLessThanEqual(List<SystemNotificationStatus> statuses, Instant time);

}
