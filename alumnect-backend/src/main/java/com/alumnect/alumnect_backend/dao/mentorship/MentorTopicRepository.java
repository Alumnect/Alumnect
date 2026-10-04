package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentorTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository truy vấn và thao tác dữ liệu bảng mentor_topics.
 */
@Repository
public interface MentorTopicRepository extends JpaRepository<MentorTopic, Long> {

    /**
     * Lấy danh sách các chủ đề cố vấn của một hồ sơ Mentor.
     */
    List<MentorTopic> findByMentorProfileId(Long mentorProfileId);

    /**
     * Xóa các chủ đề cố vấn của một hồ sơ Mentor để đồng bộ mới.
     */
    @Modifying
    @Query("DELETE FROM MentorTopic mt WHERE mt.mentorProfile.id = :mentorProfileId")
    void deleteByMentorProfileId(@Param("mentorProfileId") Long mentorProfileId);
}
