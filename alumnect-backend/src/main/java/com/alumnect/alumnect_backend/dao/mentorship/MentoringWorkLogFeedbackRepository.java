package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLogFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MentoringWorkLogFeedbackRepository extends JpaRepository<MentoringWorkLogFeedback, Long> {

    List<MentoringWorkLogFeedback> findByWorkLogIdOrderByCreatedAtDesc(Long workLogId);

    List<MentoringWorkLogFeedback> findByWorkLogIdAndRevisionNumber(Long workLogId, Integer revisionNumber);
}
