package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository truy vấn và lưu trữ tệp đính kèm bảng mentoring_request_attachments (UC100).
 */
@Repository
public interface MentoringRequestAttachmentRepository extends JpaRepository<MentoringRequestAttachment, Long> {

    /**
     * Lấy danh sách tệp đính kèm của một yêu cầu Mentoring cụ thể.
     *
     * @param requestId ID của yêu cầu Mentoring
     * @return Danh sách các tệp tin đính kèm
     */
    List<MentoringRequestAttachment> findByRequestId(Long requestId);
}
