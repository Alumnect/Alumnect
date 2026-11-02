package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.request.mentorship.MentorRegistrationRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRegistrationResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRegistrationSaveResponse;

/**
 * Giao diện dịch vụ nghiệp vụ (Service Interface) quản lý Đăng ký trở thành Mentor (UC91).
 * Chịu trách nhiệm tổng hợp thông tin, trích xuất dữ liệu hồ sơ cá nhân và kinh nghiệm có sẵn,
 * thực hiện lưu nháp hoặc hoàn tất đăng ký với đầy đủ các quy tắc nghiệp vụ.
 */
public interface MentorRegistrationService {

    /**
     * Lấy toàn bộ thông tin đăng ký Mentor của Alumni đã đăng nhập.
     * Tự động tổng hợp và tái sử dụng dữ liệu từ UserProfile, Experience, UserSkill và MentorProfile.
     *
     * @param userEmail Email của người dùng đã xác thực từ Security Context
     * @return DTO chứa thông tin tổng hợp để hiển thị trên giao diện đăng ký
     */
    MentorRegistrationResponse getRegistration(String userEmail);

    /**
     * Lưu hoặc cập nhật thông tin đăng ký Mentor (hỗ trợ cả Lưu nháp và Hoàn tất đăng ký).
     *
     * @param userEmail Email của người dùng đã xác thực từ Security Context
     * @param request DTO chứa các thông tin đăng ký/lưu nháp
     * @return DTO chứa kết quả lưu, trạng thái hồ sơ và cờ hoàn tất
     */
    MentorRegistrationSaveResponse saveRegistration(String userEmail, MentorRegistrationRequest request);

    /**
     * Kiểm tra tính hoàn thiện 100% của hồ sơ Mentor (tái sử dụng từ UC91).
     * Dùng chung cho UC92, UC93, UC94 nhằm tránh duplicate logic thẩm định hồ sơ.
     *
     * @param userEmail Email của người dùng đã xác thực
     * @return true nếu hồ sơ đã điền đầy đủ và thỏa mãn mọi ràng buộc UC91
     */
    boolean isMentorProfileComplete(String userEmail);
}

