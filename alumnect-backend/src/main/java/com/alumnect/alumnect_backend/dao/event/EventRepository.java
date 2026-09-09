package com.alumnect.alumnect_backend.dao.event;

import com.alumnect.alumnect_backend.entity.event.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository thao tác với bảng events.
 */
@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    @Modifying
    @Query("UPDATE Event e SET e.attendeeCount = e.attendeeCount + 1 " +
           "WHERE e.id = :eventId AND (e.capacity IS NULL OR e.capacity = 0 OR e.attendeeCount < e.capacity)")
    int incrementAttendeeCountSafe(@Param("eventId") Long eventId);

    @Modifying
    @Query("UPDATE Event e SET e.attendeeCount = e.attendeeCount + 1 WHERE e.id = :eventId")
    void incrementAttendeeCount(@Param("eventId") Long eventId);

    @Modifying
    @Query("UPDATE Event e SET e.attendeeCount = CASE WHEN e.attendeeCount > 0 THEN e.attendeeCount - 1 ELSE 0 END WHERE e.id = :eventId")
    void decrementAttendeeCount(@Param("eventId") Long eventId);

    @Query(value = "SELECT e FROM Event e " +
            "WHERE e.status != 'CANCELLED' " +
            "AND e.startTime >= :fromTime " +
            "AND (:keyword = '' OR LOWER(e.title) LIKE :keyword OR LOWER(e.location) LIKE :keyword) " +
            "ORDER BY e.startTime ASC",
            countQuery = "SELECT COUNT(e) FROM Event e " +
            "WHERE e.status != 'CANCELLED' " +
            "AND e.startTime >= :fromTime " +
            "AND (:keyword = '' OR LOWER(e.title) LIKE :keyword OR LOWER(e.location) LIKE :keyword)")
    org.springframework.data.domain.Page<Event> findUpcomingEvents(
            @Param("fromTime") java.time.Instant fromTime,
            @Param("keyword") String keyword,
            org.springframework.data.domain.Pageable pageable);

    @Query(value = "SELECT e FROM Event e " +
            "WHERE e.status != 'CANCELLED' " +
            "AND (COALESCE(e.endTime, e.startTime) >= :fromTime) " +
            "AND e.startTime <= :toTime " +
            "AND (:keyword = '' OR LOWER(e.title) LIKE :keyword OR LOWER(e.location) LIKE :keyword) " +
            "ORDER BY e.startTime ASC",
            countQuery = "SELECT COUNT(e) FROM Event e " +
            "WHERE e.status != 'CANCELLED' " +
            "AND (COALESCE(e.endTime, e.startTime) >= :fromTime) " +
            "AND e.startTime <= :toTime " +
            "AND (:keyword = '' OR LOWER(e.title) LIKE :keyword OR LOWER(e.location) LIKE :keyword)")
    org.springframework.data.domain.Page<Event> findEventsInRange(
            @Param("fromTime") java.time.Instant fromTime,
            @Param("toTime") java.time.Instant toTime,
            @Param("keyword") String keyword,
            org.springframework.data.domain.Pageable pageable);
}
