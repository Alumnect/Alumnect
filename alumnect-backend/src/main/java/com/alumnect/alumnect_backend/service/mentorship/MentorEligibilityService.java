package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;

/**
 * Interface dịch vụ kiểm tra điều kiện đủ và tính toán trạng thái Mentor (Mentor Eligibility).
 * Dùng chung cho UC91 (Đăng ký), UC93 (Thanh toán gói) và UC94 (Duy trì / Hết hạn)
 * nhằm tránh trùng lặp logic nghiệp vụ và đảm bảo nguyên tắc Single Source of Truth.
 */
public interface MentorEligibilityService {

    /**
     * Tính toán lại và cập nhật trạng thái Mentor của hồ sơ.
     * Mentor ACTIVE chỉ khi đồng thời thỏa mãn:
     * 1. Hồ sơ bắt buộc hoàn tất (tái sử dụng từ UC91).
     * 2. Điều khoản Hướng dẫn & Hỗ trợ đã được chấp nhận (UC90).
     * 3. Có Mentor Subscription hợp lệ ở trạng thái ACTIVE (hoặc PAID) và chưa hết hạn (endDate > now()).
     *
     * @param mentorProfileId ID hồ sơ Mentor cần tính toán
     * @return Trạng thái MentorStatus mới sau khi đánh giá
     */
    MentorStatus recalculateMentorStatus(Long mentorProfileId);
}
