package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.VerificationStatus;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.verification.VerificationRequestRepository;
import com.alumnect.alumnect_backend.dto.response.admin.AdminDashboardSummaryDto;
import com.alumnect.alumnect_backend.dto.response.admin.DayRegistrationStatDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lớp triển khai các nghiệp vụ thống kê hệ thống dành cho Admin.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserRepository userRepository;
    private final VerificationRequestRepository verificationRequestRepository;

    /**
     * Lấy dữ liệu thống kê tổng quan hệ thống KPIs và biểu đồ đăng ký.
     * Thống kê số lượng người dùng theo vai trò, trạng thái tài khoản,
     * số lượng yêu cầu xác minh đang chờ duyệt, và xu hướng đăng ký 7 ngày qua.
     *
     * @return DTO thống kê tổng quan
     */
    @Override
    public AdminDashboardSummaryDto getDashboardSummary() {
        long totalUsers = userRepository.count();
        long totalStudents = userRepository.countByRoleName("STUDENT");
        long totalAlumni = userRepository.countByRoleName("ALUMNI");
        long totalAdmins = userRepository.countByRoleName("ADMIN");
        long activeUsers = userRepository.countByAccountStatus(AccountStatus.ACTIVE);
        long lockedUsers = userRepository.countByAccountStatus(AccountStatus.LOCKED);
        long pendingVerifications = verificationRequestRepository.countByStatus(VerificationStatus.PENDING);

        // 1. Lấy xu hướng đăng ký 7 ngày gần nhất (bao gồm cả ngày hôm nay)
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDate sevenDaysAgo = today.minusDays(6);

        Instant startDate7 = sevenDaysAgo.atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        Instant endDate7 = today.plusDays(1).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();

        List<Object[]> rawStats = userRepository.countRegistrationsByDayInRange(startDate7, endDate7);

        Map<String, Long> statMap = new HashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (Object[] row : rawStats) {
            if (row[0] != null) {
                String dateStr;
                if (row[0] instanceof java.sql.Date) {
                    dateStr = ((java.sql.Date) row[0]).toLocalDate().format(formatter);
                } else if (row[0] instanceof LocalDate) {
                    dateStr = ((LocalDate) row[0]).format(formatter);
                } else {
                    dateStr = row[0].toString();
                }
                long count = ((Number) row[1]).longValue();
                statMap.put(dateStr, count);
            }
        }

        List<DayRegistrationStatDto> registrationsTrend = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = sevenDaysAgo.plusDays(i);
            String dateStr = date.format(formatter);
            long count = statMap.getOrDefault(dateStr, 0L);
            registrationsTrend.add(new DayRegistrationStatDto(dateStr, count));
        }

        // 2. Thống kê theo 12 tháng trong năm hiện tại từ CSDL
        LocalDate startOfYear = LocalDate.of(today.getYear(), 1, 1);
        LocalDate endOfYear = LocalDate.of(today.getYear(), 12, 31);
        Instant startInstYear = startOfYear.atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
        Instant endInstYear = endOfYear.plusDays(1).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();

        List<Object[]> rawMonthStats = userRepository.countRegistrationsByMonthInRange(startInstYear, endInstYear);
        Map<Integer, Long> monthMap = new HashMap<>();
        for (Object[] row : rawMonthStats) {
            if (row[0] != null) {
                int m = ((Number) row[0]).intValue();
                long c = ((Number) row[1]).longValue();
                monthMap.put(m, c);
            }
        }

        List<DayRegistrationStatDto> monthStats = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            long count = monthMap.getOrDefault(m, 0L);
            monthStats.add(new DayRegistrationStatDto("Tháng " + m, count));
        }

        // 3. Thống kê theo các năm từ CSDL
        List<Object[]> rawYearStats = userRepository.countRegistrationsByYear();
        List<DayRegistrationStatDto> yearStats = new ArrayList<>();
        for (Object[] row : rawYearStats) {
            if (row[0] != null) {
                String yLabel = "Năm " + ((Number) row[0]).intValue();
                long c = ((Number) row[1]).longValue();
                yearStats.add(new DayRegistrationStatDto(yLabel, c));
            }
        }
        if (yearStats.isEmpty()) {
            yearStats.add(new DayRegistrationStatDto("Năm " + today.getYear(), totalUsers));
        }

        return AdminDashboardSummaryDto.builder()
                .totalUsers(totalUsers)
                .totalStudents(totalStudents)
                .totalAlumni(totalAlumni)
                .totalAdmins(totalAdmins)
                .activeUsers(activeUsers)
                .lockedUsers(lockedUsers)
                .pendingVerifications(pendingVerifications)
                .registrationsLast7Days(registrationsTrend)
                .registrationsByMonth(monthStats)
                .registrationsByYear(yearStats)
                .build();
    }
}
