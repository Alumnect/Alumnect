package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository thao tác bảng snapshot mentoring_request_members.
 */
@Repository
public interface MentoringRequestMemberRepository extends JpaRepository<MentoringRequestMember, Long> {
    List<MentoringRequestMember> findByRequestId(Long requestId);
    boolean existsByRequestIdAndUserId(Long requestId, Long userId);

    boolean existsByRequestId(Long requestId);
}
