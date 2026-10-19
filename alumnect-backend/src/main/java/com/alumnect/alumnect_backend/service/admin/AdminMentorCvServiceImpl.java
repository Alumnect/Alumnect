package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPayoutAccountRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorTopicRepository;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dto.response.admin.AdminMentorCvResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPayoutAccount;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSupportedField;
import com.alumnect.alumnect_backend.entity.mentorship.MentorTopic;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Lớp thực thi nghiệp vụ Quản trị viên xem CV & Chi tiết Mentor (UC96).
 * Đảm bảo chỉ kiểm tra và trả về thông tin CV chuyên môn mà không làm thay đổi trạng thái Mentor.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminMentorCvServiceImpl implements AdminMentorCvService {

    private final MentorProfileRepository mentorProfileRepository;
    private final UserProfileRepository userProfileRepository;
    private final ExperienceRepository experienceRepository;
    private final MentorSupportedFieldRepository mentorSupportedFieldRepository;
    private final MentorTopicRepository mentorTopicRepository;
    private final MentorPayoutAccountRepository mentorPayoutAccountRepository;
    private final MentorSubscriptionRepository mentorSubscriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminMentorCvResponse getMentorCv(Long mentorProfileId) {
        log.info("Quản trị viên truy vấn CV của Mentor có Profile ID: {}", mentorProfileId);

        // 1. Tìm hồ sơ Mentor theo Profile ID hoặc User ID
        MentorProfile profile = mentorProfileRepository.findById(mentorProfileId)
                .orElseGet(() -> mentorProfileRepository.findByUserId(mentorProfileId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ Mentor với ID: " + mentorProfileId)));

        // 2. Kiểm tra sự tồn tại của tệp CV
        if (profile.getCvFileKey() == null || profile.getCvFileKey().trim().isEmpty()) {
            log.warn("Mentor ID {} chưa có tệp CV được tải lên", mentorProfileId);
            throw new ResourceNotFoundException("Mentor này chưa cập nhật tệp CV lên hệ thống");
        }

        // 3. Chuyển đổi thông tin sang DTO phản hồi
        return mapToAdminMentorCvResponse(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminMentorCvResponse getMentorDetail(Long mentorProfileId) {
        log.info("Quản trị viên xem thông tin quản lý của Mentor có Profile ID: {}", mentorProfileId);

        // Tìm hồ sơ Mentor theo Profile ID hoặc User ID
        MentorProfile profile = mentorProfileRepository.findById(mentorProfileId)
                .orElseGet(() -> mentorProfileRepository.findByUserId(mentorProfileId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ Mentor với ID: " + mentorProfileId)));

        return mapToAdminMentorCvResponse(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminMentorCvResponse> getMentorList(String keyword, MentorStatus status, String subscriptionStatus, Pageable pageable) {
        log.info("Quản trị viên lấy danh sách Mentor với keyword='{}', status={}, subscriptionStatus={}", keyword, status, subscriptionStatus);

        Specification<MentorProfile> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Lọc theo trạng thái hồ sơ Mentor
            if (status != null) {
                predicates.add(cb.equal(root.get("mentorStatus"), status));
            }

            // 2. Lọc theo từ khóa tìm kiếm (tên, email, vị trí hoặc công ty)
            if (keyword != null && !keyword.trim().isEmpty()) {
                String kw = "%" + keyword.trim().toLowerCase() + "%";
                Join<MentorProfile, User> userJoin = root.join("user", JoinType.INNER);
                Join<User, UserProfile> profileJoin = userJoin.join("profile", JoinType.LEFT);

                Expression<String> emailExpr = cb.lower(userJoin.get("email"));
                Expression<String> nameExpr = cb.lower(profileJoin.get("fullName"));

                // Subquery tìm kiếm trong kinh nghiệm làm việc (Experiences: vị trí hoặc công ty)
                Subquery<Long> expSub = query.subquery(Long.class);
                Root<Experience> expRoot = expSub.from(Experience.class);
                expSub.select(expRoot.get("id"));
                expSub.where(
                        cb.equal(expRoot.get("user").get("id"), userJoin.get("id")),
                        cb.or(
                                cb.like(cb.lower(expRoot.get("company")), kw),
                                cb.like(cb.lower(expRoot.get("title")), kw)
                        )
                );

                predicates.add(cb.or(
                        cb.like(emailExpr, kw),
                        cb.like(nameExpr, kw),
                        cb.exists(expSub)
                ));
            }

            // 3. Lọc theo trạng thái gói dịch vụ
            if (subscriptionStatus != null && !subscriptionStatus.trim().isEmpty()) {
                try {
                    MentorSubscriptionStatus subStatusEnum = MentorSubscriptionStatus.valueOf(subscriptionStatus.trim().toUpperCase());
                    Subquery<Long> subSub = query.subquery(Long.class);
                    Root<MentorSubscription> subRoot = subSub.from(MentorSubscription.class);
                    subSub.select(subRoot.get("id"));
                    subSub.where(
                            cb.equal(subRoot.get("mentorProfile").get("id"), root.get("id")),
                            cb.equal(subRoot.get("status"), subStatusEnum)
                    );
                    predicates.add(cb.exists(subSub));
                } catch (IllegalArgumentException ignored) {
                    // Bỏ qua giá trị enum không hợp lệ
                }
            }

            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<MentorProfile> page = mentorProfileRepository.findAll(spec, pageable);
        List<AdminMentorCvResponse> responses = page.getContent().stream()
                .map(this::mapToAdminMentorCvResponse)
                .collect(Collectors.toList());

        return PageResponse.<AdminMentorCvResponse>builder()
                .content(responses)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /**
     * Map đối tượng MentorProfile sang AdminMentorCvResponse DTO.
     */
    private AdminMentorCvResponse mapToAdminMentorCvResponse(MentorProfile profile) {
        User user = profile.getUser();
        UserProfile userProfile = user != null ? userProfileRepository.findById(user.getId()).orElse(null) : null;

        // Lấy thông tin kinh nghiệm hiện tại
        Experience currentExp = null;
        if (user != null) {
            List<Experience> exps = experienceRepository.findByUserIdAndIsCurrentTrue(user.getId());
            if (!exps.isEmpty()) {
                currentExp = exps.get(0);
            } else {
                Optional<Experience> primary = experienceRepository.findByUserIdAndIsPrimaryTrue(user.getId());
                currentExp = primary.orElse(null);
            }
        }

        // Lấy danh sách lĩnh vực hỗ trợ
        List<MentorSupportedField> supportedFields = mentorSupportedFieldRepository.findByMentorProfileId(profile.getId());
        List<String> fieldNames = supportedFields != null
                ? supportedFields.stream().map(sf -> sf.getIndustry().getName()).collect(Collectors.toList())
                : Collections.emptyList();

        // Lấy danh sách chủ đề cố vấn chuyên sâu
        List<MentorTopic> topics = mentorTopicRepository.findByMentorProfileId(profile.getId());
        List<String> topicNames = topics != null
                ? topics.stream().map(MentorTopic::getTopicName).collect(Collectors.toList())
                : Collections.emptyList();

        // Lấy thông tin tài khoản ngân hàng chi trả
        MentorPayoutAccount payoutAccount = mentorPayoutAccountRepository.findByMentorProfileId(profile.getId()).orElse(null);

        // Lấy thông tin gói Mentor đã đăng ký (ưu tiên gói ACTIVE/PAID còn hạn, nếu không lấy gói mới nhất)
        List<MentorSubscription> subscriptions = mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(profile.getId());
        Instant now = Instant.now();
        MentorSubscription activeSub = subscriptions.stream()
                .filter(s -> (s.getStatus() == MentorSubscriptionStatus.ACTIVE || s.getStatus() == MentorSubscriptionStatus.PAID)
                        && s.getEndDate() != null && s.getEndDate().isAfter(now))
                .findFirst()
                .orElse(subscriptions.isEmpty() ? null : subscriptions.get(0));

        String packageName = null;
        String subscriptionStatus = null;
        Instant startDate = null;
        Instant endDate = null;

        if (activeSub != null) {
            packageName = activeSub.getMentorPackage() != null ? activeSub.getMentorPackage().getName() : null;
            subscriptionStatus = activeSub.getStatus() != null ? activeSub.getStatus().name() : null;
            startDate = activeSub.getStartDate();
            endDate = activeSub.getEndDate();
        }

        String cvKey = profile.getCvFileKey();

        return AdminMentorCvResponse.builder()
                .mentorProfileId(profile.getId())
                .userId(user != null ? user.getId() : null)
                .mentorName(userProfile != null ? userProfile.getFullName() : (user != null ? user.getEmail() : "N/A"))
                .mentorEmail(user != null ? user.getEmail() : null)
                .avatarUrl(userProfile != null ? userProfile.getAvatarUrl() : null)
                .currentPosition(currentExp != null ? currentExp.getTitle() : null)
                .currentCompany(currentExp != null ? currentExp.getCompany() : null)
                .bio(profile.getBio())
                .cvFileKey(cvKey)
                .cvUrl(cvKey) // Đường dẫn xem/tải CV trực tiếp
                .mentorStatus(profile.getMentorStatus())
                .workingMode(profile.getWorkingMode() != null ? profile.getWorkingMode().name() : null)
                .mentoringType(profile.getMentoringType() != null ? profile.getMentoringType().name() : null)
                .supportedFields(fieldNames)
                .topics(topicNames)
                .bankName(payoutAccount != null ? payoutAccount.getBankName() : null)
                .bankAccountNumber(payoutAccount != null ? payoutAccount.getBankAccountNumber() : null)
                .bankAccountHolder(payoutAccount != null ? payoutAccount.getBankAccountHolder() : null)
                .packageName(packageName)
                .subscriptionStatus(subscriptionStatus)
                .subscriptionStartDate(startDate)
                .subscriptionEndDate(endDate)
                .updatedAt(profile.getUpdatedAt())
                .reputationScore(profile.getReputationScore())
                .completedTasks(profile.getCompletedTasks())
                .rating(profile.getRating())
                .reviewCount(profile.getReviewCount())
                .build();
    }
}
