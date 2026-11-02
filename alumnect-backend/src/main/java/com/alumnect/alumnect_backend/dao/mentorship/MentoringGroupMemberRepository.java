package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MentoringGroupMemberRepository extends JpaRepository<MentoringGroupMember, Long> {

    List<MentoringGroupMember> findByGroupIdOrderByInvitedAtAsc(Long groupId);

    List<MentoringGroupMember> findByUserIdAndStatusOrderByInvitedAtDesc(Long userId, MentoringGroupMemberStatus status);

    List<MentoringGroupMember> findByUserIdAndStatusInOrderByInvitedAtDesc(Long userId, List<MentoringGroupMemberStatus> statuses);

    Optional<MentoringGroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    boolean existsByGroupIdAndUserIdAndStatus(Long groupId, Long userId, MentoringGroupMemberStatus status);

    boolean existsByGroupIdAndUserIdAndStatusIn(Long groupId, Long userId, List<MentoringGroupMemberStatus> statuses);

    long countByGroupIdAndStatusIn(Long groupId, List<MentoringGroupMemberStatus> statuses);

    List<MentoringGroupMember> findByGroupIdAndStatusIn(Long groupId, List<MentoringGroupMemberStatus> statuses);
}
