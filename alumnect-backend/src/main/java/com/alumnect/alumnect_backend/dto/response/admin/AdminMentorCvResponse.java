package com.alumnect.alumnect_backend.dto.response.admin;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/**
 * DTO chứa thông tin hồ sơ và tệp CV của Mentor dành cho Quản trị viên (UC96).
 * Cho phép Admin xem, kiểm tra thông tin CV chuyên môn mà không làm thay đổi trạng thái Mentor.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMentorCvResponse {

    /** ID của hồ sơ Mentor (bảng mentor_profiles) */
    private Long mentorProfileId;

    /** ID của người dùng sở hữu hồ sơ (bảng users) */
    private Long userId;

    /** Họ và tên đầy đủ của Mentor */
    private String mentorName;

    /** Email tài khoản Mentor */
    private String mentorEmail;

    /** Đường dẫn ảnh đại diện */
    private String avatarUrl;

    /** Vị trí / chức danh công việc hiện tại */
    private String currentPosition;

    /** Công ty / tổ chức hiện tại đang làm việc */
    private String currentCompany;

    /** Số năm kinh nghiệm cố vấn / làm việc */
    private Integer yearsOfExperience;

    /** Lời giới thiệu / Bio cố vấn */
    private String bio;

    /** Mã tệp CV / đường dẫn lưu trữ */
    private String cvFileKey;

    /** Đường dẫn xem hoặc tải xuống tệp CV trực tiếp */
    private String cvUrl;

    /** Trạng thái hồ sơ Mentor: INCOMPLETE, PAYMENT_PENDING, ACTIVE, EXPIRED */
    private MentorStatus mentorStatus;

    /** Hình thức cố vấn: ONLINE, OFFLINE, BOTH */
    private String workingMode;

    /** Loại hình cố vấn: INDIVIDUAL, GROUP, BOTH */
    private String mentoringType;

    /** Danh sách lĩnh vực hỗ trợ chuyên môn */
    private List<String> supportedFields;

    /** Danh sách các chủ đề cố vấn chuyên sâu */
    private List<String> topics;

    /** Tên ngân hàng nhận chi trả */
    private String bankName;

    /** Số tài khoản ngân hàng chi trả */
    private String bankAccountNumber;

    /** Tên chủ tài khoản ngân hàng chi trả */
    private String bankAccountHolder;

    /** Thời điểm cập nhật hồ sơ gần nhất */
    private Instant updatedAt;
}
