package com.alumnect.alumnect_backend.service.user;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dto.response.user.FollowUserResponse;
import com.alumnect.alumnect_backend.entity.user.Follow;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Lớp triển khai dịch vụ (Service Implementation) quản lý các hoạt động theo dõi và hủy theo dõi giữa các người dùng.
 * Thực thi interface {@link FollowService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FollowServiceImpl implements FollowService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final UserProfileRepository userProfileRepository;

    /**
     * Thực hiện theo dõi một người dùng.
     * Quy trình xử lý bao gồm:
     * 1. Tìm người dùng theo dõi (follower) qua email.
     * 2. Tìm người được theo dõi (following) qua ID.
     * 3. Kiểm tra ràng buộc không tự theo dõi chính mình.
     * 4. Kiểm tra trạng thái hoạt động ACTIVE của cả hai tài khoản.
     * 5. Kiểm tra xem đã theo dõi người dùng này từ trước chưa.
     * 6. Tạo mối quan hệ theo dõi mới và lưu vào cơ sở dữ liệu. Bắt lỗi vi phạm ràng buộc DB (DataIntegrityViolationException) để trả về 409 Conflict.
     *
     * @param followerEmail Email của người thực hiện theo dõi (Người đăng nhập hiện tại)
     * @param followingId ID của người dùng muốn theo dõi
     */
    @Override
    @Transactional
    public void followUser(String followerEmail, Long followingId) {
        log.info("Yêu cầu theo dõi: followerEmail={}, followingId={}", followerEmail, followingId);

        User follower = userRepository.findByEmail(followerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người thực hiện theo dõi."));

        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng cần theo dõi."));

        // Ràng buộc 1: Không tự theo dõi chính mình
        if (follower.getId().equals(following.getId())) {
            throw new BadRequestException("Bạn không thể tự theo dõi chính mình.");
        }

        // Ràng buộc 2: Cả hai tài khoản phải hoạt động (ACTIVE)
        if (follower.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Tài khoản của bạn chưa được kích hoạt hoặc đã bị khóa.");
        }
        if (following.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Tài khoản người dùng cần theo dõi chưa được kích hoạt hoặc đã bị khóa.");
        }

        // Ràng buộc 3: Kiểm tra đã theo dõi trước đó chưa
        boolean alreadyFollowed = followRepository.existsByFollowerIdAndFollowingId(follower.getId(), following.getId());
        if (alreadyFollowed) {
            throw new ConflictException("Bạn đã theo dõi người dùng này từ trước.");
        }

        // Lưu mối quan hệ theo dõi mới
        Follow follow = Follow.builder()
                .follower(follower)
                .following(following)
                .build();

        try {
            followRepository.saveAndFlush(follow);
        } catch (DataIntegrityViolationException e) {
            log.warn("Xảy ra xung đột dữ liệu khi follow (DataIntegrityViolationException): followerId={}, followingId={}", follower.getId(), following.getId());
            throw new ConflictException("Bạn đã theo dõi người dùng này từ trước.");
        }
        log.info("Theo dõi thành công: followerId={}, followingId={}", follower.getId(), following.getId());
    }

    /**
     * Thực hiện hủy theo dõi một người dùng.
     * Quy trình xử lý:
     * 1. Tìm người thực hiện hủy theo dõi qua email.
     * 2. Kiểm tra xem mối quan hệ theo dõi có tồn tại không.
     * 3. Xóa mối quan hệ theo dõi khỏi cơ sở dữ liệu.
     *
     * @param followerEmail Email của người thực hiện hủy theo dõi (Người đăng nhập hiện tại)
     * @param followingId ID của người dùng muốn hủy theo dõi
     */
    @Override
    @Transactional
    public void unfollowUser(String followerEmail, Long followingId) {
        log.info("Yêu cầu hủy theo dõi: followerEmail={}, followingId={}", followerEmail, followingId);

        User follower = userRepository.findByEmail(followerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người thực hiện hủy theo dõi."));

        // [C-02] Kiểm tra user đích có tồn tại không trước khi tìm Follow entity
        if (!userRepository.existsById(followingId)) {
            throw new ResourceNotFoundException("Không tìm thấy tài khoản người dùng cần hủy theo dõi.");
        }

        Follow follow = followRepository.findByFollowerIdAndFollowingId(follower.getId(), followingId)
                .orElseThrow(() -> new BadRequestException("Bạn chưa theo dõi người dùng này."));

        followRepository.delete(follow);
        log.info("Hủy theo dõi thành công: followerId={}, followingId={}", follower.getId(), followingId);
    }

    /**
     * Lấy danh sách những người đang theo dõi một người dùng (Followers) có phân trang.
     * Quy trình:
     * 1. Kiểm tra tài khoản cần xem có tồn tại và đang hoạt động không.
     * 2. Lấy trang kết quả các mối quan hệ theo dõi mà user là following.
     * 3. Trích xuất danh sách follower, nạp thông tin hồ sơ của họ theo lô (batch fetch) để tránh N+1 query.
     * 4. Kiểm tra trạng thái isFollowing của người xem hiện tại đối với từng follower trong danh sách.
     * 5. Trả về PageResponse chứa thông tin danh sách FollowUserResponse sạch.
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<FollowUserResponse> getFollowers(String currentViewerEmail, Long userId, Pageable pageable) {
        log.info("Lấy danh sách người theo dõi của userId={}", userId);

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));

        if (targetUser.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Người dùng này chưa được kích hoạt hoặc đã bị khóa.");
        }

        Page<Follow> followsPage = followRepository.findByFollowingId(userId, pageable);

        // Lấy thông tin người xem hiện tại nếu đã đăng nhập
        User currentViewer = null;
        if (currentViewerEmail != null) {
            currentViewer = userRepository.findByEmail(currentViewerEmail).orElse(null);
        }

        // Lấy danh sách ID của những người theo dõi
        List<Long> followerIds = followsPage.getContent().stream()
                .map(f -> f.getFollower().getId())
                .collect(Collectors.toList());

        // Nạp thông tin Profile của toàn bộ follower theo lô (batch fetch)
        Map<Long, UserProfile> profilesMap = userProfileRepository.findAllById(followerIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, p -> p));

        // Lấy thông tin người xem hiện tại nếu đã đăng nhập và nạp danh sách đã follow theo lô để tối ưu N+1
        Set<Long> followedUserIds = new HashSet<>();
        if (currentViewer != null && !followerIds.isEmpty()) {
            followedUserIds = followRepository.findByFollowerIdAndFollowingIdIn(currentViewer.getId(), followerIds).stream()
                    .map(f -> f.getFollowing().getId())
                    .collect(Collectors.toSet());
        }

        final Set<Long> finalFollowedUserIds = followedUserIds;
        List<FollowUserResponse> content = followsPage.getContent().stream()
                .map(f -> {
                    User followerUser = f.getFollower();
                    UserProfile profile = profilesMap.get(followerUser.getId());
                    String fullName = profile != null ? profile.getFullName() : "Thành viên AlumNect";
                    String avatarUrl = profile != null ? profile.getAvatarUrl() : null;
                    String headline = profile != null ? profile.getHeadline() : null;

                    boolean isFollowing = finalFollowedUserIds.contains(followerUser.getId());

                    return FollowUserResponse.builder()
                            .userId(followerUser.getId())
                            .email(followerUser.getEmail())
                            .fullName(fullName)
                            .avatarUrl(avatarUrl)
                            .headline(headline)
                            .isAccountVerified(followerUser.isAccountVerified())
                            .isFollowing(isFollowing)
                            .build();
                })
                .collect(Collectors.toList());

        return PageResponse.<FollowUserResponse>builder()
                .content(content)
                .pageNumber(followsPage.getNumber())
                .pageSize(followsPage.getSize())
                .totalElements(followsPage.getTotalElements())
                .totalPages(followsPage.getTotalPages())
                .last(followsPage.isLast())
                .build();
    }

    /**
     * Lấy danh sách những người mà một người dùng đang theo dõi (Following) có phân trang.
     * Quy trình tương tự như getFollowers nhưng lấy các mối quan hệ mà user là follower.
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<FollowUserResponse> getFollowing(String currentViewerEmail, Long userId, Pageable pageable) {
        log.info("Lấy danh sách người mà userId={} đang theo dõi", userId);

        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));

        if (targetUser.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Người dùng này chưa được kích hoạt hoặc đã bị khóa.");
        }

        Page<Follow> followsPage = followRepository.findByFollowerId(userId, pageable);

        User currentViewer = null;
        if (currentViewerEmail != null) {
            currentViewer = userRepository.findByEmail(currentViewerEmail).orElse(null);
        }

        // Lấy danh sách ID của những người được theo dõi
        List<Long> followingIds = followsPage.getContent().stream()
                .map(f -> f.getFollowing().getId())
                .collect(Collectors.toList());

        // Nạp thông tin Profile của toàn bộ following theo lô (batch fetch)
        Map<Long, UserProfile> profilesMap = userProfileRepository.findAllById(followingIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, p -> p));

        // Lấy thông tin người xem hiện tại nếu đã đăng nhập và nạp danh sách đã follow theo lô để tối ưu N+1
        Set<Long> followedUserIds = new HashSet<>();
        if (currentViewer != null && !followingIds.isEmpty()) {
            followedUserIds = followRepository.findByFollowerIdAndFollowingIdIn(currentViewer.getId(), followingIds).stream()
                    .map(f -> f.getFollowing().getId())
                    .collect(Collectors.toSet());
        }

        final Set<Long> finalFollowedUserIds = followedUserIds;
        List<FollowUserResponse> content = followsPage.getContent().stream()
                .map(f -> {
                    User followingUser = f.getFollowing();
                    UserProfile profile = profilesMap.get(followingUser.getId());
                    String fullName = profile != null ? profile.getFullName() : "Thành viên AlumNect";
                    String avatarUrl = profile != null ? profile.getAvatarUrl() : null;
                    String headline = profile != null ? profile.getHeadline() : null;

                    boolean isFollowing = finalFollowedUserIds.contains(followingUser.getId());

                    return FollowUserResponse.builder()
                            .userId(followingUser.getId())
                            .email(followingUser.getEmail())
                            .fullName(fullName)
                            .avatarUrl(avatarUrl)
                            .headline(headline)
                            .isAccountVerified(followingUser.isAccountVerified())
                            .isFollowing(isFollowing)
                            .build();
                })
                .collect(Collectors.toList());

        return PageResponse.<FollowUserResponse>builder()
                .content(content)
                .pageNumber(followsPage.getNumber())
                .pageSize(followsPage.getSize())
                .totalElements(followsPage.getTotalElements())
                .totalPages(followsPage.getTotalPages())
                .last(followsPage.isLast())
                .build();
    }
}
