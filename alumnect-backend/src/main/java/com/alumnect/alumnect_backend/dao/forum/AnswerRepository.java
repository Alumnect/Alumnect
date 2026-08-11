package com.alumnect.alumnect_backend.dao.forum;

import com.alumnect.alumnect_backend.entity.forum.Answer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng answers (Câu trả lời diễn đàn Q&A).
 */
@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    /**
     * Lấy một trang câu trả lời ACTIVE của một câu hỏi (UC41 - Answer a question), đã áp dụng:
     * <ul>
     *   <li>Chỉ lấy câu trả lời đang hiển thị (status = ACTIVE) — loại HIDDEN/DELETED.</li>
     *   <li>JOIN FETCH tác giả để tránh N+1 query khi hiển thị.</li>
     * </ul>
     * Thứ tự sắp xếp do tham số {@link Pageable} truyền vào quyết định.
     *
     * @param questionId ID câu hỏi cần lấy danh sách câu trả lời
     * @param pageable   Thông tin phân trang và sắp xếp
     * @return Trang kết quả câu trả lời khớp điều kiện, đã kèm sẵn tác giả
     */
    @Query(value = "SELECT a FROM Answer a " +
            "JOIN FETCH a.author " +
            "WHERE a.question.id = :questionId " +
            "AND a.status = com.alumnect.alumnect_backend.common.enums.AnswerStatus.ACTIVE",
            countQuery = "SELECT COUNT(a) FROM Answer a " +
            "WHERE a.question.id = :questionId " +
            "AND a.status = com.alumnect.alumnect_backend.common.enums.AnswerStatus.ACTIVE")
    Page<Answer> findActiveByQuestionId(@Param("questionId") Long questionId, Pageable pageable);
}
