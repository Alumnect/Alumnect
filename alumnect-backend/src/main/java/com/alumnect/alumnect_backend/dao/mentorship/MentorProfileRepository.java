package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository truy vấn và thao tác dữ liệu bảng mentor_profiles.
 */
@Repository
public interface MentorProfileRepository extends JpaRepository<MentorProfile, Long> {

    /**
     * Tìm hồ sơ Mentor theo userId của cựu sinh viên.
     */
    Optional<MentorProfile> findByUserId(Long userId);

    /**
     * Kiểm tra người dùng đã tồn tại hồ sơ Mentor hay chưa.
     */
    boolean existsByUserId(Long userId);
}
