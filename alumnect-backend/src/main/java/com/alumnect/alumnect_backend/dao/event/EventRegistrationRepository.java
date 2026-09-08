package com.alumnect.alumnect_backend.dao.event;

import com.alumnect.alumnect_backend.entity.event.EventRegistration;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository thao tác với bảng event_registrations (UC25 - Register to attend an event RSVP, UC28 - View attended-event history).
 */
@Repository
public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {

    Optional<EventRegistration> findByEventIdAndUserId(Long eventId, Long userId);

    boolean existsByEventIdAndUserIdAndStatus(Long eventId, Long userId, String status);

    long countByEventIdAndStatus(Long eventId, String status);

    List<EventRegistration> findByEventIdAndStatusOrderByCreatedAtAsc(Long eventId, String status);

    @Query("SELECT er.event.id FROM EventRegistration er WHERE er.user.id = :userId AND er.status = 'REGISTERED' AND er.event.id IN :eventIds")
    List<Long> findRegisteredEventIds(@Param("userId") Long userId, @Param("eventIds") List<Long> eventIds);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE EventRegistration er SET er.status = 'CANCELLED' WHERE er.event.id = :eventId AND er.status = 'REGISTERED'")
    void cancelAllByEventId(@Param("eventId") Long eventId);

    @Query(value = "SELECT er FROM EventRegistration er " +
            "JOIN FETCH er.event e " +
            "JOIN FETCH e.organizer o " +
            "WHERE er.user.id = :userId " +
            "AND (" +
            "   :filter = 'all' OR " +
            "   (:filter = 'upcoming' AND er.status = 'REGISTERED' AND e.status = 'ACTIVE' AND (e.startTime > CURRENT_TIMESTAMP OR (e.endTime IS NOT NULL AND e.endTime > CURRENT_TIMESTAMP))) OR " +
            "   (:filter = 'past' AND er.status = 'REGISTERED' AND ((e.endTime IS NOT NULL AND e.endTime <= CURRENT_TIMESTAMP) OR (e.endTime IS NULL AND e.startTime <= CURRENT_TIMESTAMP))) OR " +
            "   (:filter = 'cancelled' AND (er.status = 'CANCELLED' OR e.status = 'CANCELLED'))" +
            ") " +
            "ORDER BY er.createdAt DESC",
            countQuery = "SELECT COUNT(er) FROM EventRegistration er " +
            "JOIN er.event e " +
            "WHERE er.user.id = :userId " +
            "AND (" +
            "   :filter = 'all' OR " +
            "   (:filter = 'upcoming' AND er.status = 'REGISTERED' AND e.status = 'ACTIVE' AND (e.startTime > CURRENT_TIMESTAMP OR (e.endTime IS NOT NULL AND e.endTime > CURRENT_TIMESTAMP))) OR " +
            "   (:filter = 'past' AND er.status = 'REGISTERED' AND ((e.endTime IS NOT NULL AND e.endTime <= CURRENT_TIMESTAMP) OR (e.endTime IS NULL AND e.startTime <= CURRENT_TIMESTAMP))) OR " +
            "   (:filter = 'cancelled' AND (er.status = 'CANCELLED' OR e.status = 'CANCELLED'))" +
            ")")
    Page<EventRegistration> findUserEventHistory(
            @Param("userId") Long userId,
            @Param("filter") String filter,
            Pageable pageable);
}
