package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.dto.request.mentorship.ProposeDealRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateDealRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealResponse;
import org.springframework.data.domain.Pageable;

/**
 * Giao diện Service quản lý nghiệp vụ thỏa thuận và xác nhận Mentoring Deal (UC104).
 */
public interface MentoringDealService {

    /**
     * Khởi tạo đề xuất thỏa thuận Mentoring Deal mới giữa Student và Mentor.
     *
     * @param currentUserId ID người dùng thực hiện thao tác (Student hoặc Mentor)
     * @param request DTO chứa các điều khoản đề xuất ban đầu
     * @return DTO thông tin Deal vừa được khởi tạo
     */
    MentoringDealResponse proposeDeal(Long currentUserId, ProposeDealRequest request);

    /**
     * Điều chỉnh các điều khoản của Deal (Task Scope, Price, Deadline, Working Mode...).
     * Tự động sinh ra phiên bản Snapshot mới và yêu cầu bên còn lại xác nhận lại.
     *
     * @param currentUserId ID người dùng thực hiện điều chỉnh
     * @param dealId ID của thỏa thuận Deal cần điều chỉnh
     * @param request DTO chứa các điều khoản mới cập nhật
     * @return DTO thông tin Deal sau khi cập nhật
     */
    MentoringDealResponse updateDealTerms(Long currentUserId, Long dealId, UpdateDealRequest request);

    /**
     * Xác nhận thỏa thuận Deal Snapshot hiện tại từ một bên (Student hoặc Mentor).
     * Khi cả hai bên đều xác nhận, hệ thống tự động khóa Snapshot và chuyển Deal sang DEAL_CONFIRMED.
     *
     * @param currentUserId ID người dùng thực hiện xác nhận
     * @param dealId ID của thỏa thuận Deal
     * @return DTO thông tin Deal với trạng thái xác nhận mới nhất
     */
    MentoringDealResponse confirmDeal(Long currentUserId, Long dealId);

    /**
     * Xem thông tin chi tiết của một Deal bao gồm điều khoản hiện tại,
     * Snapshot mới nhất và toàn bộ lịch sử các phiên bản Snapshot.
     *
     * @param currentUserId ID người dùng đang truy cập
     * @param dealId ID của thỏa thuận Deal
     * @return DTO chi tiết toàn diện của Deal
     */
    MentoringDealDetailResponse getDealDetail(Long currentUserId, Long dealId);

    /**
     * Lấy danh sách các thỏa thuận Deal của người dùng hiện tại (với tư cách Student hoặc Mentor).
     *
     * @param currentUserId ID người dùng đang truy cập
     * @param status Bộ lọc trạng thái tùy chọn
     * @param pageable Tham số phân trang
     * @return Danh sách phân trang các Deal
     */
    PageResponse<MentoringDealResponse> getMyDeals(Long currentUserId, MentoringDealStatus status, Pageable pageable);

    /**
     * Lấy thông tin Deal mới nhất gắn với một cuộc trò chuyện Direct Messaging (1-1).
     *
     * @param currentUserId ID người dùng đang truy cập
     * @param conversationId ID cuộc trò chuyện
     * @return DTO chi tiết Deal hoặc null nếu chưa có thỏa thuận nào
     */
    MentoringDealDetailResponse getDealByConversation(Long currentUserId, Long conversationId);

    /**
     * Hủy bỏ một thỏa thuận Deal trước khi bị khóa chốt.
     *
     * @param currentUserId ID người dùng thực hiện hủy
     * @param dealId ID của thỏa thuận Deal
     * @param reason Lý do hủy bỏ tùy chọn
     * @return DTO thông tin Deal đã chuyển sang trạng thái CANCELLED
     */
    MentoringDealResponse cancelDeal(Long currentUserId, Long dealId, String reason);
}
