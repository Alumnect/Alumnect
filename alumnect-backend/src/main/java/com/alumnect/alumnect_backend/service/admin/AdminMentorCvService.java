package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.admin.AdminMentorCvResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service giao diện xử lý các nghiệp vụ Quản trị viên xem CV Mentor (UC96).
 */
public interface AdminMentorCvService {

    /**
     * Lấy chi tiết thông tin hồ sơ và tệp CV của Mentor theo mentorProfileId.
     *
     * @param mentorProfileId ID hồ sơ Mentor
     * @return DTO chứa thông tin Mentor và đường dẫn CV
     */
    AdminMentorCvResponse getMentorCv(Long mentorProfileId);

    /**
     * Lấy danh sách hồ sơ các Mentor phân trang kèm thông tin tệp CV cho Quản trị viên.
     *
     * @param keyword Từ khóa tìm kiếm theo tên hoặc email
     * @param pageable Cấu hình phân trang
     * @return Danh sách phân trang AdminMentorCvResponse
     */
    PageResponse<AdminMentorCvResponse> getMentorList(String keyword, Pageable pageable);
}
