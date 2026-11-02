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
     * Lấy chi tiết thông tin hồ sơ Mentor phục vụ công tác quản lý (UC115).
     * Không bắt buộc phải có tệp CV.
     *
     * @param mentorProfileId ID hồ sơ Mentor
     * @return DTO chứa thông tin hồ sơ quản lý của Mentor
     */
    AdminMentorCvResponse getMentorDetail(Long mentorProfileId);

    /**
     * Lấy danh sách hồ sơ các Mentor phân trang kèm bộ lọc đa tiêu chí cho Quản trị viên (UC115).
     *
     * @param keyword Từ khóa tìm kiếm theo tên, email, vị trí hoặc công ty
     * @param status Trạng thái hồ sơ Mentor (ACTIVE, INCOMPLETE, PAYMENT_PENDING, EXPIRED)
     * @param subscriptionStatus Trạng thái gói dịch vụ
     * @param pageable Cấu hình phân trang
     * @return Danh sách phân trang AdminMentorCvResponse
     */
    PageResponse<AdminMentorCvResponse> getMentorList(String keyword, com.alumnect.alumnect_backend.common.enums.MentorStatus status, String subscriptionStatus, Pageable pageable);

    /**
     * Tương thích ngược: Lấy danh sách Mentor theo từ khóa.
     */
    default PageResponse<AdminMentorCvResponse> getMentorList(String keyword, Pageable pageable) {
        return getMentorList(keyword, null, null, pageable);
    }
}
