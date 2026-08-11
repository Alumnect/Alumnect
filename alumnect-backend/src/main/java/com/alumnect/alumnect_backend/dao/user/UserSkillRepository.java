package com.alumnect.alumnect_backend.dao.user;

import com.alumnect.alumnect_backend.entity.user.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repository thao tác dữ liệu cho thực thể {@link UserSkill}.
 */
@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    /**
     * Tìm tất cả kỹ năng của người dùng theo ID tài khoản.
     *
     * @param userId ID người dùng
     * @return Danh sách các thực thể UserSkill
     */
    List<UserSkill> findByUserIdOrderBySortOrderAscSkillNameAsc(Long userId);

    /**
     * Xóa toàn bộ kỹ năng của người dùng theo ID tài khoản.
     *
     * @param userId ID người dùng
     */
    @Modifying
    @Query("DELETE FROM UserSkill us WHERE us.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}

