package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.AdminTaskFundDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.AdminTaskFundSummaryResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service quản lý Quỹ Task, Sổ quỹ giao dịch và lịch sử tài chính cho Quản trị viên (UC121 & Mục 5.7, 5.10).
 */
public interface MentoringFinanceService {

    /**
     * Tra cứu danh sách Quỹ theo từng Task Mentoring kèm bộ lọc và phân trang (UC121).
     *
     * @param adminUserId ID Quản trị viên
     * @param keyword Từ khóa tìm kiếm theo Task Title, ID, tên/email Học viên, Cố vấn
     * @param status Trạng thái Task
     * @param settlementStatus Trạng thái quyết toán (UNSETTLED, PARTIALLY_SETTLED, SETTLED)
     * @param pageable Phân trang
     * @return Danh sách phân trang tóm tắt quỹ Task
     */
    PageResponse<AdminTaskFundSummaryResponse> getTaskFunds(
            Long adminUserId,
            String keyword,
            String status,
            String settlementStatus,
            Pageable pageable
    );

    /**
     * Xem chi tiết toàn diện Sổ quỹ giao dịch, lịch sử gia hạn, điều chỉnh và quyết định phân bổ của Task (UC121).
     *
     * @param adminUserId ID Quản trị viên
     * @param taskId ID nhiệm vụ Mentoring Task
     * @return Chi tiết sổ quỹ và lịch sử tài chính
     */
    AdminTaskFundDetailResponse getTaskFundDetail(Long adminUserId, Long taskId);
}
