package com.alumnect.alumnect_backend.dto.request.mentorship;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu gửi đánh giá và nhận xét Mentor từ học viên.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorReviewRequest {

    @NotNull(message = "Mentor Profile ID không được để trống")
    private Long mentorProfileId;

    @NotNull(message = "Số sao đánh giá không được để trống")
    @Min(value = 1, message = "Số sao tối thiểu là 1")
    @Max(value = 5, message = "Số sao tối đa là 5")
    private Integer rating;

    @Size(max = 1000, message = "Nội dung nhận xét tối đa 1000 ký tự")
    private String comment;
}
