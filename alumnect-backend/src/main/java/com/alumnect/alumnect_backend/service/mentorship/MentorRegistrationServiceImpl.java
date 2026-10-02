package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorPayoutAccountRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorTopicRepository;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorRegistrationRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRegistrationResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRegistrationSaveResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTermsStatusResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPayoutAccount;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSupportedField;
import com.alumnect.alumnect_backend.entity.mentorship.MentorTopic;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.user.UserSkill;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Lớp dịch vụ thực thi nghiệp vụ Đăng ký trở thành Mentor (UC91).
 * Tuân thủ nguyên tắc không trùng lặp dữ liệu, cô lập thông tin thanh toán nhạy cảm,
 * bảo vệ tệp CV và hỗ trợ tính năng Lưu nháp (Save Draft).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentorRegistrationServiceImpl implements MentorRegistrationService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ExperienceRepository experienceRepository;
    private final UserSkillRepository userSkillRepository;
    private final IndustryRepository industryRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorSupportedFieldRepository mentorSupportedFieldRepository;
    private final MentorTopicRepository mentorTopicRepository;
    private final MentorPayoutAccountRepository mentorPayoutAccountRepository;
    private final MentoringTermsService mentoringTermsService;

    @Override
    @Transactional(readOnly = true)
    public MentorRegistrationResponse getRegistration(String userEmail) {
        log.info("Lấy thông tin đăng ký Mentor cho tài khoản: {}", userEmail);

        // 1. Xác thực người dùng và kiểm tra vai trò ALUMNI
        User user = validateAndGetAlumniUser(userEmail);

        // 2. Kiểm tra trạng thái chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (UC90)
        MentoringTermsStatusResponse termsStatus = mentoringTermsService.getCurrentTermsStatus(userEmail);
        boolean termsAccepted = termsStatus != null && termsStatus.isAccepted();

        // 3. Tái sử dụng thông tin cá nhân từ UserProfile
        UserProfile userProfile = userProfileRepository.findById(user.getId()).orElse(null);
        MentorRegistrationResponse.PersonalInfo personalInfo = buildPersonalInfo(user, userProfile);

        // 4. Tái sử dụng thông tin nghề nghiệp từ Experience & UserSkill
        Experience currentExp = getCurrentExperience(user.getId());
        List<UserSkill> skills = userSkillRepository.findByUserIdOrderBySortOrderAscSkillNameAsc(user.getId());
        List<String> skillNames = skills.stream().map(UserSkill::getSkillName).collect(Collectors.toList());

        // 5. Lấy hồ sơ Mentor hiện có (nếu đã từng lưu nháp hoặc đăng ký)
        Optional<MentorProfile> mentorProfileOpt = mentorProfileRepository.findByUserId(user.getId());

        boolean hasExistingRegistration = mentorProfileOpt.isPresent();
        MentorProfile profile = mentorProfileOpt.orElse(null);

        // Xây dựng ProfessionalInfo
        MentorRegistrationResponse.ProfessionalInfo professionalInfo = MentorRegistrationResponse.ProfessionalInfo.builder()
                .reusedFromProfile(MentorRegistrationResponse.ReusedFromProfile.builder()
                        .currentPosition(currentExp != null ? currentExp.getTitle() : null)
                        .currentCompany(currentExp != null ? currentExp.getCompany() : null)
                        .skills(skillNames)
                        .build())
                .yearsOfExperience(profile != null ? profile.getYearsOfExperience() : null)
                .bio(profile != null ? profile.getBio() : null)
                .build();

        // Xây dựng MentoringInfo
        List<MentorRegistrationResponse.SupportedIndustryItem> supportedIndustries = new ArrayList<>();
        List<String> topicNames = new ArrayList<>();
        if (profile != null) {
            List<MentorSupportedField> supportedFields = mentorSupportedFieldRepository.findByMentorProfileId(profile.getId());
            supportedIndustries = supportedFields.stream()
                    .map(sf -> MentorRegistrationResponse.SupportedIndustryItem.builder()
                            .id(sf.getIndustry().getId())
                            .name(sf.getIndustry().getName())
                            .build())
                    .collect(Collectors.toList());

            List<MentorTopic> topics = mentorTopicRepository.findByMentorProfileId(profile.getId());
            topicNames = topics.stream().map(MentorTopic::getTopicName).collect(Collectors.toList());
        }

        MentorRegistrationResponse.MentoringInfo mentoringInfo = MentorRegistrationResponse.MentoringInfo.builder()
                .workingMode(profile != null ? profile.getWorkingMode() : null)
                .mentoringType(profile != null ? profile.getMentoringType() : null)
                .supportedIndustries(supportedIndustries)
                .mentoringTopics(topicNames)
                .build();

        // Xây dựng CvInfo (sử dụng trực tiếp đường dẫn CV như các chức năng khác)
        String cvFileKey = profile != null ? profile.getCvFileKey() : null;
        String cvDownloadUrl = cvFileKey;

        MentorRegistrationResponse.CvInfo cvInfo = MentorRegistrationResponse.CvInfo.builder()
                .cvFileKey(cvFileKey)
                .cvDownloadUrl(cvDownloadUrl)
                .build();

        // Xây dựng PayoutAccountInfo (Truy vấn từ bảng mentor_payout_accounts riêng biệt)
        MentorPayoutAccount payoutAccount = profile != null
                ? mentorPayoutAccountRepository.findByMentorProfileId(profile.getId()).orElse(null)
                : null;

        MentorRegistrationResponse.PayoutAccountInfo payoutAccountInfo = MentorRegistrationResponse.PayoutAccountInfo.builder()
                .bankName(payoutAccount != null ? payoutAccount.getBankName() : null)
                .bankAccountNumber(payoutAccount != null ? payoutAccount.getBankAccountNumber() : null)
                .bankAccountHolder(payoutAccount != null ? payoutAccount.getBankAccountHolder() : null)
                .build();

        // 6. Đánh giá tính hoàn tất và danh sách các trường còn thiếu
        List<String> missingFields = evaluateMissingFields(
                currentExp,
                profile != null ? profile.getYearsOfExperience() : null,
                profile != null ? profile.getWorkingMode() : null,
                profile != null ? profile.getMentoringType() : null,
                supportedIndustries,
                cvFileKey,
                payoutAccount,
                termsAccepted
        );

        boolean isComplete = missingFields.isEmpty();
        MentorStatus mentorStatus = profile != null ? profile.getMentorStatus() : MentorStatus.INCOMPLETE;

        return MentorRegistrationResponse.builder()
                .hasExistingRegistration(hasExistingRegistration)
                .mentorStatus(mentorStatus)
                .isComplete(isComplete)
                .personalInfo(personalInfo)
                .professionalInfo(professionalInfo)
                .mentoringInfo(mentoringInfo)
                .cvInfo(cvInfo)
                .payoutAccount(payoutAccountInfo)
                .termsAccepted(termsAccepted)
                .missingFields(missingFields)
                .build();
    }

    @Override
    @Transactional
    public MentorRegistrationSaveResponse saveRegistration(String userEmail, MentorRegistrationRequest request) {
        log.info("Lưu thông tin đăng ký Mentor cho tài khoản: {}", userEmail);

        // 1. Xác thực người dùng và kiểm tra vai trò ALUMNI
        User user = validateAndGetAlumniUser(userEmail);

        // 2. Kiểm tra điều kiện tiên quyết: Chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (UC90)
        MentoringTermsStatusResponse termsStatus = mentoringTermsService.getCurrentTermsStatus(userEmail);
        boolean termsAccepted = termsStatus != null && termsStatus.isAccepted();
        if (!termsAccepted) {
            log.warn("Tài khoản {} chưa chấp nhận Điều khoản Hướng dẫn & Hỗ trợ (UC90)", userEmail);
            throw new ForbiddenException("Bạn cần chấp nhận Điều khoản Hướng dẫn & Hỗ trợ trước khi đăng ký");
        }

        // 2b. Cập nhật thông tin cá nhân cơ bản vào UserProfile nếu người dùng chỉnh sửa tại Section 1
        UserProfile userProfile = userProfileRepository.findById(user.getId()).orElse(null);
        if (userProfile != null) {
            boolean userProfileUpdated = false;
            if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
                userProfile.setFullName(request.getFullName().trim());
                userProfileUpdated = true;
            }
            if (request.getPhone() != null) {
                userProfile.setPhone(request.getPhone().trim());
                userProfileUpdated = true;
            }
            if (request.getCampus() != null && !request.getCampus().trim().isEmpty()) {
                userProfile.setCampus(request.getCampus().trim());
                userProfileUpdated = true;
            }
            if (request.getGraduationYear() != null) {
                userProfile.setGraduationYear(request.getGraduationYear());
                userProfileUpdated = true;
            }
            if (userProfileUpdated) {
                userProfileRepository.save(userProfile);
            }
        }

        // 3. Tìm hoặc khởi tạo mới MentorProfile (1-1 với User)
        MentorProfile profile = mentorProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> MentorProfile.builder()
                        .user(user)
                        .mentorStatus(MentorStatus.INCOMPLETE)
                        .build());

        // Cập nhật các trường đặc thù của MentorProfile
        if (request.getYearsOfExperience() != null) {
            profile.setYearsOfExperience(request.getYearsOfExperience());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio().trim());
        }
        if (request.getWorkingMode() != null) {
            profile.setWorkingMode(request.getWorkingMode());
        }
        if (request.getMentoringType() != null) {
            profile.setMentoringType(request.getMentoringType());
        }
        if (request.getCvFileKey() != null && !request.getCvFileKey().trim().isEmpty()) {
            profile.setCvFileKey(request.getCvFileKey().trim());
        }

        // Lưu trước để đảm bảo profile có ID
        profile = mentorProfileRepository.save(profile);
        final MentorProfile savedProfile = profile;

        // 4. Đồng bộ danh mục ngành nghề hỗ trợ (mentor_supported_fields FK -> industries.id)
        if (request.getSupportedIndustryIds() != null) {
            mentorSupportedFieldRepository.deleteByMentorProfileId(savedProfile.getId());
            mentorSupportedFieldRepository.flush(); // Bắt buộc flush DELETE SQL xuống PostgreSQL trước khi chèn danh sách mới
            List<Long> distinctIndustryIds = request.getSupportedIndustryIds().stream()
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            if (!distinctIndustryIds.isEmpty()) {
                List<Industry> industries = industryRepository.findAllById(distinctIndustryIds);
                List<MentorSupportedField> supportedFields = industries.stream()
                        .map(ind -> MentorSupportedField.builder()
                                .mentorProfile(savedProfile)
                                .industry(ind)
                                .build())
                        .collect(Collectors.toList());
                mentorSupportedFieldRepository.saveAll(supportedFields);
                mentorSupportedFieldRepository.flush();
            }
        }

        // 5. Đồng bộ danh sách chủ đề cố vấn chuyên sâu tự do (mentor_topics)
        if (request.getMentoringTopics() != null) {
            mentorTopicRepository.deleteByMentorProfileId(savedProfile.getId());
            mentorTopicRepository.flush(); // Bắt buộc flush DELETE SQL xuống PostgreSQL trước khi chèn danh sách mới
            List<MentorTopic> topics = request.getMentoringTopics().stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(t -> !t.isEmpty())
                    .distinct()
                    .map(t -> MentorTopic.builder()
                            .mentorProfile(savedProfile)
                            .topicName(t)
                            .build())
                    .collect(Collectors.toList());
            if (!topics.isEmpty()) {
                mentorTopicRepository.saveAll(topics);
                mentorTopicRepository.flush();
            }
        }

        // 6. Cập nhật thông tin tài khoản ngân hàng chi trả (mentor_payout_accounts Private 1-1)
        MentorPayoutAccount payoutAccount = mentorPayoutAccountRepository.findByMentorProfileId(savedProfile.getId())
                .orElseGet(() -> MentorPayoutAccount.builder()
                        .mentorProfile(savedProfile)
                        .mentorProfileId(savedProfile.getId())
                        .isNew(true)
                        .build());

        boolean hasBankInput = false;
        if (request.getBankName() != null && !request.getBankName().trim().isEmpty()) {
            payoutAccount.setBankName(request.getBankName().trim());
            hasBankInput = true;
        }
        if (request.getBankAccountNumber() != null && !request.getBankAccountNumber().trim().isEmpty()) {
            payoutAccount.setBankAccountNumber(request.getBankAccountNumber().trim());
            hasBankInput = true;
        }
        if (request.getBankAccountHolder() != null && !request.getBankAccountHolder().trim().isEmpty()) {
            payoutAccount.setBankAccountHolder(request.getBankAccountHolder().trim().toUpperCase());
            hasBankInput = true;
        }

        if (hasBankInput) {
            payoutAccount = mentorPayoutAccountRepository.save(payoutAccount);
        }

        // 7. Kiểm tra điều kiện hoàn tất hồ sơ đăng ký (Mentor Registration Completion Rules)
        Experience currentExp = getCurrentExperience(user.getId());
        List<MentorSupportedField> currentSupportedFields = mentorSupportedFieldRepository.findByMentorProfileId(profile.getId());
        List<MentorRegistrationResponse.SupportedIndustryItem> supportedItems = currentSupportedFields.stream()
                .map(sf -> MentorRegistrationResponse.SupportedIndustryItem.builder()
                        .id(sf.getIndustry().getId())
                        .name(sf.getIndustry().getName())
                        .build())
                .collect(Collectors.toList());

        List<String> missingFields = evaluateMissingFields(
                currentExp,
                profile.getYearsOfExperience(),
                profile.getWorkingMode(),
                profile.getMentoringType(),
                supportedItems,
                profile.getCvFileKey(),
                payoutAccount,
                termsAccepted
        );

        boolean isComplete = missingFields.isEmpty();

        // 8. Chuyển đổi trạng thái nghiệp vụ
        String nextStep;
        if (isComplete) {
            // Khi thỏa mãn 100% điều kiện, chuyển sang PAYMENT_PENDING để thanh toán gói tại UC92 & UC93
            profile.setMentorStatus(MentorStatus.PAYMENT_PENDING);
            nextStep = "UC92_SELECT_PACKAGE";
            log.info("Hồ sơ Mentor của Alumni {} đã hoàn tất đầy đủ. Chuyển sang PAYMENT_PENDING.", userEmail);
        } else {
            // Nếu chưa đủ thông tin hoặc lưu nháp, giữ nguyên INCOMPLETE (nếu chưa từng ACTIVE)
            if (profile.getMentorStatus() != MentorStatus.ACTIVE && profile.getMentorStatus() != MentorStatus.EXPIRED) {
                profile.setMentorStatus(MentorStatus.INCOMPLETE);
            }
            nextStep = "STAY_IN_DRAFT";
            log.info("Hồ sơ Mentor của Alumni {} lưu nháp thành công. Còn thiếu: {}", userEmail, missingFields);
        }

        profile = mentorProfileRepository.save(profile);

        return MentorRegistrationSaveResponse.builder()
                .mentorProfileId(profile.getId())
                .mentorStatus(profile.getMentorStatus())
                .isComplete(isComplete)
                .nextStep(nextStep)
                .missingFields(missingFields)
                .build();
    }

    /**
     * Xác thực người dùng và kiểm tra bắt buộc vai trò ALUMNI.
     */
    private User validateAndGetAlumniUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với email: " + userEmail));

        if (user.getRole() == null || !"ALUMNI".equalsIgnoreCase(user.getRole().getName())) {
            log.warn("Người dùng {} có vai trò {} bị từ chối truy cập đăng ký Mentor", userEmail,
                    user.getRole() != null ? user.getRole().getName() : "NULL");
            throw new ForbiddenException("Chức năng chỉ dành cho Cựu sinh viên (ALUMNI)");
        }

        return user;
    }

    /**
     * Trích xuất kinh nghiệm làm việc hiện tại của người dùng từ bảng experiences.
     */
    private Experience getCurrentExperience(Long userId) {
        List<Experience> currentExps = experienceRepository.findByUserIdAndIsCurrentTrue(userId);
        if (!currentExps.isEmpty()) {
            return currentExps.get(0);
        }
        Optional<Experience> primaryExp = experienceRepository.findByUserIdAndIsPrimaryTrue(userId);
        if (primaryExp.isPresent()) {
            return primaryExp.get();
        }
        List<Experience> allExps = experienceRepository.findByUserIdOrderByStartDateDesc(userId);
        return allExps.isEmpty() ? null : allExps.get(0);
    }

    /**
     * Xây dựng DTO thông tin cá nhân cơ bản từ UserProfile và User.
     */
    private MentorRegistrationResponse.PersonalInfo buildPersonalInfo(User user, UserProfile profile) {
        return MentorRegistrationResponse.PersonalInfo.builder()
                .fullName(profile != null ? profile.getFullName() : null)
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .email(user.getEmail())
                .phone(profile != null ? profile.getPhone() : null)
                .campus(profile != null ? profile.getCampus() : null)
                .majorName(profile != null && profile.getMajor() != null ? profile.getMajor().getName() : null)
                .graduationYear(profile != null ? profile.getGraduationYear() : null)
                .studentCode(profile != null ? profile.getStudentCode() : null)
                .build();
    }

    /**
     * Đánh giá 8 điều kiện hoàn tất hồ sơ đăng ký Mentor.
     * Trả về danh sách các trường/yêu cầu còn thiếu.
     */
    private List<String> evaluateMissingFields(
            Experience currentExp,
            Integer yearsOfExperience,
            Object workingMode,
            Object mentoringType,
            List<MentorRegistrationResponse.SupportedIndustryItem> supportedIndustries,
            String cvFileKey,
            MentorPayoutAccount payoutAccount,
            boolean termsAccepted
    ) {
        List<String> missing = new ArrayList<>();

        if (!termsAccepted) {
            missing.add("termsAccepted");
        }
        if (currentExp == null || currentExp.getTitle() == null || currentExp.getTitle().trim().isEmpty()) {
            missing.add("currentPosition");
        }
        if (yearsOfExperience == null || yearsOfExperience < 0) {
            missing.add("yearsOfExperience");
        }
        if (workingMode == null) {
            missing.add("workingMode");
        }
        if (mentoringType == null) {
            missing.add("mentoringType");
        }
        if (supportedIndustries == null || supportedIndustries.isEmpty()) {
            missing.add("supportedIndustries");
        }
        if (cvFileKey == null || cvFileKey.trim().isEmpty()) {
            missing.add("cvFileKey");
        }
        if (payoutAccount == null ||
                payoutAccount.getBankName() == null || payoutAccount.getBankName().trim().isEmpty() ||
                payoutAccount.getBankAccountNumber() == null || payoutAccount.getBankAccountNumber().trim().isEmpty() ||
                payoutAccount.getBankAccountHolder() == null || payoutAccount.getBankAccountHolder().trim().isEmpty()) {
            missing.add("payoutAccount");
        }

        return missing;
    }

    /**
     * Kiểm tra tính hoàn thiện 100% của hồ sơ Mentor (tái sử dụng từ UC91).
     * Dùng chung cho UC92, UC93, UC94 nhằm tránh duplicate logic thẩm định hồ sơ.
     *
     * @param userEmail Email của người dùng đã xác thực
     * @return true nếu hồ sơ đã điền đầy đủ và thỏa mãn mọi ràng buộc UC91
     */
    @Override
    @Transactional(readOnly = true)
    public boolean isMentorProfileComplete(String userEmail) {
        MentorRegistrationResponse response = getRegistration(userEmail);
        return response != null && response.isComplete();
    }
}

