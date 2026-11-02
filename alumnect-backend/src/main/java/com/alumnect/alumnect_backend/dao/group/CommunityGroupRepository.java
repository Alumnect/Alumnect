package com.alumnect.alumnect_backend.dao.group;

import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository thao tác với bảng community_groups.
 * Số lượng thành viên chỉ được đổi qua 2 query {@code @Modifying} bên dưới (nguyên tử trong DB, giảm kẹp sàn tại 0)
 * để không bị lệch khi có request trùng lặp/đồng thời (BR-04, BR-14).
 */
@Repository
public interface CommunityGroupRepository extends JpaRepository<CommunityGroup, Long>, JpaSpecificationExecutor<CommunityGroup> {

    /** Lấy hội nhóm chưa bị xóa (ACTIVE hoặc INACTIVE) kèm chủ sở hữu; nhóm DELETED coi như không tồn tại. */
    @Query("SELECT g FROM CommunityGroup g JOIN FETCH g.owner " +
           "WHERE g.id = :id AND g.status <> com.alumnect.alumnect_backend.common.enums.GroupStatus.DELETED")
    Optional<CommunityGroup> findVisibleById(@Param("id") Long id);

    @Modifying
    @Query("UPDATE CommunityGroup g SET g.memberCount = g.memberCount + 1 WHERE g.id = :groupId")
    void incrementMemberCount(@Param("groupId") Long groupId);

    @Modifying
    @Query("UPDATE CommunityGroup g SET g.memberCount = CASE WHEN g.memberCount > 0 THEN g.memberCount - 1 ELSE 0 END WHERE g.id = :groupId")
    void decrementMemberCount(@Param("groupId") Long groupId);
}
