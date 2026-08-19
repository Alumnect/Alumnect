package com.alumnect.alumnect_backend.dao.forum;

import com.alumnect.alumnect_backend.entity.forum.QuestionImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng question_images (ảnh đính kèm câu hỏi).
 */
@Repository
public interface QuestionImageRepository extends JpaRepository<QuestionImage, Long> {

    /**
     * Lấy toàn bộ ảnh của MỘT câu hỏi, sắp theo thứ tự hiển thị (dùng cho màn hình chi tiết).
     *
     * @param questionId ID câu hỏi
     * @return Danh sách ảnh đã sắp theo {@code sortOrder} tăng dần
     */
    List<QuestionImage> findByQuestion_IdOrderBySortOrderAsc(Long questionId);

    /**
     * Lấy ảnh của NHIỀU câu hỏi cùng lúc (batch) — tránh N+1 query khi dựng danh sách câu hỏi.
     *
     * @param questionIds Danh sách ID câu hỏi
     * @return Danh sách ảnh của tất cả câu hỏi, sắp theo câu hỏi rồi tới thứ tự hiển thị
     */
    List<QuestionImage> findByQuestion_IdInOrderByQuestion_IdAscSortOrderAsc(List<Long> questionIds);

    /**
     * Xóa toàn bộ ảnh của một câu hỏi (dùng khi chỉnh sửa câu hỏi để thay bằng bộ ảnh mới).
     *
     * @param questionId ID câu hỏi
     */
    void deleteByQuestion_Id(Long questionId);
}
