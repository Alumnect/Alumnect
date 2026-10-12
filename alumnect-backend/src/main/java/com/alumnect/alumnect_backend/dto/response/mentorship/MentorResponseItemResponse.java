package com.alumnect.alumnect_backend.dto.response.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * DTO đại diện cho thông tin phản hồi của một Mentor đối với yêu cầu Mentoring (UC102).
 * Phục vụ cho sinh viên theo dõi trạng thái phản hồi của từng Mentor được phân phối.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorResponseItemResponse {

    /** ID hồ sơ Mentor (mentor_profiles.id) */
    private Long mentorProfileId;

    /** ID tài khoản người dùng của Mentor (users.id) dùng để khởi tạo tin nhắn trực tiếp */
    private Long mentorUserId;

    /** Họ tên hiển thị của Mentor */
    private String mentorName;

    /** URL ảnh đại diện của Mentor */
    private String mentorAvatar;

    /** Chức danh nghề nghiệp / Khẩu hiệu của Mentor */
    private String mentorHeadline;

    /** Danh sách tên các lĩnh vực hỗ trợ chuyên môn của Mentor */
    private List<String> supportedFields;

    /** Trạng thái phân phối gốc từ cơ sở dữ liệu: PENDING, ACCEPTED, REJECTED, EXPIRED */
    private MentoringDistributionStatus distributionStatus;

    /**
     * Trạng thái phản hồi theo thuật ngữ nghiệp vụ hiển thị cho sinh viên:
     * - WAITING: Mentor chưa phản hồi (tương ứng PENDING)
     * - ACCEPTED: Mentor đồng ý trao đổi / thương lượng
     * - DECLINED: Mentor từ chối yêu cầu (tương ứng REJECTED)
     * - EXPIRED: Yêu cầu phân phối đã quá hạn
     */
    private String responseStatus;

    /** Lời nhắn, ghi chú hoặc lý do phản hồi của Mentor (nếu có) */
    private String responseNote;

    /** Thời điểm yêu cầu được phân phối tới Mentor */
    private Instant distributedAt;

    /** Thời điểm Mentor phản hồi tiếp nhận hoặc từ chối */
    private Instant respondedAt;

    /**
     * Cho phép nhắn tin trao đổi hay không.
     * Chỉ bật true khi Mentor có phản hồi ACCEPTED (BR: ACCEPTED chỉ đồng ý trao đổi, không phải Deal).
     */
    private boolean canMessage;
}
