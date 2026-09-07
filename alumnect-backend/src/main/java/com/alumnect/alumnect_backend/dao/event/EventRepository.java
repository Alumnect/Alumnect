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
    @Query("UPDATE Event e SET e.attendeeCount = e.attendeeCount + 1 WHERE e.id = :eventId")
    void incrementAttendeeCount(@Param("eventId") Long eventId);

    @Modifying
    @Query("UPDATE Event e SET e.attendeeCount = CASE WHEN e.attendeeCount > 0 THEN e.attendeeCount - 1 ELSE 0 END WHERE e.id = :eventId")
    void decrementAttendeeCount(@Param("eventId") Long eventId);
}
