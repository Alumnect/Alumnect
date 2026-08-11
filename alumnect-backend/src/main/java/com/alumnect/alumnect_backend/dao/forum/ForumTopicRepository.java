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
     * Lấy toàn bộ chủ đề diễn đàn, sắp xếp theo id tăng dần để đổ vào bộ lọc phía Frontend.
     * Sắp theo id (thứ tự tạo) giữ đúng trật tự: các ngành lớn trước, rồi tới chủ đề con theo
     * đúng thứ tự đã seed (Frontend dựng cây cha–con từ danh sách phẳng này).
     *
     * @return Danh sách chủ đề đã sắp xếp theo id
     */
    List<ForumTopic> findAllByOrderByIdAsc();
}
