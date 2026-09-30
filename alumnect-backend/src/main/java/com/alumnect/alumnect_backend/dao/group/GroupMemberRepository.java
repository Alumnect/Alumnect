package com.alumnect.alumnect_backend.dao.group;

import com.alumnect.alumnect_backend.entity.group.GroupMember;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository thao tác với bảng group_members (thành viên và yêu cầu tham gia hội nhóm).
 */
@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    @Query("SELECT m FROM GroupMember m WHERE m.group.id = :groupId AND m.user.id = :userId")
    Optional<GroupMember> findByGroupIdAndUserId(@Param("groupId") Long groupId, @Param("userId") Long userId);

    /** Khóa dòng thành viên khi xử lý để chặn 2 request đồng thời cùng đổi trạng thái (BR-12, BR-14). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM GroupMember m WHERE m.group.id = :groupId AND m.user.id = :userId")
    Optional<GroupMember> findByGroupIdAndUserIdForUpdate(@Param("groupId") Long groupId, @Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM GroupMember m JOIN FETCH m.user WHERE m.id = :id AND m.group.id = :groupId")
    Optional<GroupMember> findByIdAndGroupIdForUpdate(@Param("id") Long id, @Param("groupId") Long groupId);

    /** Tư cách thành viên của một người dùng trên nhiều nhóm — dùng gắn trạng thái tham gia vào danh sách nhóm. */
    @Query("SELECT m FROM GroupMember m WHERE m.user.id = :userId AND m.group.id IN :groupIds")
    List<GroupMember> findByUserIdAndGroupIdIn(@Param("userId") Long userId, @Param("groupIds") Collection<Long> groupIds);

    long countByGroupIdAndMembershipStatus(Long groupId, com.alumnect.alumnect_backend.common.enums.MembershipStatus status);

    long countByGroupIdAndRoleAndMembershipStatus(Long groupId,
            com.alumnect.alumnect_backend.common.enums.MembershipRole role,
            com.alumnect.alumnect_backend.common.enums.MembershipStatus status);

    /** Danh sách thành viên ACTIVE: Owner trước, rồi Admin, rồi Member (theo ngày tham gia); tìm theo tên có/không dấu. */
    @Query(value = "SELECT m FROM GroupMember m JOIN FETCH m.user u LEFT JOIN UserProfile up ON up.userId = u.id " +
            "WHERE m.group.id = :groupId AND m.membershipStatus = com.alumnect.alumnect_backend.common.enums.MembershipStatus.ACTIVE " +
            "AND (:keyword = '' OR LOWER(up.fullName) LIKE :keyword " +
            "     OR cast(function('unaccent', LOWER(up.fullName)) as String) LIKE :unaccentedKeyword) " +
            "ORDER BY CASE m.role WHEN com.alumnect.alumnect_backend.common.enums.MembershipRole.OWNER THEN 0 " +
            "                     WHEN com.alumnect.alumnect_backend.common.enums.MembershipRole.ADMIN THEN 1 ELSE 2 END, m.joinedAt ASC",
            countQuery = "SELECT COUNT(m) FROM GroupMember m LEFT JOIN UserProfile up ON up.userId = m.user.id " +
            "WHERE m.group.id = :groupId AND m.membershipStatus = com.alumnect.alumnect_backend.common.enums.MembershipStatus.ACTIVE " +
            "AND (:keyword = '' OR LOWER(up.fullName) LIKE :keyword " +
            "     OR cast(function('unaccent', LOWER(up.fullName)) as String) LIKE :unaccentedKeyword)")
    Page<GroupMember> searchActiveMembers(@Param("groupId") Long groupId,
                                          @Param("keyword") String keyword,
                                          @Param("unaccentedKeyword") String unaccentedKeyword,
                                          Pageable pageable);

    /** Các yêu cầu tham gia đang chờ duyệt (PENDING), cũ nhất lên đầu. */
    @Query(value = "SELECT m FROM GroupMember m JOIN FETCH m.user " +
            "WHERE m.group.id = :groupId AND m.membershipStatus = com.alumnect.alumnect_backend.common.enums.MembershipStatus.PENDING " +
            "ORDER BY m.updatedAt ASC",
            countQuery = "SELECT COUNT(m) FROM GroupMember m " +
            "WHERE m.group.id = :groupId AND m.membershipStatus = com.alumnect.alumnect_backend.common.enums.MembershipStatus.PENDING")
    Page<GroupMember> findPendingRequests(@Param("groupId") Long groupId, Pageable pageable);

    /** Các nhóm (chưa xóa) mà người dùng đang là thành viên ACTIVE, nhóm tham gia gần nhất lên đầu. */
    @Query(value = "SELECT m FROM GroupMember m JOIN FETCH m.group g JOIN FETCH g.owner " +
            "WHERE m.user.id = :userId AND m.membershipStatus = com.alumnect.alumnect_backend.common.enums.MembershipStatus.ACTIVE " +
            "AND g.status <> com.alumnect.alumnect_backend.common.enums.GroupStatus.DELETED " +
            "ORDER BY m.joinedAt DESC",
            countQuery = "SELECT COUNT(m) FROM GroupMember m " +
            "WHERE m.user.id = :userId AND m.membershipStatus = com.alumnect.alumnect_backend.common.enums.MembershipStatus.ACTIVE " +
            "AND m.group.status <> com.alumnect.alumnect_backend.common.enums.GroupStatus.DELETED")
    Page<GroupMember> findMyGroups(@Param("userId") Long userId, Pageable pageable);
}
