package com.alumnect.alumnect_backend.dao.event;

import com.alumnect.alumnect_backend.entity.event.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
}
