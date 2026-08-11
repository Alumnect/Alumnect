package com.alumnect.alumnect_backend.dao.forum;

import com.alumnect.alumnect_backend.entity.forum.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng questions (Câu hỏi diễn đàn Q&A).
 */
@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    /**
     * Lấy một trang câu hỏi cho danh sách diễn đàn (UC38 - View question list), đã áp dụng:
     * <ul>
     *   <li>Chỉ lấy câu hỏi đang hiển thị (status = ACTIVE) — loại HIDDEN/DELETED (BR-38-03).</li>
     *   <li>Lọc theo NHIỀU chủ đề nếu {@code filterByTopic} = true (câu hỏi thuộc bất kỳ chủ đề nào
     *       trong {@code topicIds}); khi false thì bỏ qua điều kiện chủ đề, lấy tất cả.</li>
     *   <li>JOIN FETCH tác giả và LEFT JOIN FETCH chủ đề để tránh N+1 query khi hiển thị.</li>
     * </ul>
     * Thứ tự sắp xếp do tham số {@link Pageable} truyền vào quyết định (mới nhất / nhiều vote / nhiều trả lời).
     * <p>
     * Lưu ý: khi {@code filterByTopic} = false, tầng service vẫn truyền {@code topicIds} là một danh
     * sách không rỗng (giá trị giữ chỗ) để tránh mệnh đề {@code IN ()} không hợp lệ; điều kiện IN khi
     * đó bị vô hiệu hóa bởi {@code filterByTopic = false}.
     *
     * @param filterByTopic true = lọc theo {@code topicIds}; false = không lọc chủ đề
     * @param topicIds       danh sách ID chủ đề cần lọc (chỉ dùng khi filterByTopic = true)
     * @param pageable       Thông tin phân trang và sắp xếp
     * @return Trang kết quả các câu hỏi khớp điều kiện, đã kèm sẵn tác giả và chủ đề
     */
    @Query(value = "SELECT q FROM Question q " +
            "JOIN FETCH q.author " +
            "LEFT JOIN FETCH q.topic t " +
            "WHERE q.status = com.alumnect.alumnect_backend.common.enums.QuestionStatus.ACTIVE " +
            "AND (:filterByTopic = false OR t.id IN :topicIds)",
            countQuery = "SELECT COUNT(q) FROM Question q " +
            "LEFT JOIN q.topic t " +
            "WHERE q.status = com.alumnect.alumnect_backend.common.enums.QuestionStatus.ACTIVE " +
            "AND (:filterByTopic = false OR t.id IN :topicIds)")
    Page<Question> findActiveQuestions(@Param("filterByTopic") boolean filterByTopic,
                                       @Param("topicIds") List<Long> topicIds,
                                       Pageable pageable);

    /**
     * Lấy chi tiết một câu hỏi đang hiển thị theo ID (UC39 - View question detail), đã áp dụng:
     * <ul>
     *   <li>Chỉ lấy câu hỏi ở trạng thái ACTIVE — câu hỏi HIDDEN/DELETED coi như không tồn tại (BR-39-02).</li>
     *   <li>JOIN FETCH tác giả và LEFT JOIN FETCH chủ đề để tránh N+1 query khi map sang DTO chi tiết.</li>
     * </ul>
     *
     * @param id ID câu hỏi cần xem chi tiết
     * @return {@link Optional} chứa câu hỏi (kèm sẵn tác giả và chủ đề) nếu tồn tại và đang ACTIVE, ngược lại rỗng
     */
    @Query("SELECT q FROM Question q " +
            "JOIN FETCH q.author " +
            "LEFT JOIN FETCH q.topic " +
            "WHERE q.id = :id " +
            "AND q.status = com.alumnect.alumnect_backend.common.enums.QuestionStatus.ACTIVE")
    Optional<Question> findActiveDetailById(@Param("id") Long id);
}
