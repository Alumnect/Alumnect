package com.alumnect.alumnect_backend.dao.forum;

import com.alumnect.alumnect_backend.common.enums.VoteTargetType;
import com.alumnect.alumnect_backend.entity.forum.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng votes (lượt bình chọn — UC42 Vote on a question).
 */
@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {

    /**
     * Kiểm tra một người dùng đã bình chọn một đối tượng (câu hỏi/câu trả lời) hay chưa.
     *
     * @param userId     ID người dùng
     * @param targetType Loại đối tượng (QUESTION/ANSWER)
     * @param targetId   ID đối tượng
     * @return true nếu đã tồn tại lượt bình chọn
     */
    boolean existsByUserIdAndTargetTypeAndTargetId(Long userId, VoteTargetType targetType, Long targetId);

    /**
     * Xóa lượt bình chọn của một người dùng cho một đối tượng (dùng khi bỏ bình chọn).
     *
     * @param userId     ID người dùng
     * @param targetType Loại đối tượng (QUESTION/ANSWER)
     * @param targetId   ID đối tượng
     */
    void deleteByUserIdAndTargetTypeAndTargetId(Long userId, VoteTargetType targetType, Long targetId);

    /**
     * Lấy danh sách ID các đối tượng (trong một tập cho trước) mà người dùng đã bình chọn —
     * dùng để tính cờ {@code voted} theo lô (batch) khi hiển thị danh sách, tránh N+1 query.
     *
     * @param userId     ID người xem hiện tại
     * @param targetType Loại đối tượng (QUESTION/ANSWER)
     * @param targetIds  Tập ID đối tượng cần kiểm tra
     * @return Danh sách ID đối tượng mà người dùng đã bình chọn
     */
    @Query("SELECT v.targetId FROM Vote v WHERE v.user.id = :userId AND v.targetType = :targetType AND v.targetId IN :targetIds")
    List<Long> findVotedTargetIds(@Param("userId") Long userId, @Param("targetType") VoteTargetType targetType, @Param("targetIds") List<Long> targetIds);
}
