package com.alumnect.alumnect_backend.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionRequest {

    @NotBlank(message = "Title mới không được để trống")
    @Size(max = 120, message = "Title mới tối đa 120 ký tự")
    private String newTitle;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDate newStartDate;

    private String description;

    private boolean reuseLocation;
}
