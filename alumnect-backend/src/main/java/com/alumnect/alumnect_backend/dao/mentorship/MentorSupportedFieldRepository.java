package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentorSupportedField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository truy vấn và thao tác dữ liệu bảng mentor_supported_fields.
 */
@Repository
public interface MentorSupportedFieldRepository extends JpaRepository<MentorSupportedField, Long> {

    /**
     * Lấy danh sách các lĩnh vực hỗ trợ của một hồ sơ Mentor.
     */
    List<MentorSupportedField> findByMentorProfileId(Long mentorProfileId);

    /**
     * Xóa toàn bộ liên kết lĩnh vực của một hồ sơ Mentor để đồng bộ mới.
     */
    @Modifying
    @Query("DELETE FROM MentorSupportedField msf WHERE msf.mentorProfile.id = :mentorProfileId")
    void deleteByMentorProfileId(@Param("mentorProfileId") Long mentorProfileId);
}
