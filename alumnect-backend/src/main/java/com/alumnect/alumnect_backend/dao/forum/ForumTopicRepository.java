package com.alumnect.alumnect_backend.dao.forum;

import com.alumnect.alumnect_backend.entity.forum.ForumTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository quản lý các thao tác dữ liệu trên bảng forum_topics (Chủ đề diễn đàn Q&A).
 */
@Repository
public interface ForumTopicRepository extends JpaRepository<ForumTopic, Long> {

    /**
     * Lấy toàn bộ chủ đề diễn đàn, sắp xếp theo tên tăng dần (A→Z) để đổ vào bộ lọc phía Frontend.
     *
     * @return Danh sách chủ đề đã sắp xếp theo tên
     */
    List<ForumTopic> findAllByOrderByNameAsc();
}
