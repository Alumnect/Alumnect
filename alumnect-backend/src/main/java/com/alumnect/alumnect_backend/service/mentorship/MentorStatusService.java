package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.response.mentorship.MentorStatusResponse;

/**
 * Interface định nghĩa các nghiệp vụ truy vấn và tổng hợp trạng thái Mentor & Subscription (UC94).
 * Cho phép cựu sinh viên (Alumni) và Mentor theo dõi tiến trình hồ sơ, điều khoản và hiệu lực gói dịch vụ.
 */
public interface MentorStatusService {

    /**
     * Lấy và tổng hợp toàn bộ trạng thái hồ sơ Mentor, điều khoản và gói dịch vụ của người dùng.
     * Kiểm tra chặt chẽ vai trò ALUMNI và tổng hợp dữ liệu từ:
     * - Hồ sơ Mentor & tính hoàn thiện (UC91)
     * - Trạng thái tệp CV & thông tin tài khoản ngân hàng (UC91)
     * - Trạng thái chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (UC90)
     * - Gói dịch vụ đã chọn & hiệu lực thanh toán PayOS (UC92, UC93)
     * - Tính toán MentorStatus chính xác qua hệ thống đánh giá điều kiện (MentorEligibilityService)
     *
     * @param userEmail Email của người dùng đã xác thực từ JWT Bearer Token
     * @return DTO tổng hợp chi tiết trạng thái MentorStatusResponse
     */
    MentorStatusResponse getMentorStatus(String userEmail);
}
