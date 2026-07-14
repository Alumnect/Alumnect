package com.alumnect.alumnect_backend.dto.response.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO chứa thông tin thống kê tổng quan hệ thống dành cho Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardSummaryDto {

    /** Tổng số lượng người dùng trong hệ thống */
    private Long totalUsers;

    /** Tổng số lượng người dùng có vai trò STUDENT */
    private Long totalStudents;

    /** Tổng số lượng người dùng có vai trò ALUMNI */
    private Long totalAlumni;

    /** Tổng số lượng người dùng có vai trò ADMIN */
    private Long totalAdmins;

    /** Tổng số lượng tài khoản đang hoạt động (ACTIVE) */
    private Long activeUsers;

    /** Tổng số lượng tài khoản đang bị khóa (LOCKED) */
    private Long lockedUsers;

    /** Tổng số lượng yêu cầu xác thực cựu sinh viên đang chờ duyệt (PENDING) */
    private Long pendingVerifications;

    /** Biểu đồ số lượng đăng ký tài khoản mới trong 7 ngày gần nhất */
    private List<DayRegistrationStatDto> registrationsLast7Days;
}
