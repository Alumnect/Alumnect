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
     * Lấy một trang câu hỏi cho danh sách diễn đàn (UC38 - View question list, UC44 - Search questions),
     * đã áp dụng:
     * <ul>
     *   <li>Chỉ lấy câu hỏi đang hiển thị (status = ACTIVE) — loại HIDDEN/DELETED (BR-38-03).</li>
     *   <li>Tìm kiếm theo từ khóa nếu {@code filterByKeyword} = true (BR-44-01): khớp KHÔNG phân biệt
     *       hoa/thường trên tiêu đề HOẶC nội dung câu hỏi ({@code keyword} đã được chuẩn hóa thành
     *       chữ thường, escape ký tự đặc biệt của LIKE và bọc {@code %...%} ở tầng service).</li>
     *   <li>Lọc theo NHIỀU chủ đề nếu {@code filterByTopic} = true (câu hỏi thuộc bất kỳ chủ đề nào
     *       trong {@code topicIds}); khi false thì bỏ qua điều kiện chủ đề, lấy tất cả.</li>
     *   <li>JOIN FETCH tác giả và LEFT JOIN FETCH chủ đề để tránh N+1 query khi hiển thị.</li>
     * </ul>
     * Thứ tự sắp xếp do tham số {@link Pageable} truyền vào quyết định (mới nhất / nhiều vote / nhiều trả lời).
     * <p>
     * Lưu ý: khi {@code filterByTopic}/{@code filterByMajor} = false, tầng service vẫn truyền
     * {@code topicIds}/{@code majorIds} là một danh sách không rỗng (giá trị giữ chỗ) để tránh mệnh đề
     * {@code IN ()} không hợp lệ; điều kiện IN khi đó bị vô hiệu hóa bởi cờ tương ứng = false.
     *
     * Bộ lọc TỪ KHÓA ({@code keyword}), THỂ LOẠI ({@code topicIds}) và NGÀNH ({@code majorIds}) độc lập
     * nhau: bật nhiều điều kiện thì câu hỏi phải khớp TẤT CẢ các điều kiện đang bật.
     *
     * @param filterByKeyword true = lọc theo {@code keyword}; false = không tìm kiếm
     * @param keyword         mẫu LIKE đã chuẩn hóa (chữ thường, escape, bọc %...%) — chỉ dùng khi filterByKeyword = true
     * @param filterByTopic   true = lọc theo {@code topicIds}; false = không lọc thể loại
     * @param topicIds        danh sách ID thể loại cần lọc (chỉ dùng khi filterByTopic = true)
     * @param filterByMajor   true = lọc theo {@code majorIds}; false = không lọc ngành
     * @param majorIds        danh sách ID ngành cần lọc (chỉ dùng khi filterByMajor = true)
     * @param pageable        Thông tin phân trang và sắp xếp
     * @return Trang kết quả các câu hỏi khớp điều kiện, đã kèm sẵn tác giả, thể loại và ngành
     */
    @Query(value = "SELECT q FROM Question q " +
            "JOIN FETCH q.author " +
            "LEFT JOIN FETCH q.topic t " +
            "LEFT JOIN FETCH q.major m " +
            "WHERE q.status = com.alumnect.alumnect_backend.common.enums.QuestionStatus.ACTIVE " +
            "AND (:filterByKeyword = false OR LOWER(q.title) LIKE :keyword ESCAPE '\\' OR LOWER(q.body) LIKE :keyword ESCAPE '\\') " +
            "AND (:filterByTopic = false OR t.id IN :topicIds) " +
            "AND (:filterByMajor = false OR m.id IN :majorIds)",
            countQuery = "SELECT COUNT(q) FROM Question q " +
            "LEFT JOIN q.topic t " +
            "LEFT JOIN q.major m " +
            "WHERE q.status = com.alumnect.alumnect_backend.common.enums.QuestionStatus.ACTIVE " +
            "AND (:filterByKeyword = false OR LOWER(q.title) LIKE :keyword ESCAPE '\\' OR LOWER(q.body) LIKE :keyword ESCAPE '\\') " +
            "AND (:filterByTopic = false OR t.id IN :topicIds) " +
            "AND (:filterByMajor = false OR m.id IN :majorIds)")
    Page<Question> findActiveQuestions(@Param("filterByKeyword") boolean filterByKeyword,
                                       @Param("keyword") String keyword,
                                       @Param("filterByTopic") boolean filterByTopic,
                                       @Param("topicIds") List<Long> topicIds,
                                       @Param("filterByMajor") boolean filterByMajor,
                                       @Param("majorIds") List<Long> majorIds,
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
            "LEFT JOIN FETCH q.major " +
            "WHERE q.id = :id " +
            "AND q.status = com.alumnect.alumnect_backend.common.enums.QuestionStatus.ACTIVE")
    Optional<Question> findActiveDetailById(@Param("id") Long id);
}
