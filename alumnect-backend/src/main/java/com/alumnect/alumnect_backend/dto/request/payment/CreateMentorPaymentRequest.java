package com.alumnect.alumnect_backend.dto.request.payment;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO yêu cầu khởi tạo giao dịch thanh toán gói Mentor qua cổng PayOS (UC93).
 * Lưu ý: Tuyệt đối không nhận giá tiền (amount) từ Client để đảm bảo an toàn giao dịch.
 * Giá tiền được trích xuất trực tiếp từ cơ sở dữ liệu (mentor_packages / mentor_subscriptions).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMentorPaymentRequest {

    /**
     * Mã định danh gói Mentor được chọn (tùy chọn nếu người dùng đã chọn gói trước đó tại UC92).
     */
    @Schema(description = "ID gói dịch vụ Mentor được chọn thanh toán (tùy chọn)", example = "1")
    private Long packageId;
}
