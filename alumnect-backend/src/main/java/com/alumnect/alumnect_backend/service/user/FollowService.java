package com.alumnect.alumnect_backend.service.user;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.user.FollowUserResponse;
import org.springframework.data.domain.Pageable;

/**
 * Giao diện dịch vụ (Service Interface) quản lý các hoạt động theo dõi và hủy theo dõi giữa các người dùng.
 */
public interface FollowService {

    /**
     * Thực hiện theo dõi một người dùng.
     * Quy tắc nghiệp vụ:
     * - Người thực hiện theo dõi không được tự theo dõi chính mình.
     * - Chỉ người dùng có trạng thái tài khoản hoạt động mới có thể theo dõi/được theo dõi.
     * - Không cho phép theo dõi trùng lặp.
     *
     * @param followerEmail Email của người thực hiện theo dõi (Người đăng nhập hiện tại)
     * @param followingId ID của người dùng muốn theo dõi
     */
    void followUser(String followerEmail, Long followingId);

    /**
     * Thực hiện hủy theo dõi một người dùng.
     * Quy tắc nghiệp vụ:
     * - Phải tồn tại mối quan hệ theo dõi trước đó.
     *
     * @param followerEmail Email của người thực hiện hủy theo dõi (Người đăng nhập hiện tại)
     * @param followingId ID của người dùng muốn hủy theo dõi
     */
    void unfollowUser(String followerEmail, Long followingId);

    /**
     * Lấy danh sách những người đang theo dõi một người dùng (Followers).
     *
     * @param currentViewerEmail Email của người đang xem danh sách (Có thể null nếu là khách vãng lai)
     * @param userId ID của người dùng cần xem danh sách người theo dõi
     * @param pageable Cấu hình phân trang
     * @return Trang danh sách người theo dõi thu gọn
     */
    PageResponse<FollowUserResponse> getFollowers(String currentViewerEmail, Long userId, Pageable pageable);

    /**
     * Lấy danh sách những người mà một người dùng đang theo dõi (Following).
     *
     * @param currentViewerEmail Email của người đang xem danh sách (Có thể null nếu là khách vãng lai)
     * @param userId ID của người dùng cần xem danh sách đang theo dõi
     * @param pageable Cấu hình phân trang
     * @return Trang danh sách người đang theo dõi thu gọn
     */
    PageResponse<FollowUserResponse> getFollowing(String currentViewerEmail, Long userId, Pageable pageable);
}
