package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MentoringGroupRepository extends JpaRepository<MentoringGroup, Long> {

    Optional<MentoringGroup> findByIdAndLeaderId(Long id, Long leaderId);

    @Query("SELECT DISTINCT g FROM MentoringGroup g LEFT JOIN g.members m WHERE g.status <> com.alumnect.alumnect_backend.common.enums.MentoringGroupStatus.CANCELLED " +
           "AND (g.leader.id = :userId " +
           "OR (m.user.id = :userId AND (m.status = com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus.JOINED " +
           "OR m.status = com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus.ACTIVE))) " +
           "ORDER BY g.updatedAt DESC")
    List<MentoringGroup> findVisibleGroups(@Param("userId") Long userId);

    @Query("SELECT g FROM MentoringGroup g WHERE g.leader.id = :userId AND g.status <> com.alumnect.alumnect_backend.common.enums.MentoringGroupStatus.CANCELLED ORDER BY g.updatedAt DESC")
    List<MentoringGroup> findManagedGroups(@Param("userId") Long userId);

    @Query("SELECT DISTINCT g FROM MentoringGroup g JOIN g.members m WHERE m.user.id = :userId " +
           "AND (m.status = com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus.JOINED " +
           "OR m.status = com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus.ACTIVE) " +
           "AND g.leader.id != :userId AND g.status <> com.alumnect.alumnect_backend.common.enums.MentoringGroupStatus.CANCELLED ORDER BY g.updatedAt DESC")
    List<MentoringGroup> findJoinedGroups(@Param("userId") Long userId);
}
