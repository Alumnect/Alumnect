package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;

/**
 * Request tạo Ticket đề xuất gia hạn thời hạn Mentoring Task (UC109).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDeadlineExtensionRequest {

    /** Thời hạn mới được đề xuất (phải lớn hơn deadline hiện tại và thời điểm hiện tại) */
    @NotNull(message = "Thời hạn mới không được để trống")
    @Future(message = "Thời hạn gia hạn đề xuất phải ở trong tương lai")
    private Instant proposedDeadline;

    /** Lý do đề xuất gia hạn */
    @NotBlank(message = "Lý do gia hạn không được để trống")
    @Size(min = 10, max = 1000, message = "Lý do gia hạn phải từ 10 đến 1000 ký tự")
    private String reason;
}
