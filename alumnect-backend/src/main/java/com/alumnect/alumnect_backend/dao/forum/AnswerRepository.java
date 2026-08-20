package com.alumnect.alumnect_backend.dao.forum;

import com.alumnect.alumnect_backend.entity.forum.Answer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng answers (Câu trả lời diễn đàn Q&A).
 */
@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    /**
     * Lấy một trang câu trả lời GỐC (top-level, parent_id = null) ACTIVE của một câu hỏi, đã áp dụng:
     * <ul>
     *   <li>Chỉ lấy câu trả lời đang hiển thị (status = ACTIVE) — loại HIDDEN/DELETED.</li>
     *   <li>Chỉ lấy câu trả lời gốc (parent IS NULL); các reply lấy riêng theo lô.</li>
     *   <li>JOIN FETCH tác giả để tránh N+1 query khi hiển thị.</li>
     * </ul>
     *
     * @param questionId ID câu hỏi cần lấy danh sách câu trả lời gốc
     * @param pageable   Thông tin phân trang và sắp xếp
     * @return Trang kết quả câu trả lời gốc khớp điều kiện, đã kèm sẵn tác giả
     */
    @Query(value = "SELECT a FROM Answer a " +
            "JOIN FETCH a.author " +
            "WHERE a.question.id = :questionId " +
            "AND a.parent IS NULL " +
            "AND a.status = com.alumnect.alumnect_backend.common.enums.AnswerStatus.ACTIVE",
            countQuery = "SELECT COUNT(a) FROM Answer a " +
            "WHERE a.question.id = :questionId " +
            "AND a.parent IS NULL " +
            "AND a.status = com.alumnect.alumnect_backend.common.enums.AnswerStatus.ACTIVE")
    Page<Answer> findActiveTopLevelByQuestionId(@Param("questionId") Long questionId, Pageable pageable);

    /**
     * Lấy toàn bộ REPLY ACTIVE của nhiều câu trả lời gốc cùng lúc (batch) — tránh N+1 query.
     * Sắp theo thời gian tạo tăng dần để hiển thị đúng thứ tự trò chuyện.
     *
     * @param parentIds Danh sách ID câu trả lời gốc
     * @return Danh sách reply (đã kèm tác giả) của các câu trả lời gốc, sắp theo createdAt tăng dần
     */
    @Query("SELECT a FROM Answer a " +
            "JOIN FETCH a.author " +
            "WHERE a.parent.id IN :parentIds " +
            "AND a.status = com.alumnect.alumnect_backend.common.enums.AnswerStatus.ACTIVE " +
            "ORDER BY a.createdAt ASC")
    List<Answer> findActiveRepliesByParentIds(@Param("parentIds") List<Long> parentIds);
}
