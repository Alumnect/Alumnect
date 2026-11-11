package com.alumnect.alumnect_backend.service.verification;

import com.alumnect.alumnect_backend.dto.request.verification.SubmitVerificationRequestDto;
import com.alumnect.alumnect_backend.dto.response.verification.VerificationStatusResponseDto;

/**
 * Interface định nghĩa các nghiệp vụ dành cho người dùng (Sinh viên/Cựu sinh viên)
 * liên quan đến việc gửi yêu cầu nâng cấp lên Cựu sinh viên và theo dõi trạng thái xét duyệt (UC08).
 */
public interface VerificationService {

    /**
     * Lấy trạng thái yêu cầu xác minh / nâng cấp Cựu sinh viên gần nhất của người dùng đang đăng nhập.
     *
     * @param email Email của người dùng trích xuất từ JWT Token
     * @return DTO chứa thông tin trạng thái xác minh hiện tại
     */
    VerificationStatusResponseDto getMyVerificationStatus(String email);

    /**
     * Gửi yêu cầu nâng cấp tài khoản từ Sinh viên (STUDENT) lên Cựu sinh viên (ALUMNI).
     * Tạo phiếu yêu cầu xác minh mới ở trạng thái PENDING và đồng bộ thông tin năm tốt nghiệp, chuyên ngành vào hồ sơ cá nhân.
     *
     * @param email   Email của người dùng trích xuất từ JWT Token
     * @param request DTO chứa thông tin minh chứng tốt nghiệp, năm tốt nghiệp và chuyên ngành
     * @return DTO chứa thông tin phiếu yêu cầu vừa khởi tạo
     */
    VerificationStatusResponseDto submitAlumniUpgradeRequest(String email, SubmitVerificationRequestDto request);
}

