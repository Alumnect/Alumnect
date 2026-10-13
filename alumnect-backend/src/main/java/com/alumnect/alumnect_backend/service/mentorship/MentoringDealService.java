package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.dto.request.mentorship.ProposeDealRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateDealRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealResponse;
import org.springframework.data.domain.Pageable;

/**
 * Giao diện nghiệp vụ Thỏa thuận Mentoring Deal (UC104) — bước tiếp nối của Request trong Chat for Task.
 * Mỗi Chat for Task (Request + Student + Mentor) có một luồng Deal; mỗi lần Mentor gửi điều khoản sinh một phiên bản
 * Deal Ticket mới (lưu ở mentoring_deal_snapshots). Chỉ phiên bản mới nhất được xác nhận / thanh toán.
 */
public interface MentoringDealService {

    /**
     * Mentor phát hành phiên bản Deal Ticket mới trong Chat for Task.
     * Mô tả chi tiết: REQUEST_ACCEPTANCE lấy điều khoản từ Request, RENEGOTIATION dùng điều khoản Mentor nhập.
     * Mentor được tính là đã xác nhận phiên bản vừa gửi; Học viên cần xác nhận lại.
     *
     * @param currentUserId ID người dùng đang đăng nhập (bắt buộc là Mentor của Chat for Task)
     * @param request DTO chứa conversationId, proposalSource và điều khoản (nếu deal lại)
     * @return Deal sau khi phát hành phiên bản mới
     */
    MentoringDealResponse proposeDeal(Long currentUserId, ProposeDealRequest request);

    /**
     * Mentor deal lại trên một Deal đã có (tương đương proposeDeal với RENEGOTIATION).
     *
     * @param currentUserId ID người dùng đang đăng nhập (Mentor)
     * @param dealId ID của Deal
     * @param request Điều khoản mới
     * @return Deal sau khi phát hành phiên bản mới
     */
    MentoringDealResponse updateDealTerms(Long currentUserId, Long dealId, UpdateDealRequest request);

    /**
     * Xác nhận đúng phiên bản Deal Ticket đang xem. Khi cả hai bên cùng xác nhận một phiên bản:
     * khóa Deal (DEAL_CONFIRMED), chọn Mentor cho Request (atomic, một Request chỉ chốt một Mentor),
     * đóng các Deal/Chat cạnh tranh sang chỉ đọc. Không tạo Task ở bước này.
     *
     * @param currentUserId ID người dùng đang đăng nhập
     * @param dealId ID của Deal
     * @param version Phiên bản Deal Ticket mà người dùng xác nhận (phải là phiên bản mới nhất)
     * @return Deal sau khi xác nhận
     */
    MentoringDealResponse confirmDeal(Long currentUserId, Long dealId, Integer version);

    /**
     * Xem chi tiết Deal kèm toàn bộ lịch sử phiên bản.
     *
     * @param currentUserId ID người dùng đang đăng nhập
     * @param dealId ID của Deal
     * @return Chi tiết Deal
     */
    MentoringDealDetailResponse getDealDetail(Long currentUserId, Long dealId);

    /**
     * Danh sách Deal mà người dùng tham gia.
     *
     * @param currentUserId ID người dùng đang đăng nhập
     * @param status Bộ lọc trạng thái (tùy chọn)
     * @param pageable Phân trang
     * @return Trang Deal
     */
    PageResponse<MentoringDealResponse> getMyDeals(Long currentUserId, MentoringDealStatus status, Pageable pageable);

    /**
     * Lấy Deal của một Chat for Task (null nếu Mentor chưa gửi Deal Ticket nào).
     *
     * @param currentUserId ID người dùng đang đăng nhập (phải là thành viên cuộc hội thoại)
     * @param conversationId ID Chat for Task
     * @return Chi tiết Deal hoặc null
     */
    MentoringDealDetailResponse getDealByConversation(Long currentUserId, Long conversationId);

    /**
     * Hủy luồng Deal khi chưa khóa.
     *
     * @param currentUserId ID người dùng đang đăng nhập
     * @param dealId ID của Deal
     * @param reason Lý do (tùy chọn)
     * @return Deal sau khi hủy
     */
    MentoringDealResponse cancelDeal(Long currentUserId, Long dealId, String reason);

    /**
     * Học viên từ chối phiên bản Deal Ticket hiện tại (không xóa Request, không tạo Task/Payment).
     *
     * @param currentUserId ID người dùng đang đăng nhập (Học viên)
     * @param dealId ID của Deal
     * @param reason Lý do (tùy chọn)
     * @param version Phiên bản đang xem (tùy chọn, nếu gửi sẽ được kiểm tra khớp phiên bản mới nhất)
     * @return Deal sau khi từ chối
     */
    MentoringDealResponse rejectDeal(Long currentUserId, Long dealId, String reason, Integer version);

    /**
     * Học viên yêu cầu Mentor điều chỉnh phiên bản hiện tại (phiên bản chuyển SUPERSEDED, không thể thanh toán).
     *
     * @param currentUserId ID người dùng đang đăng nhập (Học viên)
     * @param dealId ID của Deal
     * @param note Nội dung cần điều chỉnh (tùy chọn)
     * @param version Phiên bản đang xem (tùy chọn, nếu gửi sẽ được kiểm tra khớp phiên bản mới nhất)
     * @return Deal sau khi yêu cầu điều chỉnh
     */
    MentoringDealResponse requestAdjustment(Long currentUserId, Long dealId, String note, Integer version);
}
