package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * Request phản hồi (chấp nhận hoặc từ chối) Ticket điều chỉnh Task (UC109).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RespondTaskAmendmentRequest {

    /** Chấp nhận (true) hoặc từ chối (false) điều chỉnh */
    @NotNull(message = "Lựa chọn chấp nhận hoặc từ chối không được để trống")
    private Boolean accept;

    /** Ghi chú giải trình khi phản hồi */
    @Size(max = 500, message = "Ghi chú phản hồi tối đa 500 ký tự")
    private String responseNote;
}
