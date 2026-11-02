package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsAcceptResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;

/**
 * Giao diện dịch vụ nghiệp vụ (Service Interface) quản lý Điều khoản Hướng dẫn & Hỗ trợ (Mentoring Terms).
 * Chịu trách nhiệm kiểm tra trạng thái chấp nhận điều khoản và xử lý việc chấp nhận điều khoản của người dùng.
 */
public interface MentoringTermsService {

    /**
     * Lấy trạng thái chấp nhận Điều khoản Hướng dẫn & Hỗ trợ hiện tại của người dùng.
     * Đối chiếu phiên bản hiện tại từ cấu hình hệ thống với lịch sử chấp nhận trong cơ sở dữ liệu.
     *
     * @param userEmail Email của người dùng đã xác thực từ Security Context
     * @return DTO chứa loại điều khoản, phiên bản hiện tại, cờ accepted và thời điểm chấp nhận (nếu có)
     */
    MentoringTermsStatusResponse getCurrentTermsStatus(String userEmail);

    /**
     * Ghi nhận người dùng chấp nhận Điều khoản Hướng dẫn & Hỗ trợ cho phiên bản hiện tại.
     * Phương thức có tính chất idempotent: nếu người dùng đã chấp nhận phiên bản này trước đó,
     * hệ thống trả về thông tin chấp nhận đã lưu mà không tạo thêm bản ghi trùng lặp.
     *
     * @param userEmail Email của người dùng đã xác thực từ Security Context
     * @return DTO chứa thông tin kết quả chấp nhận điều khoản thành công
     */
    MentoringTermsAcceptResponse acceptCurrentTerms(String userEmail);
}
