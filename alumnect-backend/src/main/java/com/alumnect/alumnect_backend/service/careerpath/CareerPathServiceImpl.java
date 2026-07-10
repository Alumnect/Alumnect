package com.alumnect.alumnect_backend.service.careerpath;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dao.careerpath.CareerPathQueryRepository;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPathDetailResponse;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPathSummaryResponse;
import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPreviewItem;
import com.alumnect.alumnect_backend.dto.response.user.ExperienceResponse;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.careerpath.CareerPathMapper;
import com.alumnect.alumnect_backend.mapper.user.ExperienceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CareerPathServiceImpl implements CareerPathService {

    private final CareerPathQueryRepository careerPathQueryRepository;
    private final UserProfileRepository userProfileRepository;
    private final ExperienceRepository experienceRepository;
    private final CareerPathMapper careerPathMapper;
    private final ExperienceMapper experienceMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CareerPathSummaryResponse> getCareerPaths(
            String search,
            String title,
            String company,
            String location,
            Integer cohort,
            Long majorId,
            int page,
            int size
    ) {
        log.info("Lấy danh sách Career Paths phân trang: page={}, size={}", page, size);
        
        // Giới hạn tối đa kích thước trang là 50
        int pageSize = Math.min(size, 50);
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<Long> userIdPage = careerPathQueryRepository.findActiveAlumniUserIds(
                search, title, company, location, cohort, majorId, pageable
        );

        List<Long> userIds = userIdPage.getContent();
        if (userIds.isEmpty()) {
            return PageResponse.<CareerPathSummaryResponse>builder()
                    .content(Collections.emptyList())
                    .pageNumber(userIdPage.getNumber())
                    .pageSize(userIdPage.getSize())
                    .totalElements(userIdPage.getTotalElements())
                    .totalPages(userIdPage.getTotalPages())
                    .last(userIdPage.isLast())
                    .build();
        }

        // Lấy UserProfiles tương ứng và giữ nguyên thứ tự sắp xếp
        List<UserProfile> profiles = userProfileRepository.findAllById(userIds);
        Map<Long, UserProfile> profileMap = profiles.stream()
                .collect(Collectors.toMap(UserProfile::getUserId, p -> p));
        List<UserProfile> orderedProfiles = userIds.stream()
                .map(profileMap::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        // Batch fetch experiences để tránh N+1
        List<Experience> allExperiences = experienceRepository.findByUserIdsSortedChronologically(userIds);
        Map<Long, List<Experience>> expGrouped = allExperiences.stream()
                .collect(Collectors.groupingBy(e -> e.getUser().getId()));

        List<CareerPathSummaryResponse> summaryList = orderedProfiles.stream().map(profile -> {
            CareerPathSummaryResponse summary = careerPathMapper.toSummary(profile);
            List<Experience> userExps = expGrouped.getOrDefault(profile.getUserId(), Collections.emptyList());

            // Tìm experience primary làm current info
            Optional<Experience> primaryExpOpt = userExps.stream()
                    .filter(Experience::isPrimary)
                    .findFirst();

            if (primaryExpOpt.isPresent()) {
                Experience primaryExp = primaryExpOpt.get();
                summary.setCurrentTitle(primaryExp.getTitle());
                summary.setCurrentCompany(primaryExp.getCompany());
                summary.setCurrentLocation(primaryExp.getLocation());
            } else {
                // Fallback về experience current mới nhất nếu ko có primary
                Optional<Experience> latestCurrentOpt = userExps.stream()
                        .filter(Experience::isCurrent)
                        .max(Comparator.comparing(Experience::getStartDate));
                if (latestCurrentOpt.isPresent()) {
                    Experience latestCurrent = latestCurrentOpt.get();
                    summary.setCurrentTitle(latestCurrent.getTitle());
                    summary.setCurrentCompany(latestCurrent.getCompany());
                    summary.setCurrentLocation(latestCurrent.getLocation());
                }
            }

            summary.setTotalExperiences(userExps.size());

            // Build careerPreview structured list (lấy tối đa 4 bước unique theo trình tự thời gian)
            List<CareerPreviewItem> preview = new ArrayList<>();
            String lastKey = "";
            for (Experience e : userExps) {
                String key = e.getTitle().trim() + "@" + e.getCompany().trim();
                if (!key.equalsIgnoreCase(lastKey)) {
                    preview.add(CareerPreviewItem.builder()
                            .experienceId(e.getId())
                            .title(e.getTitle())
                            .company(e.getCompany())
                            .startDate(e.getStartDate())
                            .endDate(e.getEndDate())
                            .isCurrent(e.isCurrent())
                            .build());
                    lastKey = key;
                }
            }
            if (preview.size() > 4) {
                preview = preview.subList(0, 4);
            }
            summary.setCareerPreview(preview);

            return summary;
        }).collect(Collectors.toList());

        return PageResponse.<CareerPathSummaryResponse>builder()
                .content(summaryList)
                .pageNumber(userIdPage.getNumber())
                .pageSize(userIdPage.getSize())
                .totalElements(userIdPage.getTotalElements())
                .totalPages(userIdPage.getTotalPages())
                .last(userIdPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CareerPathDetailResponse getCareerPathDetail(Long userId) {
        log.info("Lấy chi tiết Career Path cho user ID: {}", userId);
        
        UserProfile profile = userProfileRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ người dùng với ID: " + userId));

        User targetUser = profile.getUser();
        if (targetUser.getAccountStatus() != AccountStatus.ACTIVE || !targetUser.getRole().getName().equals("ALUMNI")) {
            throw new BadRequestException("Người dùng này không hoạt động hoặc không phải là cựu sinh viên");
        }

        List<Experience> experiences = experienceRepository.findByUserIdsSortedChronologically(Collections.singletonList(userId));
        List<ExperienceResponse> experienceResponses = experiences.stream()
                .map(experienceMapper::toResponse)
                .collect(Collectors.toList());

        return CareerPathDetailResponse.builder()
                .userId(userId)
                .fullName(profile.getFullName())
                .avatarUrl(profile.getAvatarUrl())
                .experiences(experienceResponses)
                .build();
    }
}
