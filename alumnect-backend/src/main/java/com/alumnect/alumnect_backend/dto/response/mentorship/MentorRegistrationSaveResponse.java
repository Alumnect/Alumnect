package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO trả về kết quả sau khi lưu hoặc cập nhật thông tin đăng ký Mentor (PUT /api/v1/mentoring/registration).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorRegistrationSaveResponse {

    /** Định danh hồ sơ Mentor đã lưu */
    private Long mentorProfileId;

    /** Trạng thái hồ sơ Mentor sau khi lưu (INCOMPLETE hoặc PAYMENT_PENDING) */
    private MentorStatus mentorStatus;

    /** Cờ đánh giá hồ sơ đã thỏa mãn toàn bộ điều kiện hoàn tất UC91 hay chưa */
    private boolean isComplete;

    /** Mã bước tiếp theo gợi ý cho giao diện người dùng (ví dụ: UC92_SELECT_PACKAGE hoặc STAY_IN_DRAFT) */
    private String nextStep;

    /** Danh sách các trường còn thiếu nếu hồ sơ chưa hoàn tất */
    private List<String> missingFields;
}
