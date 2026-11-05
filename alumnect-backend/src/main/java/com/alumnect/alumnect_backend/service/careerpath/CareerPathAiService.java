package com.alumnect.alumnect_backend.service.careerpath;

import com.alumnect.alumnect_backend.dto.request.careerpath.CareerAiCompareRequest;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerAiCompareResponse;

/**
 * Dịch vụ AI đối chiếu lộ trình 1-chạm với một cựu sinh viên bất kỳ [C2].
 */
public interface CareerPathAiService {

    /**
     * Đối chiếu hồ sơ người xem (lấy theo email đăng nhập) với cựu sinh viên mục tiêu.
     *
     * @throws com.alumnect.alumnect_backend.exception.ForbiddenException nếu người xem không phải Sinh viên/Cựu sinh viên
     * @throws com.alumnect.alumnect_backend.exception.BadRequestException nếu mục tiêu không hợp lệ hoặc là chính mình
     * @throws com.alumnect.alumnect_backend.exception.ResourceNotFoundException nếu không tìm thấy hồ sơ
     */
    CareerAiCompareResponse compare(String email, CareerAiCompareRequest request);
}
