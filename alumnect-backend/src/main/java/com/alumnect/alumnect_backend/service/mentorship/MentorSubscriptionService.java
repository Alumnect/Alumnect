package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.request.mentorship.SelectMentorPackageRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorPackageResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorSubscriptionResponse;

import java.util.List;

/**
 * Interface dịch vụ xử lý nghiệp vụ Xem & Chọn gói Mentor (UC92).
 */
public interface MentorSubscriptionService {

    /**
     * Lấy danh sách các gói dịch vụ Mentor đang hoạt động (ACTIVE).
     *
     * @return Danh sách các gói Mentor khả dụng
     */
    List<MentorPackageResponse> getActivePackages();

    /**
     * Lựa chọn một gói Mentor cho hồ sơ người dùng và tạo thông tin chờ thanh toán (UC92).
     *
     * @param userEmail Email của người dùng đang đăng nhập (Alumni/Mentor)
     * @param request DTO chứa mã gói dịch vụ được chọn
     * @return DTO chứa thông tin đăng ký gói chờ thanh toán
     */
    MentorSubscriptionResponse selectPackage(String userEmail, SelectMentorPackageRequest request);

    /**
     * Lấy thông tin đăng ký gói Mentor hiện tại/mới nhất của người dùng.
     *
     * @param userEmail Email của người dùng đang đăng nhập
     * @return DTO thông tin đăng ký gói Mentor
     */
    MentorSubscriptionResponse getMySubscription(String userEmail);
}
