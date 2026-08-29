package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.entity.user.Experience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    Optional<Experience> findByIdAndUserId(Long id, Long userId);
    List<Experience> findByUserIdOrderByStartDateDesc(Long userId);
    List<Experience> findByUserIdAndIsCurrentTrue(Long userId);
    Optional<Experience> findByUserIdAndIsPrimaryTrue(Long userId);
    List<Experience> findByUserIdInAndIsPrimaryTrue(Collection<Long> userIds);
    
    @Query("SELECT e FROM Experience e WHERE e.user.id IN :userIds ORDER BY e.startDate ASC, e.endDate ASC, e.id ASC")
    List<Experience> findByUserIdsSortedChronologically(@Param("userIds") List<Long> userIds);
}


