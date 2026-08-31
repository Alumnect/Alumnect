package com.alumnect.alumnect_backend.service.user;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.user.ChangePasswordRequest;
import com.alumnect.alumnect_backend.dto.response.user.UserProfileResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.user.UserProfileMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dto.response.user.PrimaryExperienceResponse;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.Follow;

import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.request.user.UpdateProfileRequest;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.user.UserSkill;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.user.ConnectionSuggestionResponse;
import com.alumnect.alumnect_backend.dto.response.user.MajorResponse;
import com.alumnect.alumnect_backend.dto.response.user.UserDirectoryResponse;
import com.alumnect.alumnect_backend.dto.response.user.UserFilterOptionsResponse;
import com.alumnect.alumnect_backend.dto.response.user.UserProfileResponse;
import com.alumnect.alumnect_backend.dto.response.user.UserSkillResponse;
import com.alumnect.alumnect_backend.specification.user.UserSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Lớp triển khai dịch vụ (Service Implementation) quản lý thông tin tài khoản người dùng.
 * Thực thi interface {@link UserService}.
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserProfileMapper userProfileMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final ExperienceRepository experienceRepository;
    private final MajorRepository majorRepository;
    private final UserSkillRepository userSkillRepository;
    private final FollowRepository followRepository;

    /**
     * Thực hiện thay đổi mật khẩu tài khoản người dùng.
     * Quy trình xử lý bao gồm:
     * 1. Tìm người dùng trong DB qua email.
     * 2. Xác thực mật khẩu cũ bằng BCrypt. Nếu passwordHash là null hoặc không khớp, ném BadRequestException.
     * 3. So sánh mật khẩu mới với mật khẩu cũ để tránh trùng lặp.
     * 4. Kiểm tra sự trùng khớp của xác nhận mật khẩu mới.
     * 5. Mã hóa mật khẩu mới và lưu vào DB.
     *
     * @param email Địa chỉ email của người dùng yêu cầu đổi mật khẩu
     * @param request DTO chứa thông tin mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu mới
     */
    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với email: " + email));

        // 1. Xác thực mật khẩu hiện tại (so khớp BCrypt)
        // Nếu passwordHash null (đăng ký qua Google chưa tạo pass) hoặc passwordEncoder so khớp không trùng
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác.");
        }

        // 2. Kiểm tra mật khẩu mới trùng mật khẩu cũ
        if (request.getNewPassword().equals(request.getOldPassword())) {
            throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
        }

        // 3. Kiểm tra mật khẩu mới khớp với confirm mật khẩu mới
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new BadRequestException("Xác nhận mật khẩu mới không trùng khớp.");
        }

        // 4. Cập nhật mật khẩu mới mã hóa
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * Lấy thông tin hồ sơ cá nhân của tài khoản hiện tại qua email đăng nhập.
     * Quy trình xử lý:
     * 1. Tìm tài khoản người dùng theo email.
     * 2. Kiểm tra hồ sơ cá nhân đính kèm.
     * 3. Ánh xạ từ thực thể sang DTO phản hồi.
     *
     * @param email Địa chỉ email của người dùng đăng nhập hiện tại
     * @return DTO chứa hồ sơ cá nhân chi tiết
     */
    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getOwnProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với email: " + email));

        if (user.getProfile() == null) {
            throw new ResourceNotFoundException("Không tìm thấy hồ sơ cá nhân cho tài khoản: " + email);
        }

        UserProfileResponse response = userProfileMapper.toResponse(user.getProfile());
        populatePrimaryExperience(user.getId(), response);

        // Bổ sung thống kê theo dõi cho tài khoản cá nhân
        long followersCount = followRepository.countByFollowingId(user.getId());
        long followingCount = followRepository.countByFollowerId(user.getId());
        response.setFollowersCount(followersCount);
        response.setFollowingCount(followingCount);
        response.setIsFollowing(false); // Bản thân không tự theo dõi mình

        return response;
    }

    /**
     * Lấy thông tin hồ sơ cá nhân của người dùng khác qua ID tài khoản.
     * Hỗ trợ truy cập công khai không cần token:
     * - Yêu cầu tài khoản cần xem bắt buộc phải ở trạng thái hoạt động (ACTIVE) đối với mọi đối tượng truy cập.
     *
     * @param userId ID của người dùng cần xem hồ sơ
     * @return DTO chứa hồ sơ cá nhân chi tiết
     */
    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(Long userId) {
        User targetUser = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với ID: " + userId));

        if (targetUser.getProfile() == null) {
            throw new ResourceNotFoundException("Không tìm thấy hồ sơ cá nhân cho tài khoản với ID: " + userId);
        }

        // Yêu cầu tài khoản cần xem phải ở trạng thái hoạt động (ACTIVE)
        if (targetUser.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new BadRequestException("Tài khoản người dùng này chưa được kích hoạt hoặc đã bị khóa.");
        }

        UserProfileResponse response = userProfileMapper.toResponse(targetUser.getProfile());
        populatePrimaryExperience(targetUser.getId(), response);

        // Bổ sung thống kê theo dõi cho tài khoản người dùng khác
        long followersCount = followRepository.countByFollowingId(targetUser.getId());
        long followingCount = followRepository.countByFollowerId(targetUser.getId());
        response.setFollowersCount(followersCount);
        response.setFollowingCount(followingCount);

        // Kiểm tra xem người đang xem hiện tại có đang theo dõi người này không
        String currentViewerEmail = getAuthenticatedUserEmailOrNull();
        if (currentViewerEmail != null) {
            userRepository.findByEmail(currentViewerEmail).ifPresent(viewer -> {
                boolean isFollowing = followRepository.existsByFollowerIdAndFollowingId(viewer.getId(), targetUser.getId());
                response.setIsFollowing(isFollowing);
            });
        } else {
            response.setIsFollowing(false);
        }

        return response;
    }

    /**
     * Cập nhật thông tin hồ sơ cá nhân của người dùng đăng nhập hiện tại.
     *
     * @param email Địa chỉ email người dùng
     * @param request DTO dữ liệu hồ sơ cá nhân
     * @return UserProfileResponse thông tin hồ sơ sau cập nhật
     */
    @Override
    @Transactional
    public UserProfileResponse updateOwnProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với email: " + email));

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
            profile.setUserId(user.getId());
        }

        // Map các trường cơ bản từ Request DTO vào Entity
        userProfileMapper.updateEntityFromRequest(request, profile);

        // Cập nhật Major nếu được chỉ định
        if (request.getMajorId() != null) {
            Major major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyên ngành với ID: " + request.getMajorId()));
            profile.setMajor(major);
        } else {
            profile.setMajor(null);
        }

        // Lưu thông tin hồ sơ cá nhân
        UserProfile savedProfile = userProfileRepository.save(profile);

        // Cập nhật danh sách kỹ năng của người dùng nếu danh sách không null
        if (request.getSkills() != null) {
            userSkillRepository.deleteByUserId(user.getId());
            userSkillRepository.flush(); // Bắt buộc flush DELETE SQL xuống PostgreSQL trước khi chèn danh sách kỹ năng mới
            if (!request.getSkills().isEmpty()) {

                List<UserSkill> newSkills = new ArrayList<>();
                for (var skillReq : request.getSkills()) {
                    UserSkill us = UserSkill.builder()
                            .user(user)
                            .groupName(skillReq.getGroupName())
                            .skillName(skillReq.getSkillName())
                            .sortOrder(skillReq.getSortOrder())
                            .build();
                    newSkills.add(us);
                }
                userSkillRepository.saveAll(newSkills);
            }
        }

        // Nạp dữ liệu hoàn chỉnh để trả về
        UserProfile updatedProfile = userProfileRepository.findById(user.getId())
                .orElse(savedProfile);

        UserProfileResponse response = userProfileMapper.toResponse(updatedProfile);
        populatePrimaryExperience(user.getId(), response);
        return response;
    }

    private void populatePrimaryExperience(Long userId, UserProfileResponse response) {
        experienceRepository.findByUserIdAndIsPrimaryTrue(userId).ifPresent(exp -> {
            PrimaryExperienceResponse per = PrimaryExperienceResponse.builder()
                    .id(exp.getId())
                    .title(exp.getTitle())
                    .company(exp.getCompany())
                    .location(exp.getLocation())
                    .latitude(exp.getLatitude())
                    .longitude(exp.getLongitude())
                    .build();
            response.setPrimaryExperience(per);
        });
    }

    /**
     * Lấy email của người dùng đã xác thực hiện tại, trả về null nếu truy cập ẩn danh.
     */
    private String getAuthenticatedUserEmailOrNull() {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() &&
                !"anonymousUser".equals(authentication.getName())) {
            return authentication.getName();
        }
        return null;
    }

    /**
     * Tìm kiếm và lọc danh sách thành viên trong mạng lưới cựu sinh viên & sinh viên (Alumni Directory).
     * Hỗ trợ tìm kiếm từ khóa đa trường, lọc theo vai trò, chuyên ngành, niên khóa, địa điểm, kỹ năng, công ty.
     * Tự động bổ sung thông tin kinh nghiệm chính, kỹ năng, số follower/following và cờ isFollowing.
     *
     * @param query Từ khóa tìm kiếm đa năng
     * @param role Vai trò người dùng (STUDENT hoặc ALUMNI)
     * @param majorId ID chuyên ngành
     * @param cohort Niên khóa / Khóa nhập học
     * @param city Tỉnh / Thành phố
     * @param skill Kỹ năng cụ thể
     * @param company Công ty làm việc
     * @param page Số trang (bắt đầu từ 0)
     * @param size Kích thước trang
     * @param sortBy Trường sắp xếp (createdAt, fullName, cohort)
     * @param sortDirection Hướng sắp xếp (ASC, DESC)
     * @return Danh sách phân trang người dùng bọc trong PageResponse<UserDirectoryResponse>
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserDirectoryResponse> searchUsers(
            String query,
            String role,
            Long majorId,
            Integer cohort,
            String city,
            String skill,
            String company,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String property = "createdAt";
        if ("fullName".equalsIgnoreCase(sortBy)) {
            property = "profile.fullName";
        } else if ("cohort".equalsIgnoreCase(sortBy)) {
            property = "profile.cohort";
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));

        Specification<User> spec = UserSpecification.filterUsers(query, role, majorId, cohort, city, skill, company);
        Page<User> userPage = userRepository.findAll(spec, pageable);

        List<User> users = userPage.getContent();
        if (users.isEmpty()) {
            return new PageResponse<>(
                    Collections.emptyList(),
                    userPage.getNumber(),
                    userPage.getSize(),
                    userPage.getTotalElements(),
                    userPage.getTotalPages(),
                    userPage.isLast()
            );
        }

        List<Long> userIds = users.stream().map(User::getId).toList();

        // 1. Batch fetch kinh nghiệm chính (Primary Experience) cho tất cả users trong trang (1 Query)
        List<Experience> primaryExperiences = experienceRepository.findByUserIdInAndIsPrimaryTrue(userIds);
        Map<Long, PrimaryExperienceResponse> expMap = primaryExperiences.stream()
                .collect(Collectors.toMap(
                        exp -> exp.getUser().getId(),
                        exp -> PrimaryExperienceResponse.builder()
                                .id(exp.getId())
                                .title(exp.getTitle())
                                .company(exp.getCompany())
                                .location(exp.getLocation())
                                .latitude(exp.getLatitude())
                                .longitude(exp.getLongitude())
                                .build(),
                        (existing, replacement) -> existing
                ));

        // 2. Batch fetch số lượng Followers cho tất cả users trong trang (1 Query)
        List<Object[]> followersCountList = followRepository.countFollowersByUserIds(userIds);
        Map<Long, Long> followersCountMap = followersCountList.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> ((Number) row[1]).longValue()
                ));

        // 3. Batch fetch số lượng Following cho tất cả users trong trang (1 Query)
        List<Object[]> followingCountList = followRepository.countFollowingByUserIds(userIds);
        Map<Long, Long> followingCountMap = followingCountList.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> ((Number) row[1]).longValue()
                ));

        // 4. Batch fetch trạng thái isFollowing nếu người xem đã đăng nhập (1 Query)
        String currentViewerEmail = getAuthenticatedUserEmailOrNull();
        Set<Long> followedUserIds = new HashSet<>();
        if (currentViewerEmail != null) {
            Long currentViewerId = userRepository.findByEmail(currentViewerEmail).map(User::getId).orElse(null);
            if (currentViewerId != null) {
                List<Follow> follows = followRepository.findByFollowerIdAndFollowingIdIn(currentViewerId, userIds);
                followedUserIds = follows.stream()
                        .map(f -> f.getFollowing().getId())
                        .collect(Collectors.toSet());
            }
        }

        final Set<Long> finalFollowedUserIds = followedUserIds;

        List<UserDirectoryResponse> content = users.stream().map(user -> {
            UserProfile profile = user.getProfile();
            UserDirectoryResponse item;
            if (profile != null) {
                item = userProfileMapper.toDirectoryResponse(profile);
            } else {
                item = UserDirectoryResponse.builder()
                        .userId(user.getId())
                        .email(user.getEmail())
                        .role(user.getRole() != null ? user.getRole().getName() : "")
                        .isAccountVerified(user.isAccountVerified())
                        .createdAt(user.getCreatedAt())
                        .build();
            }

            // Gán thông tin kinh nghiệm làm việc chính từ Map
            item.setPrimaryExperience(expMap.get(user.getId()));

            // Gán thống kê số lượng người theo dõi từ Map
            item.setFollowersCount(followersCountMap.getOrDefault(user.getId(), 0L));
            item.setFollowingCount(followingCountMap.getOrDefault(user.getId(), 0L));

            // Gán trạng thái theo dõi đối với người xem
            item.setIsFollowing(finalFollowedUserIds.contains(user.getId()));

            return item;
        }).toList();

        return new PageResponse<>(
                content,
                userPage.getNumber(),
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.isLast()
        );
    }

    /**
     * Lấy danh sách các tùy chọn bộ lọc động (khóa học, thành phố) từ DB.
     *
     * @return DTO chứa danh sách khóa học và thành phố thực tế
     */
    @Override
    @Transactional(readOnly = true)
    public UserFilterOptionsResponse getFilterOptions() {
        List<Integer> cohorts = userProfileRepository.findDistinctCohorts();
        List<String> cities = userProfileRepository.findDistinctCities();
        return UserFilterOptionsResponse.builder()
                .cohorts(cohorts)
                .cities(cities)
                .build();
    }

    /**
     * Lấy danh sách thành viên đề xuất kết nối (UC10 - View Connection Suggestions).
     * Dựa trên thuật toán tính điểm tương đồng (cùng chuyên ngành, cùng niên khóa, cùng địa điểm, tài khoản verified).
     *
     * @param email Email tài khoản người xem (nếu đã đăng nhập, null nếu là khách vãng lai)
     * @param limit Số lượng đề xuất tối đa
     * @return Danh sách thành viên được gợi ý kèm lý do trực quan
     */
    @Override
    @Transactional(readOnly = true)
    public List<ConnectionSuggestionResponse> getConnectionSuggestions(String email, int limit) {
        if (limit <= 0) {
            limit = 5;
        }
        if (limit > 50) {
            limit = 50;
        }

        User currentUser = null;
        if (email != null && !email.isBlank()) {
            currentUser = userRepository.findByEmail(email).orElse(null);
        }

        List<User> candidateUsers;
        List<Long> followedIds = Collections.emptyList();

        if (currentUser != null) {
            followedIds = followRepository.findFollowingIdsByFollowerId(currentUser.getId());
            Set<Long> excludedSet = new HashSet<>(followedIds);
            excludedSet.add(currentUser.getId());
            candidateUsers = userRepository.findCandidatesForSuggestions(currentUser.getId(), excludedSet);
        } else {
            candidateUsers = userRepository.findGuestCandidates();
        }

        if (candidateUsers.isEmpty()) {
            return Collections.emptyList();
        }

        // Tải hàng loạt (Batch Fetching) để triệt tiêu lỗi N+1 Query
        List<Long> candidateUserIds = candidateUsers.stream().map(User::getId).toList();

        // 1. Batch Fetch Primary Experience
        List<Experience> primaryExperiences = experienceRepository.findByUserIdInAndIsPrimaryTrue(candidateUserIds);
        Map<Long, PrimaryExperienceResponse> expMap = primaryExperiences.stream()
                .collect(Collectors.toMap(
                        e -> e.getUser().getId(),
                        e -> PrimaryExperienceResponse.builder()
                                .id(e.getId())
                                .title(e.getTitle())
                                .company(e.getCompany())
                                .location(e.getLocation())
                                .build(),
                        (existing, replacement) -> existing
                ));

        // 2. Batch Fetch Followers Count
        List<Object[]> followersCountResults = followRepository.countFollowersByUserIds(candidateUserIds);
        Map<Long, Long> followersCountMap = followersCountResults.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        // 3. Batch Fetch Following Count
        List<Object[]> followingCountResults = followRepository.countFollowingByUserIds(candidateUserIds);
        Map<Long, Long> followingCountMap = followingCountResults.stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        UserProfile currentProfile = (currentUser != null) ? currentUser.getProfile() : null;
        Long currentMajorId = (currentProfile != null && currentProfile.getMajor() != null) ? currentProfile.getMajor().getId() : null;
        String currentMajorName = (currentProfile != null && currentProfile.getMajor() != null) ? currentProfile.getMajor().getName() : null;
        Integer currentCohort = (currentProfile != null) ? currentProfile.getCohort() : null;
        String currentCity = (currentProfile != null && currentProfile.getCity() != null) ? currentProfile.getCity().trim() : null;

        List<ConnectionSuggestionResponse> scoredList = new ArrayList<>();

        for (User user : candidateUsers) {
            UserProfile profile = user.getProfile();
            int score = 0;
            String reason = "Cựu sinh viên tiêu biểu";
            PrimaryExperienceResponse primaryExp = expMap.get(user.getId());
            boolean hasExperience = (primaryExp != null && primaryExp.getCompany() != null && !primaryExp.getCompany().trim().isEmpty())
                    || (profile != null && profile.getHeadline() != null && !profile.getHeadline().trim().isEmpty());


            if (currentUser != null && profile != null) {
                boolean hasMajorMatch = false;
                boolean hasCohortMatch = false;
                boolean hasCityMatch = false;

                if (currentMajorId != null && profile.getMajor() != null && currentMajorId.equals(profile.getMajor().getId())) {
                    score += 40;
                    hasMajorMatch = true;
                }
                if (currentCohort != null && profile.getCohort() != null) {
                    int diff = Math.abs(currentCohort - profile.getCohort());
                    if (diff == 0) {
                        score += 30;
                        hasCohortMatch = true;
                    } else if (diff == 1) {
                        score += 15;
                    }
                }
                if (currentCity != null && !currentCity.isEmpty() && profile.getCity() != null && currentCity.equalsIgnoreCase(profile.getCity().trim())) {
                    score += 20;
                    hasCityMatch = true;
                }
                // Ưu tiên cựu sinh viên đã có kinh nghiệm làm việc / chức danh công ty (+20 điểm)
                if (hasExperience) {
                    score += 20;
                }
                if (user.isAccountVerified()) {
                    score += 10;
                }
                long followers = followersCountMap.getOrDefault(user.getId(), 0L);
                score += (int) Math.min(followers, 10);

                if (hasMajorMatch && currentMajorName != null) {
                    reason = "Cùng chuyên ngành " + (profile.getMajor().getCode() != null ? profile.getMajor().getCode() : currentMajorName);
                } else if (hasCohortMatch) {
                    reason = "Cùng niên khóa K" + profile.getCohort();
                } else if (hasCityMatch) {
                    reason = "Đang ở " + profile.getCity();
                } else if (hasExperience && primaryExp != null && primaryExp.getCompany() != null) {
                    reason = primaryExp.getTitle() + " @ " + primaryExp.getCompany();
                } else if (user.isAccountVerified()) {
                    reason = "Tài khoản đã xác minh";
                } else {
                    reason = "Thành viên cộng đồng FPTU";
                }
            } else {
                // Ưu tiên hàng đầu cho Guest: Cựu sinh viên đã có kinh nghiệm làm việc / công ty (+40 điểm)
                if (hasExperience) {
                    score += 40;
                }
                if (user.isAccountVerified()) {
                    score += 30;
                    reason = "Cựu sinh viên tiêu biểu đã xác minh";
                }
                long followers = followersCountMap.getOrDefault(user.getId(), 0L);
                score += (int) Math.min(followers, 20);
            }


            ConnectionSuggestionResponse dto = ConnectionSuggestionResponse.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .role(user.getRole() != null ? user.getRole().getName() : "")
                    .fullName(profile != null ? profile.getFullName() : user.getEmail())
                    .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                    .headline(profile != null ? profile.getHeadline() : null)
                    .major(profile != null && profile.getMajor() != null ? MajorResponse.builder()
                            .id(profile.getMajor().getId())
                            .code(profile.getMajor().getCode())
                            .name(profile.getMajor().getName())
                            .build() : null)
                    .cohort(profile != null ? profile.getCohort() : null)
                    .studentCode(profile != null ? profile.getStudentCode() : null)
                    .city(profile != null ? profile.getCity() : null)
                    .skills(profile != null && profile.getSkills() != null ? profile.getSkills().stream().map(s -> UserSkillResponse.builder()
                            .id(s.getId())
                            .skillName(s.getSkillName())
                            .build()).toList() : Collections.emptyList())
                    .primaryExperience(expMap.get(user.getId()))
                    .followersCount(followersCountMap.getOrDefault(user.getId(), 0L))
                    .followingCount(followingCountMap.getOrDefault(user.getId(), 0L))
                    .isFollowing(false)
                    .isAccountVerified(user.isAccountVerified())
                    .createdAt(user.getCreatedAt())
                    .suggestionReason(reason)
                    .matchScore(score)
                    .build();

            scoredList.add(dto);
        }

        // Sắp xếp giảm dần theo matchScore
        scoredList.sort((a, b) -> Integer.compare(b.getMatchScore(), a.getMatchScore()));

        return scoredList.stream().limit(limit).toList();
    }
}





