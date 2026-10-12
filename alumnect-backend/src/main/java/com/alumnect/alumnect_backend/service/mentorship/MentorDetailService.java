package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.response.mentorship.MentorDetailResponse;

/**
 * Interface định nghĩa dịch vụ Xem chi tiết Mentor (UC99 — View Mentor Detail).
 * Cung cấp chức năng truy xuất, tổng hợp thông tin công khai và kiểm tra tính khả dụng nhận yêu cầu của Mentor.
 */
public interface MentorDetailService {

    /**
     * Lấy thông tin chi tiết công khai của một Mentor theo định danh hợp lệ.
     * Hỗ trợ tìm kiếm theo ID hồ sơ Mentor (mentor_profiles.id) hoặc ID tài khoản người dùng (users.id).
     *
     * @param identifier Định danh của Mentor (mentorProfileId hoặc userId)
     * @return DTO chứa thông tin chi tiết đầy đủ của Mentor phục vụ hiển thị trên giao diện
     */
    MentorDetailResponse getMentorDetail(Long identifier);
}
