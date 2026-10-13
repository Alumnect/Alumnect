package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLogRevision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentoringWorkLogRevisionRepository extends JpaRepository<MentoringWorkLogRevision, Long> {

    List<MentoringWorkLogRevision> findByWorkLogIdOrderByRevisionNumberDesc(Long workLogId);
}
