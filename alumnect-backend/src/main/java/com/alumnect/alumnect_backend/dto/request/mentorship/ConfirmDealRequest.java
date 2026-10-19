package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * DTO xác nhận Deal Ticket (UC104). Client bắt buộc gửi phiên bản mà mình đang xem để server
 * từ chối việc xác nhận một phiên bản cũ đã bị thay thế (ví dụ giữ tab cũ khi Mentor đã tạo phiên bản mới).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmDealRequest {

    /** Phiên bản Deal Ticket mà người dùng đang xác nhận */
    @NotNull(message = "Phiên bản Deal Ticket cần xác nhận (version) không được để trống.")
    private Integer version;
}
