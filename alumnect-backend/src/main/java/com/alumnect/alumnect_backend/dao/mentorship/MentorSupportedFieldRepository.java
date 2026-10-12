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
     * Lấy danh sách các liên kết hồ sơ Mentor hỗ trợ một ngành nghề cụ thể (phục vụ matching UC100).
     */
    List<MentorSupportedField> findByIndustryId(Long industryId);

    /**
     * Kiểm tra xem Mentor có hỗ trợ một lĩnh vực ngành nghề cụ thể hay không (phục vụ validate UC101).
     *
     * @param mentorProfileId ID hồ sơ Mentor
     * @param industryId ID lĩnh vực chuyên môn (ngành nghề)
     * @return true nếu Mentor có đăng ký hỗ trợ lĩnh vực này
     */
    boolean existsByMentorProfileIdAndIndustryId(Long mentorProfileId, Long industryId);

    /**
     * Lấy danh sách lĩnh vực hỗ trợ theo danh sách ID hồ sơ Mentor (Batch fetch).
     */
    List<MentorSupportedField> findByMentorProfileIdIn(java.util.Collection<Long> mentorProfileIds);

    /**
     * Xóa toàn bộ liên kết lĩnh vực của một hồ sơ Mentor để đồng bộ mới.
     */
    @Modifying
    @Query("DELETE FROM MentorSupportedField msf WHERE msf.mentorProfile.id = :mentorProfileId")
    void deleteByMentorProfileId(@Param("mentorProfileId") Long mentorProfileId);
}
