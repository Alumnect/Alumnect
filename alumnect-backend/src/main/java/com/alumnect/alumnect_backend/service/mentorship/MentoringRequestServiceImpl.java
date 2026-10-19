package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestType;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.config.MentoringProperties;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestAttachmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestDistributionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringTaskRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringGroupRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringGroupMemberRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestMemberRepository;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.dao.mentorship.UserTermsAcceptanceRepository;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentoringAttachmentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.CreateMentoringRequestResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringAttachmentResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestAttachment;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestDistribution;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringGroup;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.alumnect.alumnect_backend.dto.response.mentorship.MentorResponseItemResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringRequestDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringResponseSummaryResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringGroupMemberResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringGroupStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringGroupMemberStatus;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringGroupMember;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestMember;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Lớp triển khai dịch vụ nghiệp vụ cho Mentoring Request (UC100 - Yêu cầu chung & UC101 - Yêu cầu trực tiếp).
 * Quản lý xác thực sinh viên, kiểm tra điều khoản UC90, kiểm tra tính khả dụng của Mentor,
 * lưu trữ yêu cầu và điều phối matching nội bộ hoặc gửi trực tiếp tới Mentor đích.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringRequestServiceImpl implements MentoringRequestService {

    /** Giới hạn kích thước tệp đính kèm: 10 MB = 10 * 1024 * 1024 bytes */
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024L * 1024L;

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final IndustryRepository industryRepository;
    private final UserTermsAcceptanceRepository userTermsAcceptanceRepository;
    private final MentoringRequestRepository mentoringRequestRepository;
    private final MentoringRequestAttachmentRepository mentoringRequestAttachmentRepository;
    private final MentoringRequestDistributionRepository mentoringRequestDistributionRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final MentorSubscriptionRepository mentorSubscriptionRepository;
    private final MentorSupportedFieldRepository mentorSupportedFieldRepository;
    private final MentorMatchingService mentorMatchingService;
    private final MentoringProperties mentoringProperties;
    private final MentoringConversationService mentoringConversationService;
    private final MentoringTaskRepository mentoringTaskRepository;
    private final MentoringGroupService mentoringGroupService;
    private final MentoringGroupRepository mentoringGroupRepository;
    private final MentoringGroupMemberRepository mentoringGroupMemberRepository;
    private final MentoringRequestMemberRepository mentoringRequestMemberRepository;
    private final MentoringRules mentoringRules;
    private final MentoringRequestLifecycleService requestLifecycleService;
    private final MentorReputationService mentorReputationService;
    private final com.alumnect.alumnect_backend.service.notification.NotificationService notificationService;

    /**
     * Tạo mới một yêu cầu Mentoring (Hỗ trợ cả UC100 General Request và UC101 Direct Request).
     * Quy trình xử lý chi tiết:
     * 1. Xác thực sinh viên từ email trong Security Context.
     * 2. Kiểm tra vai trò tài khoản: STUDENT, ALUMNI hoặc ADMIN.
     * 3. Kiểm tra trạng thái tài khoản người tạo: Bắt buộc là ACTIVE.
     * 4. Kiểm tra chấp nhận điều khoản Mentoring (UC90 / BR-02).
     * 5. Kiểm tra ngành nghề/lĩnh vực tồn tại trong cơ sở dữ liệu.
     * 6. Kiểm tra tính hợp lệ của khoảng ngân sách: budgetMax >= budgetMin >= 0.
     * 7. Kiểm tra thời hạn mong muốn: Phải ở trong tương lai (nếu có).
     * 8. Kiểm tra và validate danh sách file đính kèm: <= 5 files, < 10 MB mỗi file.
     * 9. Phân nhánh xử lý:
     *    - Nếu request.getMentorId() == null: Yêu cầu chung (UC100).
     *      * Kích hoạt Internal Matching tìm kiếm Mentor ACTIVE có Supported Field tương thích.
     *      * Phân phối yêu cầu tới các Mentor phù hợp.
     *      * Nếu không tìm thấy Mentor: Request vẫn lưu bền vững với status = OPEN.
     *    - Nếu request.getMentorId() != null: Yêu cầu trực tiếp (UC101).
     *      * Kiểm tra Mentor tồn tại trong hệ thống.
     *      * Kiểm tra chống tự gửi yêu cầu cho chính mình (Self-request prevention).
     *      * Kiểm tra Mentor profile có mentorStatus = ACTIVE.
     *      * Kiểm tra User account của Mentor có accountStatus = ACTIVE.
     *      * Kiểm tra Subscription của Mentor còn hiệu lực (ACTIVE / PAID, endDate > now).
     *      * Kiểm tra Supported Field: Lĩnh vực được chọn BẮT BUỘC nằm trong Supported Fields của Mentor.
     *      * TUYỆT ĐỐI KHÔNG CHẠY AUTO-MATCHING! Gán trực tiếp targetMentor, tạo 1 bản ghi distribution PENDING.
     * 10. Đóng gói kết quả và trả về cho Client.
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param request DTO chứa thông tin tạo yêu cầu
     * @return DTO kết quả tạo yêu cầu
     */
    @Override
    @Transactional
    public CreateMentoringRequestResponse createMentoringRequest(String userEmail, CreateMentoringRequestRequest request) {
        boolean isDirectRequest = request.getMentorId() != null;
        log.info("Bắt đầu xử lý tạo yêu cầu Mentoring (loại: {}) cho user: {}",
                isDirectRequest ? "DIRECT (UC101, mentorId=" + request.getMentorId() + ")" : "GENERAL (UC100)",
                userEmail);

        // 1. Xác thực tài khoản sinh viên
        User student = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + userEmail));

        if (request.getClientRequestKey() != null && !request.getClientRequestKey().isBlank()) {
            var existing = mentoringRequestRepository.findByStudentIdAndClientRequestKey(
                    student.getId(), request.getClientRequestKey().trim());
            if (existing.isPresent()) return mapToResponseWithSummary(existing.get(),
                    mentoringRequestDistributionRepository.findByRequestIdOrderByDistributedAtAsc(existing.get().getId()));
        }
        List<Long> groupMemberIds = request.getMemberIds() == null ? List.of() : request.getMemberIds();
        if (request.getParticipationType() == MentoringType.GROUP && request.getGroupId() == null && groupMemberIds.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn nhóm Mentoring để tạo yêu cầu nhóm");
        }
        if (request.getParticipationType() != MentoringType.GROUP && (request.getGroupId() != null || !groupMemberIds.isEmpty())) {
            throw new BadRequestException("Thông tin nhóm chỉ áp dụng khi chọn hình thức Nhóm");
        }

        // 2. Kiểm tra vai trò: Sinh viên (STUDENT), Cựu sinh viên / Mentor (ALUMNI) đều có quyền tạo yêu cầu Mentoring
        String roleName = student.getRole() != null ? student.getRole().getName() : "";
        if (!"STUDENT".equalsIgnoreCase(roleName) && !"ALUMNI".equalsIgnoreCase(roleName) && !"ADMIN".equalsIgnoreCase(roleName)) {
            log.warn("Người dùng ID={} với vai trò '{}' bị từ chối tạo Mentoring Request", student.getId(), roleName);
            throw new ForbiddenException("Tài khoản của bạn không có quyền tạo yêu cầu Mentoring");
        }

        // 3. Kiểm tra trạng thái tài khoản
        if (student.getAccountStatus() != AccountStatus.ACTIVE) {
            log.warn("Tài khoản sinh viên ID={} không ở trạng thái ACTIVE (hiện tại: {})", student.getId(), student.getAccountStatus());
            throw new ForbiddenException("Tài khoản của bạn đang bị khóa hoặc chưa được kích hoạt để sử dụng tính năng này");
        }

        // 4. Kiểm tra điều khoản Mentoring (UC90 / BR-02)
        String currentVersion = mentoringProperties.getVersion();
        boolean acceptedTerms = userTermsAcceptanceRepository
                .findByUserIdAndTermsVersion(student.getId(), currentVersion)
                .isPresent();

        if (!acceptedTerms) {
            log.warn("Sinh viên ID={} chưa chấp nhận điều khoản Mentoring phiên bản {}", student.getId(), currentVersion);
            throw new BadRequestException("Bạn cần đọc và chấp nhận Điều khoản Hướng dẫn & Hỗ trợ trước khi tạo yêu cầu");
        }

        // 5. Kiểm tra ngành nghề / lĩnh vực cần hỗ trợ
        Industry industry = industryRepository.findById(request.getIndustryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lĩnh vực chuyên môn với ID: " + request.getIndustryId()));

        // 6. Kiểm tra khoảng ngân sách (Budget Range)
        if (request.getBudgetMin() != null && request.getBudgetMax() != null) {
            if (request.getBudgetMax().compareTo(request.getBudgetMin()) < 0) {
                log.warn("Ngân sách không hợp lệ: min={}, max={}", request.getBudgetMin(), request.getBudgetMax());
                throw new BadRequestException("Ngân sách tối đa không được nhỏ hơn ngân sách tối thiểu");
            }
        }

        if (request.getBudgetMin() != null) mentoringRules.requireWholeVnd(request.getBudgetMin(), "Ngân sách tối thiểu");
        if (request.getBudgetMax() != null) mentoringRules.requireWholeVnd(request.getBudgetMax(), "Ngân sách tối đa");

        // 7. Kiểm tra thời hạn mong muốn (Expected Deadline)
        if (request.getExpectedDeadline() != null && request.getExpectedDeadline().isBefore(Instant.now())) {
            log.warn("Thời hạn mong muốn ở trong quá khứ: {}", request.getExpectedDeadline());
            throw new BadRequestException("Thời hạn mong muốn phải ở trong tương lai");
        }

        // 8. Kiểm tra các tệp đính kèm (Attachments)
        List<MentoringAttachmentRequest> attachmentRequests = request.getAttachments();
        if (attachmentRequests != null && !attachmentRequests.isEmpty()) {
            if (attachmentRequests.size() > 5) {
                throw new BadRequestException("Chỉ được đính kèm tối đa 5 tệp tin");
            }

            for (MentoringAttachmentRequest att : attachmentRequests) {
                if (att.getFileSize() == null || att.getFileSize() <= 0) {
                    throw new BadRequestException("Kích thước tệp tin không hợp lệ");
                }
                if (att.getFileSize() >= MAX_FILE_SIZE_BYTES) {
                    log.warn("Tệp tin '{}' vượt quá giới hạn 10 MB (size: {} bytes)", att.getFileName(), att.getFileSize());
                    throw new BadRequestException("Kích thước tệp tin '" + att.getFileName() + "' phải nhỏ hơn 10 MB");
                }
            }
        }

        // 9. Xác thực đặc thù cho UC101 (Direct Request)
        MentorProfile targetMentor = null;
        if (isDirectRequest) {
            Long mentorIdentifier = request.getMentorId();

            // 9.1 Tra cứu hồ sơ Mentor theo mentor_profiles.id hoặc users.id
            targetMentor = mentorProfileRepository.findById(mentorIdentifier)
                    .or(() -> mentorProfileRepository.findByUserId(mentorIdentifier))
                    .orElseThrow(() -> {
                        log.warn("Không tìm thấy hồ sơ Mentor với định danh: {}", mentorIdentifier);
                        return new ResourceNotFoundException("Không tìm thấy thông tin Mentor với định danh: " + mentorIdentifier);
                    });

            // 9.2 Chống tự gửi yêu cầu cho chính mình (Self-request prevention)
            if (targetMentor.getUser() != null && targetMentor.getUser().getId().equals(student.getId())) {
                log.warn("Sinh viên ID={} cố tình gửi yêu cầu cố vấn cho chính mình (mentorProfileId={})", student.getId(), targetMentor.getId());
                throw new BadRequestException("Bạn không thể tự gửi yêu cầu cố vấn cho chính bản thân mình");
            }

            // 9.3 Kiểm tra trạng thái hồ sơ Mentor: Bắt buộc phải là ACTIVE
            if (targetMentor.getMentorStatus() != MentorStatus.ACTIVE) {
                log.warn("Mentor profileId={} không ở trạng thái ACTIVE (hiện tại: {})", targetMentor.getId(), targetMentor.getMentorStatus());
                throw new BadRequestException("Mentor hiện không trong trạng thái hoạt động để tiếp nhận yêu cầu cố vấn mới");
            }

            // 9.4 Kiểm tra trạng thái tài khoản User của Mentor: Bắt buộc phải là ACTIVE
            User mentorUser = targetMentor.getUser();
            if (mentorUser == null || mentorUser.getAccountStatus() != AccountStatus.ACTIVE) {
                log.warn("Tài khoản User của Mentor profileId={} không ACTIVE", targetMentor.getId());
                throw new BadRequestException("Tài khoản của Mentor hiện không trong trạng thái hoạt động");
            }

            // 9.5 Kiểm tra tính hợp lệ của gói dịch vụ Mentor (Subscription): Phải còn hạn sử dụng
            Instant now = Instant.now();
            List<MentorSubscription> subscriptions = mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(targetMentor.getId());
            boolean hasActiveSubscription = subscriptions.stream()
                    .anyMatch(sub -> (sub.getStatus() == MentorSubscriptionStatus.ACTIVE || sub.getStatus() == MentorSubscriptionStatus.PAID)
                            && sub.getEndDate() != null
                            && sub.getEndDate().isAfter(now));

            if (!hasActiveSubscription) {
                log.warn("Gói dịch vụ của Mentor profileId={} đã hết hạn hoặc chưa kích hoạt", targetMentor.getId());
                throw new BadRequestException("Gói hoạt động của Mentor đã hết hạn hoặc chưa được kích hoạt, tạm thời không thể tiếp nhận yêu cầu mới");
            }

            // 9.6 Kiểm tra Supported Field: Lĩnh vực được chọn BẮT BUỘC nằm trong Supported Fields của Mentor
            boolean supportsField = mentorSupportedFieldRepository.existsByMentorProfileIdAndIndustryId(targetMentor.getId(), industry.getId());
            if (!supportsField) {
                log.warn("Mentor profileId={} không hỗ trợ industryId={}", targetMentor.getId(), industry.getId());
                throw new BadRequestException("Lĩnh vực chuyên môn được chọn không nằm trong danh mục hỗ trợ của Mentor này. Vui lòng chọn lĩnh vực khác hoặc chọn Mentor phù hợp.");
            }
            if (request.getParticipationType() == MentoringType.GROUP
                    && targetMentor.getMentoringType() != MentoringType.GROUP
                    && targetMentor.getMentoringType() != MentoringType.BOTH) {
                throw new BadRequestException("Mentor này hiện không nhận mentoring theo nhóm");
            }
        }

        // 9. Xử lý nhóm Mentoring theo mô hình Group-First (hoặc legacy fallback)
        MentoringGroup mentoringGroup = null;
        Set<Long> participantUserIds = new LinkedHashSet<>();
        participantUserIds.add(student.getId());

        if (request.getParticipationType() == MentoringType.GROUP) {
            if (request.getGroupId() != null) {
                mentoringGroup = mentoringGroupRepository.findById(request.getGroupId())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhóm Mentoring đã chọn"));
                if (mentoringGroup.getStatus() != MentoringGroupStatus.ACTIVE) {
                    throw new BadRequestException("Nhóm Mentoring được chọn đã đóng hoặc không còn hoạt động");
                }
                if (!mentoringGroup.getLeader().getId().equals(student.getId())) {
                    throw new ForbiddenException("Chỉ trưởng nhóm mới có quyền tạo yêu cầu Mentoring cho nhóm");
                }
                List<MentoringGroupMember> joinedMembers = mentoringGroupMemberRepository.findByGroupIdAndStatusIn(
                        mentoringGroup.getId(), List.of(MentoringGroupMemberStatus.JOINED, MentoringGroupMemberStatus.ACTIVE));
                for (MentoringGroupMember jm : joinedMembers) {
                    participantUserIds.add(jm.getUser().getId());
                }
            } else if (!groupMemberIds.isEmpty()) {
                mentoringGroup = mentoringGroupService.createForRequest(student, request.getTitle(), groupMemberIds);
                List<MentoringGroupMember> joinedMembers = mentoringGroupMemberRepository.findByGroupIdAndStatusIn(
                        mentoringGroup.getId(), List.of(MentoringGroupMemberStatus.JOINED, MentoringGroupMemberStatus.ACTIVE));
                for (MentoringGroupMember jm : joinedMembers) {
                    participantUserIds.add(jm.getUser().getId());
                }
            }
        }

        // Kiểm tra xung đột lợi ích đối với yêu cầu DIRECT: Mentor được chọn không được là thành viên tham gia Request
        if (isDirectRequest && targetMentor != null && targetMentor.getUser() != null) {
            if (participantUserIds.contains(targetMentor.getUser().getId())) {
                log.warn("Mentor ID={} là thành viên tham gia trong yêu cầu cố vấn (Conflict of interest)", targetMentor.getId());
                throw new BadRequestException("Mentor không thể là thành viên trong yêu cầu Mentoring của chính mình");
            }
        }

        // 10. Lưu yêu cầu Mentoring vào cơ sở dữ liệu
        MentoringRequest mentoringRequest = MentoringRequest.builder()
                .student(student)
                .industry(industry)
                .requestType(isDirectRequest ? MentoringRequestType.DIRECT : MentoringRequestType.GENERAL)
                .targetMentor(targetMentor)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .budgetMin(request.getBudgetMin())
                .budgetMax(request.getBudgetMax())
                .workingMode(request.getWorkingMode())
                .participationType(request.getParticipationType())
                .taskType(request.getTaskType())
                .expectedDeadline(request.getExpectedDeadline())
                .status(MentoringRequestStatus.OPEN)
                .matchedCount(isDirectRequest ? 1 : 0)
                .group(mentoringGroup)
                .clientRequestKey(request.getClientRequestKey() == null ? null : request.getClientRequestKey().trim())
                .build();

        MentoringRequest savedRequest = mentoringRequestRepository.save(mentoringRequest);
        log.info("Lưu thành công MentoringRequest với ID={}, requestType={}", savedRequest.getId(), savedRequest.getRequestType());

        // Lưu snapshot thành viên tham gia vào mentoring_request_members
        List<MentoringGroupMemberResponse> participatingMemberResponses = new ArrayList<>();
        if (mentoringGroup != null) {
            for (Long pUserId : participantUserIds) {
                User pUser = userRepository.findById(pUserId).orElse(null);
                if (pUser != null) {
                    mentoringRequestMemberRepository.save(MentoringRequestMember.builder()
                            .request(savedRequest)
                            .user(pUser)
                            .joinedAt(Instant.now())
                            .build());
                    UserProfile pProfile = userProfileRepository.findById(pUserId).orElse(null);
                    participatingMemberResponses.add(MentoringGroupMemberResponse.builder()
                            .userId(pUserId)
                            .fullName(pProfile != null ? pProfile.getFullName() : pUser.getEmail())
                            .email(pUser.getEmail())
                            .avatarUrl(pProfile != null ? pProfile.getAvatarUrl() : null)
                            .major(pProfile != null && pProfile.getMajor() != null ? pProfile.getMajor().getName() : null)
                            .role(pUser.getRole() != null ? pUser.getRole().getName() : null)
                            .leader(pUserId.equals(mentoringGroup.getLeader().getId()))
                            .status(MentoringGroupMemberStatus.JOINED)
                            .joinedAt(Instant.now())
                            .build());
                    if (!pUserId.equals(student.getId())) {
                        notificationService.sendMentoringGroupNotification(student, pUser, mentoringGroup,
                                "REQUEST_CREATED", savedRequest.getId().toString(),
                                "Yêu cầu Mentoring mới của nhóm",
                                resolveFullName(student) + " đã tạo yêu cầu Mentoring \"" + savedRequest.getTitle() + "\" cho nhóm \"" + mentoringGroup.getName() + "\".");
                    }
                }
            }
        }

        // 11. Lưu các tệp đính kèm (nếu có)
        List<MentoringAttachmentResponse> attachmentResponses = new ArrayList<>();
        if (attachmentRequests != null && !attachmentRequests.isEmpty()) {
            for (MentoringAttachmentRequest att : attachmentRequests) {
                MentoringRequestAttachment attachment = MentoringRequestAttachment.builder()
                        .request(savedRequest)
                        .fileName(att.getFileName())
                        .fileUrl(att.getFileUrl())
                        .fileSize(att.getFileSize())
                        .fileType(att.getFileType())
                        .build();

                MentoringRequestAttachment savedAtt = mentoringRequestAttachmentRepository.save(attachment);
                attachmentResponses.add(MentoringAttachmentResponse.builder()
                        .id(savedAtt.getId())
                        .fileName(savedAtt.getFileName())
                        .fileUrl(savedAtt.getFileUrl())
                        .fileSize(savedAtt.getFileSize())
                        .fileType(savedAtt.getFileType())
                        .createdAt(savedAtt.getCreatedAt())
                        .build());
            }
        }

        // 12. Điều phối phân phối:
        int matchedCount;
        String distributionNote;
        String targetMentorName = null;
        String targetMentorAvatar = null;
        String targetMentorHeadline = null;

        if (isDirectRequest) {
            // UC101: Gửi trực tiếp tới Mentor đích — TUYỆT ĐỐI KHÔNG CHẠY AUTO-MATCHING
            MentoringRequestDistribution distribution = MentoringRequestDistribution.builder()
                    .request(savedRequest)
                    .mentorProfile(targetMentor)
                    .status(MentoringDistributionStatus.PENDING)
                    .distributedAt(Instant.now())
                    .build();

            mentoringRequestDistributionRepository.save(distribution);
            notificationService.sendMentoringRequestNotification(student, targetMentor.getUser(), savedRequest);
            matchedCount = 1;

            UserProfile mentorUserProfile = userProfileRepository.findById(targetMentor.getUser().getId()).orElse(null);
            targetMentorName = mentorUserProfile != null ? mentorUserProfile.getFullName() : targetMentor.getUser().getEmail();
            targetMentorAvatar = mentorUserProfile != null ? mentorUserProfile.getAvatarUrl() : null;
            targetMentorHeadline = mentorUserProfile != null ? mentorUserProfile.getHeadline() : null;

            distributionNote = "Yêu cầu cố vấn của bạn đã được gửi trực tiếp tới Mentor " + targetMentorName + ". Vui lòng chờ Mentor phản hồi.";
            log.info("Đã gửi trực tiếp yêu cầu Mentoring ID={} tới Mentor ID={}", savedRequest.getId(), targetMentor.getId());
        } else {
            // UC100: Kích hoạt Internal Matching và phân phối tự động tới các Mentor phù hợp (loại trừ các thành viên trong nhóm)
            List<MentorProfile> matchingMentors = mentorMatchingService.findMatchingMentors(
                    industry.getId(),
                    request.getWorkingMode(),
                    request.getParticipationType(),
                    participantUserIds
            );

            matchedCount = mentorMatchingService.distributeRequestToMentors(savedRequest, matchingMentors);
            matchingMentors.stream()
                    .filter(mentor -> mentor.getUser() != null)
                    .forEach(mentor -> notificationService.sendMentoringRequestNotification(
                            student, mentor.getUser(), savedRequest));
            savedRequest.setMatchedCount(matchedCount);
            mentoringRequestRepository.save(savedRequest);

            if (matchedCount > 0) {
                distributionNote = "Đã gửi yêu cầu của bạn tới " + matchedCount + " Mentor trong hệ thống. Các Mentor cùng ngành được ưu tiên hiển thị trước.";
            } else {
                distributionNote = "Hiện tại chưa tìm thấy Mentor phù hợp. Yêu cầu của bạn đã được ghi nhận vào hệ thống và sẽ sẵn sàng phân phối khi có Mentor mới tham gia.";
            }
            log.info("Hoàn tất tạo yêu cầu Mentoring chung ID={}: matchedCount={}, note={}",
                    savedRequest.getId(), matchedCount, distributionNote);
        }

        // 13. Đóng gói kết quả trả về
        return CreateMentoringRequestResponse.builder()
                .id(savedRequest.getId())
                .requestType(savedRequest.getRequestType())
                .targetMentorId(targetMentor != null ? targetMentor.getId() : null)
                .targetMentorName(targetMentorName)
                .targetMentorAvatar(targetMentorAvatar)
                .targetMentorHeadline(targetMentorHeadline)
                .title(savedRequest.getTitle())
                .description(savedRequest.getDescription())
                .industryId(industry.getId())
                .industryName(industry.getName())
                .budgetMin(savedRequest.getBudgetMin())
                .budgetMax(savedRequest.getBudgetMax())
                .workingMode(savedRequest.getWorkingMode())
                .participationType(savedRequest.getParticipationType())
                .taskType(savedRequest.getTaskType())
                .expectedDeadline(savedRequest.getExpectedDeadline())
                .status(savedRequest.getStatus())
                .matchedCount(matchedCount)
                .distributionNote(distributionNote)
                .attachments(attachmentResponses)
                .participatingMembers(participatingMemberResponses)
                .group(mentoringGroup != null ? mentoringGroupService.getGroup(userEmail, mentoringGroup.getId()) : null)
                .createdAt(savedRequest.getCreatedAt())
                .build();
    }

    /**
     * Lấy danh sách các yêu cầu Mentoring của sinh viên đang đăng nhập (phân trang, UC102).
     * Tự động tổng hợp số liệu phản hồi từ các Mentor cho từng yêu cầu phục vụ danh sách My Requests.
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param page Số thứ tự trang
     * @param size Số bản ghi mỗi trang
     * @return Danh sách phân trang các yêu cầu kèm tóm tắt phản hồi
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<CreateMentoringRequestResponse> getMyRequests(String userEmail, int page, int size) {
        User student = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + userEmail));

        Pageable pageable = PageRequest.of(page, size);
        Page<MentoringRequest> pageResult = mentoringRequestRepository.findByStudentIdOrderByCreatedAtDesc(student.getId(), pageable);

        List<MentoringRequest> requests = pageResult.getContent();
        List<Long> requestIds = requests.stream().map(MentoringRequest::getId).toList();

        Map<Long, List<MentoringRequestDistribution>> distributionsByRequestId = requestIds.isEmpty()
                ? Collections.emptyMap()
                : mentoringRequestDistributionRepository.findByRequestIdIn(requestIds).stream()
                        .collect(Collectors.groupingBy(d -> d.getRequest().getId()));

        List<CreateMentoringRequestResponse> content = requests.stream()
                .map(req -> mapToResponseWithSummary(req, distributionsByRequestId.getOrDefault(req.getId(), Collections.emptyList())))
                .toList();

        return PageResponse.<CreateMentoringRequestResponse>builder()
                .content(content)
                .pageNumber(pageResult.getNumber())
                .pageSize(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();
    }

    /**
     * Lấy thông tin chi tiết một yêu cầu Mentoring theo ID của sinh viên sở hữu.
     * Kiểm tra quyền sở hữu chặt chẽ: chỉ sinh viên tạo mới được phép xem (UC102 BR).
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @return DTO chi tiết yêu cầu
     */
    @Override
    @Transactional(readOnly = true)
    public CreateMentoringRequestResponse getRequestDetail(String userEmail, Long requestId) {
        User student = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + userEmail));

        MentoringRequest mentoringRequest = mentoringRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));

        // Thành viên nhóm của Request nhóm được xem (chỉ đọc); thao tác vẫn chỉ dành cho người tạo
        if (!mentoringRequest.getStudent().getId().equals(student.getId())
                && !mentoringGroupService.isActiveMember(mentoringRequest, student.getId())) {
            log.warn("User ID={} cố tình xem yêu cầu ID={} của User ID={}", student.getId(), requestId, mentoringRequest.getStudent().getId());
            throw new ForbiddenException("Bạn không có quyền xem yêu cầu cố vấn này");
        }

        List<MentoringRequestDistribution> distributions = mentoringRequestDistributionRepository.findByRequestIdOrderByDistributedAtAsc(requestId);
        return mapToResponseWithSummary(mentoringRequest, distributions);
    }

    /**
     * Lấy thông tin chi tiết một yêu cầu Mentoring kèm toàn bộ phản hồi từ các Mentor liên quan (UC102).
     * Phân biệt rõ ràng theo quy tắc nghiệp vụ:
     * - Nếu GENERAL (UC100): Trả về đúng danh sách các Mentor thực sự được phân phối yêu cầu.
     * - Nếu DIRECT (UC101): Trả về DUY NHẤT Mentor đích đã được chỉ định (tuyệt đối không hiển thị Mentor khác).
     * Kiểm tra quyền sở hữu: Sinh viên chỉ xem được yêu cầu do chính mình tạo.
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @return DTO chi tiết yêu cầu kèm danh sách phản hồi của Mentor
     */
    @Override
    @Transactional(readOnly = true)
    public MentoringRequestDetailResponse getRequestDetailWithResponses(String userEmail, Long requestId) {
        User student = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + userEmail));

        MentoringRequest mentoringRequest = mentoringRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));

        if (!mentoringRequest.getStudent().getId().equals(student.getId())
                && !mentoringGroupService.isActiveMember(mentoringRequest, student.getId())) {
            log.warn("Truy cập trái phép: User ID={} cố truy xuất phản hồi của yêu cầu ID={} thuộc về User ID={}",
                    student.getId(), requestId, mentoringRequest.getStudent().getId());
            throw new ForbiddenException("Bạn không có quyền xem yêu cầu cố vấn này");
        }

        List<MentoringRequestAttachment> atts = mentoringRequestAttachmentRepository.findByRequestId(mentoringRequest.getId());
        List<MentoringAttachmentResponse> attResponses = atts.stream()
                .map(a -> MentoringAttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .fileUrl(a.getFileUrl())
                        .fileSize(a.getFileSize())
                        .fileType(a.getFileType())
                        .createdAt(a.getCreatedAt())
                        .build())
                .toList();

        MentoringRequestType reqType = mentoringRequest.getRequestType() != null
                ? mentoringRequest.getRequestType()
                : MentoringRequestType.GENERAL;

        List<MentoringRequestDistribution> distributions = mentoringRequestDistributionRepository.findByRequestIdOrderByDistributedAtAsc(requestId);

        List<MentorResponseItemResponse> mentorResponses = new ArrayList<>();
        MentoringResponseSummaryResponse summary;

        if (reqType == MentoringRequestType.DIRECT) {
            // UC101: Yêu cầu trực tiếp — CHỈ HIỂN THỊ DUY NHẤT MENTOR ĐƯỢC CHỌN
            MentorProfile targetMentor = mentoringRequest.getTargetMentor();
            MentoringRequestDistribution targetDist = distributions.stream()
                    .filter(d -> targetMentor != null && d.getMentorProfile().getId().equals(targetMentor.getId()))
                    .findFirst()
                    .orElse(!distributions.isEmpty() ? distributions.get(0) : null);

            if (targetDist != null) {
                MentorResponseItemResponse item = mapDistributionToResponseItem(targetDist);
                mentorResponses.add(item);
                summary = buildResponseSummary(List.of(targetDist));
            } else if (targetMentor != null) {
                // Dự phòng nếu chưa có record distribution
                MentorResponseItemResponse fallbackItem = mapMentorProfileToDefaultResponseItem(targetMentor, mentoringRequest.getCreatedAt());
                mentorResponses.add(fallbackItem);
                summary = MentoringResponseSummaryResponse.builder()
                        .totalDistributed(1)
                        .waitingCount(1)
                        .acceptedCount(0)
                        .declinedCount(0)
                        .expiredCount(0)
                        .build();
            } else {
                summary = MentoringResponseSummaryResponse.builder().build();
            }
        } else {
            // UC100: Yêu cầu chung — Hiển thị danh sách các Mentor đã thực sự được phân phối
            for (MentoringRequestDistribution dist : distributions) {
                mentorResponses.add(mapDistributionToResponseItem(dist));
            }
            // Thứ tự hiển thị: Mentor được chọn → cùng ngành → đã chấp nhận → đang chờ → còn lại
            mentorResponses.sort(java.util.Comparator
                    .comparing((MentorResponseItemResponse r) -> !r.isSelected())
                    .thenComparing(r -> !r.isSameIndustry())
                    .thenComparingInt(r -> responseRank(r.getResponseStatus()))
                    .thenComparing(r -> r.getMentorName() == null ? "" : r.getMentorName(), String.CASE_INSENSITIVE_ORDER));
            summary = buildResponseSummary(distributions);
        }

        Long targetMentorId = null;
        String targetMentorName = null;
        String targetMentorAvatar = null;
        String targetMentorHeadline = null;

        if (mentoringRequest.getTargetMentor() != null) {
            targetMentorId = mentoringRequest.getTargetMentor().getId();
            User mUser = mentoringRequest.getTargetMentor().getUser();
            if (mUser != null) {
                UserProfile mProfile = userProfileRepository.findById(mUser.getId()).orElse(null);
                targetMentorName = mProfile != null ? mProfile.getFullName() : mUser.getEmail();
                targetMentorAvatar = mProfile != null ? mProfile.getAvatarUrl() : null;
                targetMentorHeadline = mProfile != null ? mProfile.getHeadline() : null;
            }
        }

        String distributionNote;
        if (reqType == MentoringRequestType.DIRECT) {
            distributionNote = "Yêu cầu cố vấn của bạn đã được gửi trực tiếp tới Mentor " + (targetMentorName != null ? targetMentorName : "") + ". Vui lòng chờ Mentor phản hồi.";
        } else if (summary.getTotalDistributed() > 0) {
            distributionNote = "Đã gửi yêu cầu tới " + summary.getTotalDistributed() + " Mentor trong hệ thống. Các Mentor cùng ngành được ưu tiên hiển thị trước.";
        } else {
            distributionNote = "Hiện tại chưa tìm thấy Mentor phù hợp. Yêu cầu của bạn đã được ghi nhận vào hệ thống và sẽ sẵn sàng phân phối khi có Mentor mới.";
        }

        return MentoringRequestDetailResponse.builder()
                .canCancel(requestLifecycleService.canCancel(mentoringRequest, student.getId()))
                .id(mentoringRequest.getId())
                .requestType(reqType)
                .targetMentorId(targetMentorId)
                .targetMentorName(targetMentorName)
                .targetMentorAvatar(targetMentorAvatar)
                .targetMentorHeadline(targetMentorHeadline)
                .title(mentoringRequest.getTitle())
                .description(mentoringRequest.getDescription())
                .industryId(mentoringRequest.getIndustry().getId())
                .industryName(mentoringRequest.getIndustry().getName())
                .budgetMin(mentoringRequest.getBudgetMin())
                .budgetMax(mentoringRequest.getBudgetMax())
                .workingMode(mentoringRequest.getWorkingMode())
                .participationType(mentoringRequest.getParticipationType())
                .taskType(mentoringRequest.getTaskType())
                .expectedDeadline(mentoringRequest.getExpectedDeadline())
                .status(mentoringRequest.getStatus())
                .matchedCount(reqType == MentoringRequestType.DIRECT ? 1 : summary.getTotalDistributed())
                .distributionNote(distributionNote)
                .attachments(attResponses)
                .createdAt(mentoringRequest.getCreatedAt())
                .updatedAt(mentoringRequest.getUpdatedAt())
                .responseSummary(summary)
                .mentorResponses(mentorResponses)
                .selectedMentorUserId(mentoringRequest.getSelectedMentor() != null ? mentoringRequest.getSelectedMentor().getId() : null)
                .confirmedDealId(mentoringRequest.getConfirmedDeal() != null ? mentoringRequest.getConfirmedDeal().getId() : null)
                .taskId(mentoringRequest.getConfirmedDeal() != null
                        ? mentoringTaskRepository.findByDealId(mentoringRequest.getConfirmedDeal().getId()).map(t -> t.getId()).orElse(null)
                        : null)
                .group(mentoringRequest.getGroup() != null
                        ? mentoringGroupService.getGroup(userEmail, mentoringRequest.getGroup().getId()) : null)
                .participatingMembers(mapParticipatingMembers(mentoringRequest))
                .build();
    }

    /**
     * Lấy danh sách phản hồi của các Mentor đối với một yêu cầu Mentoring cụ thể (UC102).
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @return Danh sách phản hồi của các Mentor
     */
    @Override
    @Transactional(readOnly = true)
    public List<MentorResponseItemResponse> getRequestResponses(String userEmail, Long requestId) {
        return getRequestDetailWithResponses(userEmail, requestId).getMentorResponses();
    }

    private String resolveFullName(User user) {
        if (user == null) return "Người dùng AlumNect";
        UserProfile p = user.getProfile() != null ? user.getProfile() : userProfileRepository.findById(user.getId()).orElse(null);
        return p != null && p.getFullName() != null && !p.getFullName().isBlank() ? p.getFullName() : user.getEmail();
    }

    private List<MentoringGroupMemberResponse> mapParticipatingMembers(MentoringRequest request) {
        if (request == null) return Collections.emptyList();
        List<MentoringRequestMember> snapshotMembers = mentoringRequestMemberRepository.findByRequestId(request.getId());
        if (!snapshotMembers.isEmpty()) {
            Long leaderId = request.getGroup() != null ? request.getGroup().getLeader().getId() : request.getStudent().getId();
            return snapshotMembers.stream().<MentoringGroupMemberResponse>map(rm -> {
                User u = rm.getUser();
                UserProfile p = userProfileRepository.findById(u.getId()).orElse(null);
                return MentoringGroupMemberResponse.builder()
                        .id(rm.getId())
                        .userId(u.getId())
                        .fullName(p != null ? p.getFullName() : u.getEmail())
                        .email(u.getEmail())
                        .avatarUrl(p != null ? p.getAvatarUrl() : null)
                        .major(p != null && p.getMajor() != null ? p.getMajor().getName() : null)
                        .role(u.getRole() != null ? u.getRole().getName() : null)
                        .leader(u.getId().equals(leaderId))
                        .status(MentoringGroupMemberStatus.JOINED)
                        .joinedAt(rm.getJoinedAt())
                        .build();
            }).toList();
        }
        return Collections.emptyList();
    }

    /**
     * Tiện ích chuyển đổi Entity MentoringRequest sang Response DTO kèm theo số liệu thống kê phản hồi.
     */
    private CreateMentoringRequestResponse mapToResponseWithSummary(MentoringRequest entity, List<MentoringRequestDistribution> distributions) {
        List<MentoringRequestAttachment> atts = mentoringRequestAttachmentRepository.findByRequestId(entity.getId());
        List<MentoringAttachmentResponse> attResponses = atts.stream()
                .map(a -> MentoringAttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .fileUrl(a.getFileUrl())
                        .fileSize(a.getFileSize())
                        .fileType(a.getFileType())
                        .createdAt(a.getCreatedAt())
                        .build())
                .toList();

        MentoringRequestType reqType = entity.getRequestType() != null ? entity.getRequestType() : MentoringRequestType.GENERAL;
        Long targetMentorId = null;
        String targetMentorName = null;
        String targetMentorAvatar = null;
        String targetMentorHeadline = null;

        if (entity.getTargetMentor() != null) {
            targetMentorId = entity.getTargetMentor().getId();
            User mUser = entity.getTargetMentor().getUser();
            if (mUser != null) {
                UserProfile mProfile = userProfileRepository.findById(mUser.getId()).orElse(null);
                targetMentorName = mProfile != null ? mProfile.getFullName() : mUser.getEmail();
                targetMentorAvatar = mProfile != null ? mProfile.getAvatarUrl() : null;
                targetMentorHeadline = mProfile != null ? mProfile.getHeadline() : null;
            }
        }

        MentoringResponseSummaryResponse summary;
        String directMentorResponseStatus = null;

        if (reqType == MentoringRequestType.DIRECT) {
            MentoringRequestDistribution targetDist = distributions.stream()
                    .filter(d -> entity.getTargetMentor() != null && d.getMentorProfile().getId().equals(entity.getTargetMentor().getId()))
                    .findFirst()
                    .orElse(!distributions.isEmpty() ? distributions.get(0) : null);

            if (targetDist != null) {
                directMentorResponseStatus = mapDistributionStatusToBusiness(targetDist.getStatus());
                summary = buildResponseSummary(List.of(targetDist));
            } else {
                directMentorResponseStatus = "WAITING";
                summary = MentoringResponseSummaryResponse.builder()
                        .totalDistributed(1)
                        .waitingCount(1)
                        .acceptedCount(0)
                        .declinedCount(0)
                        .expiredCount(0)
                        .build();
            }
        } else {
            summary = buildResponseSummary(distributions);
        }

        String distributionNote;
        if (reqType == MentoringRequestType.DIRECT) {
            distributionNote = "Yêu cầu cố vấn của bạn đã được gửi trực tiếp tới Mentor " + (targetMentorName != null ? targetMentorName : "") + ". Vui lòng chờ Mentor phản hồi.";
        } else if (summary.getTotalDistributed() > 0) {
            distributionNote = "Đã tự động phân phối yêu cầu tới " + summary.getTotalDistributed() + " Mentor phù hợp trong mạng lưới.";
        } else {
            distributionNote = "Hiện tại chưa tìm thấy Mentor phù hợp. Yêu cầu của bạn đã được ghi nhận vào hệ thống và sẽ sẵn sàng phân phối khi có Mentor mới.";
        }

        return CreateMentoringRequestResponse.builder()
                .id(entity.getId())
                .requestType(reqType)
                .targetMentorId(targetMentorId)
                .targetMentorName(targetMentorName)
                .targetMentorAvatar(targetMentorAvatar)
                .targetMentorHeadline(targetMentorHeadline)
                .title(entity.getTitle())
                .description(entity.getDescription())
                .industryId(entity.getIndustry().getId())
                .industryName(entity.getIndustry().getName())
                .budgetMin(entity.getBudgetMin())
                .budgetMax(entity.getBudgetMax())
                .workingMode(entity.getWorkingMode())
                .participationType(entity.getParticipationType())
                .taskType(entity.getTaskType())
                .expectedDeadline(entity.getExpectedDeadline())
                .status(entity.getStatus())
                .matchedCount(reqType == MentoringRequestType.DIRECT ? 1 : summary.getTotalDistributed())
                .distributionNote(distributionNote)
                .attachments(attResponses)
                .responseSummary(summary)
                .directMentorResponseStatus(directMentorResponseStatus)
                .participatingMembers(mapParticipatingMembers(entity))
                .group(entity.getGroup() != null
                        ? mentoringGroupService.getGroup(entity.getStudent().getEmail(), entity.getGroup().getId()) : null)
                .createdAt(entity.getCreatedAt())
                .build();
    }

    /**
     * Tiện ích chuyển đổi một bản ghi distribution sang MentorResponseItemResponse.
     */
    private int responseRank(String responseStatus) {
        if (responseStatus == null) return 3;
        return switch (responseStatus) {
            case "ACCEPTED" -> 0;
            case "WAITING" -> 1;
            default -> 2;
        };
    }

    private MentorResponseItemResponse mapDistributionToResponseItem(MentoringRequestDistribution dist) {
        MentorProfile profile = dist.getMentorProfile();
        User mentorUser = profile.getUser();
        UserProfile userProfile = mentorUser != null ? userProfileRepository.findById(mentorUser.getId()).orElse(null) : null;

        String name = userProfile != null ? userProfile.getFullName() : (mentorUser != null ? mentorUser.getEmail() : "Mentor");
        String avatar = userProfile != null ? userProfile.getAvatarUrl() : null;
        String headline = userProfile != null ? userProfile.getHeadline() : null;

        List<String> supportedFields = mentorSupportedFieldRepository.findByMentorProfileId(profile.getId()).stream()
                .map(sf -> sf.getIndustry().getName())
                .toList();

        String businessStatus = mapDistributionStatusToBusiness(dist.getStatus());
        MentoringRequest req = dist.getRequest();
        Long conversationId = mentorUser != null
                ? mentoringConversationService.findConversation(req.getId(), mentorUser.getId()).map(Conversation::getId).orElse(null)
                : null;
        boolean canMessage = dist.getStatus() == MentoringDistributionStatus.ACCEPTED && conversationId != null;
        boolean selected = mentorUser != null && req.getSelectedMentor() != null
                && req.getSelectedMentor().getId().equals(mentorUser.getId());
        Long requestIndustryId = req.getIndustry() != null ? req.getIndustry().getId() : null;
        boolean sameIndustry = requestIndustryId != null && mentorSupportedFieldRepository
                .findByMentorProfileId(profile.getId()).stream()
                .anyMatch(sf -> sf.getIndustry() != null && requestIndustryId.equals(sf.getIndustry().getId()));

        return MentorResponseItemResponse.builder()
                .mentorProfileId(profile.getId())
                .mentorUserId(mentorUser != null ? mentorUser.getId() : null)
                .mentorName(name)
                .mentorAvatar(avatar)
                .mentorHeadline(headline)
                .supportedFields(supportedFields)
                .distributionStatus(dist.getStatus())
                .responseStatus(businessStatus)
                .responseNote(dist.getResponseNote())
                .distributedAt(dist.getDistributedAt())
                .respondedAt(dist.getRespondedAt())
                .canMessage(canMessage)
                .conversationId(conversationId)
                .selected(selected)
                .sameIndustry(sameIndustry)
                .build();
    }

    /**
     * Tiện ích tạo fallback response item khi MentorProfile chưa có distribution record.
     */
    private MentorResponseItemResponse mapMentorProfileToDefaultResponseItem(MentorProfile profile, Instant createdAt) {
        User mentorUser = profile.getUser();
        UserProfile userProfile = mentorUser != null ? userProfileRepository.findById(mentorUser.getId()).orElse(null) : null;

        String name = userProfile != null ? userProfile.getFullName() : (mentorUser != null ? mentorUser.getEmail() : "Mentor");
        String avatar = userProfile != null ? userProfile.getAvatarUrl() : null;
        String headline = userProfile != null ? userProfile.getHeadline() : null;

        List<String> supportedFields = mentorSupportedFieldRepository.findByMentorProfileId(profile.getId()).stream()
                .map(sf -> sf.getIndustry().getName())
                .toList();

        return MentorResponseItemResponse.builder()
                .mentorProfileId(profile.getId())
                .mentorUserId(mentorUser != null ? mentorUser.getId() : null)
                .mentorName(name)
                .mentorAvatar(avatar)
                .mentorHeadline(headline)
                .supportedFields(supportedFields)
                .distributionStatus(MentoringDistributionStatus.PENDING)
                .responseStatus("WAITING")
                .distributedAt(createdAt)
                .canMessage(false)
                .build();
    }

    /**
     * Tiện ích tổng hợp số lượng trạng thái phản hồi của danh sách phân phối.
     */
    private MentoringResponseSummaryResponse buildResponseSummary(List<MentoringRequestDistribution> distributions) {
        int total = distributions.size();
        int waiting = 0;
        int accepted = 0;
        int declined = 0;
        int expired = 0;

        for (MentoringRequestDistribution dist : distributions) {
            if (dist.getStatus() == null) {
                waiting++;
                continue;
            }
            switch (dist.getStatus()) {
                case PENDING -> waiting++;
                case ACCEPTED -> accepted++;
                case REJECTED -> declined++;
                case EXPIRED -> expired++;
            }
        }

        return MentoringResponseSummaryResponse.builder()
                .totalDistributed(total)
                .waitingCount(waiting)
                .acceptedCount(accepted)
                .declinedCount(declined)
                .expiredCount(expired)
                .build();
    }

    /**
     * Ánh xạ trạng thái phân phối từ database sang thuật ngữ nghiệp vụ hiển thị cho sinh viên:
     * PENDING -> WAITING
     * ACCEPTED -> ACCEPTED
     * REJECTED -> DECLINED
     * EXPIRED -> EXPIRED
     */
    private String mapDistributionStatusToBusiness(MentoringDistributionStatus status) {
        if (status == null) {
            return "WAITING";
        }
        return switch (status) {
            case ACCEPTED -> "ACCEPTED";
            case REJECTED -> "DECLINED";
            case EXPIRED -> "EXPIRED";
            default -> "WAITING";
        };
    }

    /**
     * Lấy danh sách các yêu cầu Mentoring được phân phối hoặc gửi trực tiếp tới Mentor đang đăng nhập (phân trang, UC103).
     * Hỗ trợ lọc theo trạng thái phản hồi (WAITING, ACCEPTED, DECLINED) và loại yêu cầu (GENERAL, DIRECT).
     *
     * @param mentorEmail Email của Mentor đang đăng nhập
     * @param status Trạng thái phản hồi cần lọc (WAITING, ACCEPTED, DECLINED, hoặc null)
     * @param requestType Loại yêu cầu cần lọc (GENERAL, DIRECT, hoặc null)
     * @param page Số thứ tự trang (0-indexed)
     * @param size Số bản ghi mỗi trang
     * @return Danh sách phân trang các yêu cầu gửi tới Mentor
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<MentorIncomingRequestResponse> getIncomingRequests(
            String mentorEmail, String status, String requestType, String scope, int page, int size) {
        log.info("Lấy incoming requests cho mentor: {}, status={}, requestType={}, scope={}, page={}, size={}",
                mentorEmail, status, requestType, scope, page, size);

        User mentorUser = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + mentorEmail));

        if (mentorUser.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("Tài khoản của bạn đang bị khóa hoặc chưa được kích hoạt để sử dụng tính năng này");
        }

        MentorProfile mentorProfile = mentorProfileRepository.findByUserId(mentorUser.getId())
                .orElseThrow(() -> new ForbiddenException("Tài khoản của bạn chưa đăng ký hồ sơ Mentor"));

        // Phân tích bộ lọc trạng thái (status)
        MentoringDistributionStatus distStatus = null;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
            String s = status.trim().toUpperCase();
            if ("WAITING".equals(s) || "PENDING".equals(s)) {
                distStatus = MentoringDistributionStatus.PENDING;
            } else if ("ACCEPTED".equals(s)) {
                distStatus = MentoringDistributionStatus.ACCEPTED;
            } else if ("DECLINED".equals(s) || "REJECTED".equals(s)) {
                distStatus = MentoringDistributionStatus.REJECTED;
            } else if ("EXPIRED".equals(s)) {
                distStatus = MentoringDistributionStatus.EXPIRED;
            }
        }

        // Phân tích bộ lọc loại yêu cầu (requestType)
        MentoringRequestType reqType = null;
        if (requestType != null && !requestType.isBlank() && !"ALL".equalsIgnoreCase(requestType.trim())) {
            String rt = requestType.trim().toUpperCase();
            if ("GENERAL".equals(rt)) {
                reqType = MentoringRequestType.GENERAL;
            } else if ("DIRECT".equals(rt)) {
                reqType = MentoringRequestType.DIRECT;
            }
        }

        String normalizedScope = normalizeIncomingScope(scope);
        Set<Long> supportedIndustryIds = mentorSupportedFieldRepository.findByMentorProfileId(mentorProfile.getId()).stream()
                .map(field -> field.getIndustry().getId())
                .collect(Collectors.toSet());
        boolean canBrowseOpenRequests = mentorProfile.getMentorStatus() == MentorStatus.ACTIVE
                && hasActiveSubscription(mentorProfile.getId());

        Specification<MentoringRequest> visibleRequests = buildIncomingRequestSpecification(
                mentorProfile, mentorUser.getId(), distStatus, reqType, normalizedScope,
                supportedIndustryIds, canBrowseOpenRequests);

        Pageable pageable = PageRequest.of(page, size);
        Page<MentoringRequest> pageResult = mentoringRequestRepository.findAll(visibleRequests, pageable);
        List<MentoringRequest> requests = pageResult.getContent();
        List<Long> requestIds = requests.stream().map(MentoringRequest::getId).toList();

        Map<Long, MentoringRequestDistribution> distributionByRequestId = requestIds.isEmpty()
                ? Collections.emptyMap()
                : mentoringRequestDistributionRepository
                        .findByRequestIdsAndMentorProfileId(requestIds, mentorProfile.getId()).stream()
                        .collect(Collectors.toMap(d -> d.getRequest().getId(), d -> d));

        List<Long> studentUserIds = requests.stream()
                .map(r -> r.getStudent().getId())
                .distinct()
                .toList();

        Map<Long, UserProfile> userProfileMap = studentUserIds.isEmpty()
                ? Collections.emptyMap()
                : userProfileRepository.findAllById(studentUserIds).stream()
                        .collect(Collectors.toMap(UserProfile::getUserId, p -> p));

        List<MentorIncomingRequestResponse> content = requests.stream()
                .map(r -> mapToIncomingResponse(
                        r,
                        distributionByRequestId.get(r.getId()),
                        userProfileMap.get(r.getStudent().getId()),
                        mentorProfile,
                        supportedIndustryIds))
                .toList();

        return PageResponse.<MentorIncomingRequestResponse>builder()
                .content(content)
                .pageNumber(pageResult.getNumber())
                .pageSize(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();
    }

    private String normalizeIncomingScope(String scope) {
        if (scope == null || scope.isBlank()) {
            return "ALL";
        }
        String normalized = scope.trim().toUpperCase();
        return switch (normalized) {
            case "SAME_INDUSTRY", "SAME_FORMAT" -> normalized;
            default -> "ALL";
        };
    }

    /**
     * GENERAL request được truy vấn động thay vì bắt buộc phải có distribution từ lúc tạo.
     * Nhờ đó Mentor hoàn tất đăng ký sau vẫn thấy các request OPEN cũ. Distribution chỉ còn
     * là trạng thái phản hồi thực tế của Mentor và được tạo khi ACCEPT/DECLINE.
     */
    private Specification<MentoringRequest> buildIncomingRequestSpecification(
            MentorProfile mentorProfile,
            Long mentorUserId,
            MentoringDistributionStatus distStatus,
            MentoringRequestType requestType,
            String scope,
            Set<Long> supportedIndustryIds,
            boolean canBrowseOpenRequests) {

        return (root, query, cb) -> {
            jakarta.persistence.criteria.Join<MentoringRequest, MentoringRequestDistribution> distribution =
                    root.join("distributions", JoinType.LEFT);
            distribution.on(cb.equal(distribution.get("mentorProfile").get("id"), mentorProfile.getId()));

            var directRequest = cb.and(
                    cb.equal(root.get("requestType"), MentoringRequestType.DIRECT),
                    cb.equal(root.get("targetMentor").get("id"), mentorProfile.getId()));

            var previouslyVisibleGeneral = cb.isNotNull(distribution.get("id"));
            var openGeneral = canBrowseOpenRequests
                    ? cb.equal(root.get("status"), MentoringRequestStatus.OPEN)
                    : cb.disjunction();
            var generalRequest = cb.and(
                    cb.equal(root.get("requestType"), MentoringRequestType.GENERAL),
                    cb.or(openGeneral, previouslyVisibleGeneral));

            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.notEqual(root.get("student").get("id"), mentorUserId));
            predicates.add(cb.or(directRequest, generalRequest));

            if (requestType != null) {
                predicates.add(cb.equal(root.get("requestType"), requestType));
            }
            if (distStatus == MentoringDistributionStatus.PENDING) {
                predicates.add(cb.or(
                        cb.isNull(distribution.get("id")),
                        cb.equal(distribution.get("status"), MentoringDistributionStatus.PENDING)));
            } else if (distStatus != null) {
                predicates.add(cb.equal(distribution.get("status"), distStatus));
            }

            var sameIndustry = supportedIndustryIds.isEmpty()
                    ? cb.disjunction()
                    : root.get("industry").get("id").in(supportedIndustryIds);
            var sameFormat = cb.and(
                    workingModeCompatiblePredicate(cb, root, mentorProfile.getWorkingMode()),
                    participationTypeCompatiblePredicate(cb, root, mentorProfile.getMentoringType()));

            if ("SAME_INDUSTRY".equals(scope)) {
                predicates.add(sameIndustry);
            } else if ("SAME_FORMAT".equals(scope)) {
                predicates.add(sameFormat);
            }

            if (!Long.class.equals(query.getResultType()) && !long.class.equals(query.getResultType())) {
                query.orderBy(
                        cb.asc(cb.<Integer>selectCase().when(sameIndustry, 0).otherwise(1)),
                        cb.asc(cb.<Integer>selectCase().when(sameFormat, 0).otherwise(1)),
                        cb.desc(root.get("createdAt")));
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private jakarta.persistence.criteria.Predicate workingModeCompatiblePredicate(
            jakarta.persistence.criteria.CriteriaBuilder cb,
            jakarta.persistence.criteria.Root<MentoringRequest> root,
            MentoringWorkingMode mentorMode) {
        if (mentorMode == null || mentorMode == MentoringWorkingMode.BOTH) {
            return cb.conjunction();
        }
        return cb.or(
                cb.equal(root.get("workingMode"), mentorMode),
                cb.equal(root.get("workingMode"), MentoringWorkingMode.BOTH));
    }

    private jakarta.persistence.criteria.Predicate participationTypeCompatiblePredicate(
            jakarta.persistence.criteria.CriteriaBuilder cb,
            jakarta.persistence.criteria.Root<MentoringRequest> root,
            MentoringType mentorType) {
        if (mentorType == null || mentorType == MentoringType.BOTH) {
            return cb.conjunction();
        }
        return cb.or(
                cb.equal(root.get("participationType"), mentorType),
                cb.equal(root.get("participationType"), MentoringType.BOTH));
    }

    /**
     * Lấy thông tin chi tiết một yêu cầu Mentoring được phân phối hoặc gửi trực tiếp tới Mentor đang đăng nhập (UC103).
     * Kiểm tra quyền sở hữu phân phối chặt chẽ: Mentor chỉ xem được yêu cầu thực sự được phân phối/gửi đến mình.
     *
     * @param mentorEmail Email của Mentor đang đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @return DTO chi tiết yêu cầu dành cho Mentor kèm trạng thái phản hồi và cờ quyền hành động
     */
    @Override
    @Transactional(readOnly = true)
    public MentorIncomingRequestDetailResponse getIncomingRequestDetail(String mentorEmail, Long requestId) {
        log.info("Lấy chi tiết incoming request ID={} cho mentor: {}", requestId, mentorEmail);

        User mentorUser = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + mentorEmail));

        if (mentorUser.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("Tài khoản của bạn đang bị khóa hoặc chưa được kích hoạt để sử dụng tính năng này");
        }

        MentorProfile mentorProfile = mentorProfileRepository.findByUserId(mentorUser.getId())
                .orElseThrow(() -> new ForbiddenException("Tài khoản của bạn chưa đăng ký hồ sơ Mentor"));

        MentoringRequest mentoringRequest = mentoringRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));

        MentoringRequestDistribution distribution = mentoringRequestDistributionRepository
                .findByRequestIdAndMentorProfileId(requestId, mentorProfile.getId())
                .orElse(null);

        boolean isMentorActive = mentorProfile.getMentorStatus() == MentorStatus.ACTIVE;
        boolean hasValidSub = hasActiveSubscription(mentorProfile.getId());
        if (!canMentorViewRequest(mentoringRequest, distribution, mentorProfile, isMentorActive && hasValidSub)) {
            log.warn("Truy cập trái phép: Mentor ID={} cố xem incoming request ID={}", mentorProfile.getId(), requestId);
            throw new ForbiddenException("Bạn không có quyền truy cập yêu cầu này");
        }

        return mapToIncomingDetailResponse(mentoringRequest, distribution, mentorProfile, isMentorActive, hasValidSub);
    }

    /**
     * Mentor chấp nhận (ACCEPT) yêu cầu Mentoring được phân phối hoặc gửi trực tiếp tới mình (UC103).
     * ACCEPT chỉ mang nghĩa "đồng ý trao đổi / thương lượng Request": KHÔNG xác nhận Deal, KHÔNG chọn Mentor,
     * KHÔNG tạo Task, KHÔNG bỏ qua thanh toán.
     * - Xác thực Mentor ACTIVE và Subscription còn hiệu lực.
     * - Khóa Request và bản ghi phản hồi (FOR UPDATE) để thao tác idempotent khi bị gọi lặp / retry.
     * - Request phải còn OPEN và chưa chốt Mentor khác; Mentor phải thuộc danh sách nhận Request.
     * - WAITING → ACCEPTED, tạo hoặc lấy lại Chat for Task (Request + Student + Mentor, task_id = null)
     *   và gửi tin nhắn hệ thống. Gọi lại khi đã ACCEPTED trả về đúng Chat for Task cũ, không tạo cuộc hội thoại thứ hai.
     *
     * @param mentorEmail Email của Mentor đang đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @param requestDto DTO chứa lời nhắn phản hồi tùy chọn
     * @return DTO chi tiết yêu cầu sau khi chấp nhận (kèm conversationId)
     */
    @Override
    @Transactional
    public MentorIncomingRequestDetailResponse acceptIncomingRequest(String mentorEmail, Long requestId, RespondMentoringRequestRequest requestDto) {
        log.info("Mentor {} thực hiện ACCEPT cho request ID={}", mentorEmail, requestId);

        User mentorUser = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + mentorEmail));

        if (mentorUser.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("Tài khoản của bạn đang bị khóa hoặc chưa được kích hoạt để sử dụng tính năng này");
        }

        MentorProfile mentorProfile = mentorProfileRepository.findByUserId(mentorUser.getId())
                .orElseThrow(() -> new ForbiddenException("Tài khoản của bạn chưa đăng ký hồ sơ Mentor"));

        // Kiểm tra Mentor ACTIVE (Rule 6 / Precondition 3)
        if (mentorProfile.getMentorStatus() != MentorStatus.ACTIVE) {
            log.warn("Mentor ID={} không ở trạng thái ACTIVE (hiện tại: {}) khi cố chấp nhận yêu cầu", mentorProfile.getId(), mentorProfile.getMentorStatus());
            throw new ForbiddenException("Hồ sơ Mentor của bạn không trong trạng thái hoạt động (ACTIVE) để phản hồi yêu cầu");
        }

        // Kiểm tra Mentor Subscription (Rule 6 / Precondition 4)
        if (!hasActiveSubscription(mentorProfile.getId())) {
            log.warn("Gói hoạt động của Mentor ID={} đã hết hạn hoặc chưa kích hoạt khi cố chấp nhận yêu cầu", mentorProfile.getId());
            throw new ForbiddenException("Gói hoạt động của Mentor đã hết hạn hoặc chưa được kích hoạt, bạn không thể phản hồi yêu cầu này");
        }

        // Khóa Request trước (thứ tự khóa thống nhất với luồng xác nhận Deal) rồi khóa bản ghi phản hồi
        MentoringRequest mentoringRequest = mentoringRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));

        MentoringRequestDistribution distribution = mentoringRequestDistributionRepository
                .findForUpdate(requestId, mentorProfile.getId())
                .orElseGet(() -> createPendingDistributionForOpenGeneralRequest(mentoringRequest, mentorProfile));

        // Idempotent: ACCEPT lặp lại / retry trả về đúng Chat for Task đã có, không tạo thêm cuộc hội thoại hay tin nhắn
        if (distribution.getStatus() == MentoringDistributionStatus.ACCEPTED) {
            Conversation existing = mentoringConversationService.getOrCreateConversation(mentoringRequest, mentorUser);
            log.info("Mentor ID={} gọi lại ACCEPT cho request ID={} — trả về Chat for Task id={}", mentorProfile.getId(), requestId, existing.getId());
            return mapToIncomingDetailResponse(distribution, mentorProfile, true, true);
        }

        // Kiểm tra trạng thái yêu cầu: chỉ cho phép phản hồi khi Request OPEN và chưa chọn Mentor nào (Rule 7)
        if (mentoringRequest.getStatus() != MentoringRequestStatus.OPEN || mentoringRequest.getSelectedMentor() != null) {
            log.warn("Yêu cầu ID={} không còn OPEN hoặc đã chọn Mentor (status={})", requestId, mentoringRequest.getStatus());
            throw new BadRequestException("Yêu cầu cố vấn này đã đóng, đã chọn Mentor khác hoặc không còn tiếp nhận phản hồi mới");
        }
        if (mentoringRequest.getExpectedDeadline() != null && mentoringRequest.getExpectedDeadline().isBefore(Instant.now())) {
            throw new BadRequestException("Yêu cầu đã quá thời hạn mong muốn của Học viên, không thể nhận thêm phản hồi.");
        }
        // Xung đột lợi ích: Mentor là thành viên của chính nhóm gửi Request
        if (mentoringGroupService.isActiveMember(mentoringRequest, mentorUser.getId())) {
            throw new ForbiddenException("Bạn là thành viên của nhóm gửi yêu cầu này nên không thể nhận làm Mentor.");
        }
        // Năng lực nhận việc của Mentor
        mentoringRules.requireMentorCapacity(mentorUser.getId());

        // Kiểm tra trạng thái phân phối hiện tại (Rule 8)
        if (distribution.getStatus() == MentoringDistributionStatus.REJECTED) {
            throw new ConflictException("Bạn đã từ chối yêu cầu này trước đó, không thể phản hồi lại");
        }
        if (distribution.getStatus() == MentoringDistributionStatus.EXPIRED) {
            throw new BadRequestException("Yêu cầu phân phối đã quá hạn phản hồi");
        }
        if (distribution.getStatus() != MentoringDistributionStatus.PENDING) {
            throw new ConflictException("Yêu cầu này đã được xử lý phản hồi trước đó");
        }

        // WAITING → ACCEPTED (Rule 9)
        distribution.setStatus(MentoringDistributionStatus.ACCEPTED);
        distribution.setRespondedAt(Instant.now());
        // Phản hồi trong vòng 24 giờ kể từ khi nhận yêu cầu: thưởng điểm uy tín
        if (distribution.getDistributedAt() != null
                && distribution.getDistributedAt().plus(java.time.Duration.ofHours(24)).isAfter(Instant.now())) {
            mentorReputationService.recordQuickResponse(mentorProfile.getId());
        }
        if (requestDto != null && requestDto.getResponseNote() != null && !requestDto.getResponseNote().trim().isEmpty()) {
            distribution.setResponseNote(requestDto.getResponseNote().trim());
        }
        MentoringRequestDistribution savedDist = mentoringRequestDistributionRepository.save(distribution);

        // Tạo / lấy lại Chat for Task của bộ (Request, Student, Mentor) và thông báo cho Học viên
        Conversation conversation = mentoringConversationService.getOrCreateConversation(mentoringRequest, mentorUser);
        mentoringConversationService.postSystemMessage(conversation, mentorUser,
                mentoringConversationService.displayName(mentorUser) + " đã đồng ý trao đổi về Request của bạn.");
        notificationService.sendMentoringRequestResponseNotification(
                mentorUser, mentoringRequest.getStudent(), mentoringRequest, true);

        log.info("Mentor ID={} đã ACCEPT yêu cầu ID={} — Chat for Task id={} (chưa có Deal/Task)",
                mentorProfile.getId(), requestId, conversation.getId());
        return mapToIncomingDetailResponse(savedDist, mentorProfile, true, true);
    }

    /**
     * Mentor từ chối (DECLINE) yêu cầu Mentoring được phân phối hoặc gửi trực tiếp tới mình (UC103).
     * - Xác thực Mentor ACTIVE và Subscription còn hiệu lực.
     * - Kiểm tra Request OPEN và bản ghi phân phối đang PENDING (WAITING).
     * - Cập nhật trạng thái phân phối thành REJECTED (hiển thị DECLINED) và lưu thời điểm phản hồi.
     * - Không cho phép mở Deal với Mentor đã từ chối.
     *
     * @param mentorEmail Email của Mentor đang đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @param requestDto DTO chứa lời nhắn / lý do từ chối tùy chọn
     * @return DTO chi tiết yêu cầu sau khi từ chối
     */
    @Override
    @Transactional
    public MentorIncomingRequestDetailResponse declineIncomingRequest(String mentorEmail, Long requestId, RespondMentoringRequestRequest requestDto) {
        log.info("Mentor {} thực hiện DECLINE cho request ID={}", mentorEmail, requestId);

        User mentorUser = userRepository.findByEmail(mentorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + mentorEmail));

        if (mentorUser.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new ForbiddenException("Tài khoản của bạn đang bị khóa hoặc chưa được kích hoạt để sử dụng tính năng này");
        }

        MentorProfile mentorProfile = mentorProfileRepository.findByUserId(mentorUser.getId())
                .orElseThrow(() -> new ForbiddenException("Tài khoản của bạn chưa đăng ký hồ sơ Mentor"));

        // Kiểm tra Mentor ACTIVE (Rule 6 / Precondition 3)
        if (mentorProfile.getMentorStatus() != MentorStatus.ACTIVE) {
            log.warn("Mentor ID={} không ở trạng thái ACTIVE (hiện tại: {}) khi cố từ chối yêu cầu", mentorProfile.getId(), mentorProfile.getMentorStatus());
            throw new ForbiddenException("Hồ sơ Mentor của bạn không trong trạng thái hoạt động (ACTIVE) để phản hồi yêu cầu");
        }

        // Kiểm tra Mentor Subscription (Rule 6 / Precondition 4)
        if (!hasActiveSubscription(mentorProfile.getId())) {
            log.warn("Gói hoạt động của Mentor ID={} đã hết hạn hoặc chưa kích hoạt khi cố từ chối yêu cầu", mentorProfile.getId());
            throw new ForbiddenException("Gói hoạt động của Mentor đã hết hạn hoặc chưa được kích hoạt, bạn không thể phản hồi yêu cầu này");
        }

        MentoringRequest mentoringRequest = mentoringRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));

        MentoringRequestDistribution distribution = mentoringRequestDistributionRepository
                .findForUpdate(requestId, mentorProfile.getId())
                .orElseGet(() -> createPendingDistributionForOpenGeneralRequest(mentoringRequest, mentorProfile));

        // Kiểm tra trạng thái yêu cầu
        if (mentoringRequest.getStatus() != MentoringRequestStatus.OPEN || mentoringRequest.getSelectedMentor() != null) {
            log.warn("Yêu cầu ID={} không còn OPEN (hiện tại: {})", requestId, mentoringRequest.getStatus());
            throw new BadRequestException("Yêu cầu cố vấn này đã đóng hoặc không còn tiếp nhận phản hồi mới");
        }

        // Kiểm tra trạng thái phân phối hiện tại
        if (distribution.getStatus() == MentoringDistributionStatus.REJECTED) {
            throw new ConflictException("Bạn đã từ chối yêu cầu này trước đó, không thể phản hồi lại");
        }
        if (distribution.getStatus() == MentoringDistributionStatus.ACCEPTED) {
            throw new ConflictException("Bạn đã chấp nhận yêu cầu này trước đó, không thể thay đổi quyết định");
        }
        if (distribution.getStatus() == MentoringDistributionStatus.EXPIRED) {
            throw new BadRequestException("Yêu cầu phân phối đã quá hạn phản hồi");
        }
        if (distribution.getStatus() != MentoringDistributionStatus.PENDING) {
            throw new ConflictException("Yêu cầu này đã được xử lý phản hồi trước đó");
        }

        // Cập nhật trạng thái phân phối thành REJECTED (DECLINED, Rule 9)
        distribution.setStatus(MentoringDistributionStatus.REJECTED);
        distribution.setRespondedAt(Instant.now());
        if (requestDto != null && requestDto.getResponseNote() != null && !requestDto.getResponseNote().trim().isEmpty()) {
            distribution.setResponseNote(requestDto.getResponseNote().trim());
        }

        MentoringRequestDistribution savedDist = mentoringRequestDistributionRepository.save(distribution);
        notificationService.sendMentoringRequestResponseNotification(
                mentorUser, mentoringRequest.getStudent(), mentoringRequest, false);
        log.info("Mentor ID={} đã DECLINE thành công yêu cầu ID={}", mentorProfile.getId(), requestId);

        return mapToIncomingDetailResponse(savedDist, mentorProfile, true, true);
    }

    private boolean canMentorViewRequest(
            MentoringRequest request,
            MentoringRequestDistribution distribution,
            MentorProfile mentorProfile,
            boolean canBrowseOpenRequests) {
        if (request.getStudent() != null && mentorProfile.getUser() != null
                && request.getStudent().getId().equals(mentorProfile.getUser().getId())) {
            return false;
        }
        if (request.getRequestType() == MentoringRequestType.DIRECT) {
            return request.getTargetMentor() != null
                    && request.getTargetMentor().getId().equals(mentorProfile.getId());
        }
        return distribution != null
                || (canBrowseOpenRequests && request.getStatus() == MentoringRequestStatus.OPEN);
    }

    /**
     * GENERAL request chưa từng được phân phối vẫn có thể được Mentor đủ điều kiện phản hồi.
     * Request đã được khóa trước khi gọi hàm này nên việc tạo distribution là tuần tự và an toàn.
     */
    private MentoringRequestDistribution createPendingDistributionForOpenGeneralRequest(
            MentoringRequest request, MentorProfile mentorProfile) {
        if (request.getRequestType() != MentoringRequestType.GENERAL
                || request.getStatus() != MentoringRequestStatus.OPEN
                || request.getSelectedMentor() != null
                || (request.getStudent() != null && mentorProfile.getUser() != null
                    && request.getStudent().getId().equals(mentorProfile.getUser().getId()))) {
            throw new ForbiddenException("Bạn không có quyền phản hồi yêu cầu này");
        }

        MentoringRequestDistribution distribution = MentoringRequestDistribution.builder()
                .request(request)
                .mentorProfile(mentorProfile)
                .status(MentoringDistributionStatus.PENDING)
                .distributedAt(Instant.now())
                .build();
        return mentoringRequestDistributionRepository.saveAndFlush(distribution);
    }

    /**
     * Tiện ích kiểm tra tính hợp lệ của gói dịch vụ Mentor Subscription (ACTIVE hoặc PAID, còn hạn sử dụng).
     */
    private boolean hasActiveSubscription(Long mentorProfileId) {
        List<MentorSubscription> subscriptions = mentorSubscriptionRepository.findByMentorProfileIdOrderByCreatedAtDesc(mentorProfileId);
        Instant now = Instant.now();
        return subscriptions.stream()
                .anyMatch(sub -> (sub.getStatus() == MentorSubscriptionStatus.ACTIVE || sub.getStatus() == MentorSubscriptionStatus.PAID)
                        && sub.getEndDate() != null
                        && sub.getEndDate().isAfter(now));
    }

    /**
     * Tiện ích chuyển đổi một bản ghi distribution sang MentorIncomingRequestResponse (dành cho danh sách).
     */
    private MentorIncomingRequestResponse mapToIncomingResponse(
            MentoringRequest req,
            MentoringRequestDistribution dist,
            UserProfile studentProfile,
            MentorProfile mentorProfile,
            Set<Long> supportedIndustryIds) {
        User studentUser = req.getStudent();

        String name = studentProfile != null ? studentProfile.getFullName() : (studentUser != null ? studentUser.getEmail() : "Sinh viên");
        String avatar = studentProfile != null ? studentProfile.getAvatarUrl() : null;
        String headline = studentProfile != null ? studentProfile.getHeadline() : null;

        List<MentoringRequestAttachment> atts = mentoringRequestAttachmentRepository.findByRequestId(req.getId());

        return MentorIncomingRequestResponse.builder()
                .id(req.getId())
                .distributionId(dist != null ? dist.getId() : null)
                .sameIndustry(supportedIndustryIds.contains(req.getIndustry().getId()))
                .sameFormat(isSameFormat(mentorProfile, req))
                .requestType(req.getRequestType())
                .title(req.getTitle())
                .description(req.getDescription())
                .industryId(req.getIndustry().getId())
                .industryName(req.getIndustry().getName())
                .studentId(studentUser != null ? studentUser.getId() : null)
                .studentName(name)
                .studentAvatar(avatar)
                .studentHeadline(headline)
                .budgetMin(req.getBudgetMin())
                .budgetMax(req.getBudgetMax())
                .workingMode(req.getWorkingMode())
                .participationType(req.getParticipationType())
                .taskType(req.getTaskType())
                .expectedDeadline(req.getExpectedDeadline())
                .distributionStatus(dist != null ? dist.getStatus() : MentoringDistributionStatus.PENDING)
                .responseStatus(mapDistributionStatusToBusiness(dist != null ? dist.getStatus() : null))
                .responseNote(dist != null ? dist.getResponseNote() : null)
                .distributedAt(dist != null ? dist.getDistributedAt() : req.getCreatedAt())
                .respondedAt(dist != null ? dist.getRespondedAt() : null)
                .requestStatus(req.getStatus())
                .attachmentCount(atts != null ? atts.size() : 0)
                .createdAt(req.getCreatedAt())
                .build();
    }

    /**
     * Tiện ích chuyển đổi một bản ghi distribution sang MentorIncomingRequestDetailResponse (dành cho trang chi tiết).
     */
    private MentorIncomingRequestDetailResponse mapToIncomingDetailResponse(
            MentoringRequestDistribution dist,
            MentorProfile mentorProfile,
            boolean isMentorActive,
            boolean hasActiveSub) {

        return mapToIncomingDetailResponse(dist.getRequest(), dist, mentorProfile, isMentorActive, hasActiveSub);
    }

    private MentorIncomingRequestDetailResponse mapToIncomingDetailResponse(
            MentoringRequest req,
            MentoringRequestDistribution dist,
            MentorProfile mentorProfile,
            boolean isMentorActive,
            boolean hasActiveSub) {

        User studentUser = req.getStudent();
        UserProfile studentProfile = studentUser != null
                ? userProfileRepository.findById(studentUser.getId()).orElse(null)
                : null;

        String name = studentProfile != null ? studentProfile.getFullName() : (studentUser != null ? studentUser.getEmail() : "Sinh viên");
        String avatar = studentProfile != null ? studentProfile.getAvatarUrl() : null;
        String headline = studentProfile != null ? studentProfile.getHeadline() : null;
        String email = studentUser != null ? studentUser.getEmail() : null;

        List<MentoringRequestAttachment> atts = mentoringRequestAttachmentRepository.findByRequestId(req.getId());
        List<MentoringAttachmentResponse> attResponses = atts.stream()
                .map(a -> MentoringAttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .fileUrl(a.getFileUrl())
                        .fileSize(a.getFileSize())
                        .fileType(a.getFileType())
                        .createdAt(a.getCreatedAt())
                        .build())
                .toList();

        boolean canRespond = isMentorActive
                && hasActiveSub
                && req.getStatus() == MentoringRequestStatus.OPEN
                && req.getSelectedMentor() == null
                && (dist == null || dist.getStatus() == MentoringDistributionStatus.PENDING);

        Long mentorUserId = mentorProfile.getUser() != null ? mentorProfile.getUser().getId() : null;
        Long conversationId = mentorUserId != null
                ? mentoringConversationService.findConversation(req.getId(), mentorUserId).map(Conversation::getId).orElse(null)
                : null;
        boolean canMessage = dist != null
                && dist.getStatus() == MentoringDistributionStatus.ACCEPTED
                && conversationId != null;
        boolean isSelectedMentor = req.getSelectedMentor() != null && req.getSelectedMentor().getId().equals(mentorUserId);
        boolean otherMentorSelected = req.getSelectedMentor() != null && !isSelectedMentor;

        return MentorIncomingRequestDetailResponse.builder()
                .id(req.getId())
                .distributionId(dist != null ? dist.getId() : null)
                .sameIndustry(mentorSupportedFieldRepository.existsByMentorProfileIdAndIndustryId(
                        mentorProfile.getId(), req.getIndustry().getId()))
                .sameFormat(isSameFormat(mentorProfile, req))
                .requestType(req.getRequestType())
                .title(req.getTitle())
                .description(req.getDescription())
                .industryId(req.getIndustry().getId())
                .industryName(req.getIndustry().getName())
                .studentId(studentUser != null ? studentUser.getId() : null)
                .studentName(name)
                .studentAvatar(avatar)
                .studentHeadline(headline)
                .studentEmail(email)
                .budgetMin(req.getBudgetMin())
                .budgetMax(req.getBudgetMax())
                .workingMode(req.getWorkingMode())
                .participationType(req.getParticipationType())
                .taskType(req.getTaskType())
                .expectedDeadline(req.getExpectedDeadline())
                .requestStatus(req.getStatus())
                .attachments(attResponses)
                .distributionStatus(dist != null ? dist.getStatus() : MentoringDistributionStatus.PENDING)
                .responseStatus(mapDistributionStatusToBusiness(dist != null ? dist.getStatus() : null))
                .responseNote(dist != null ? dist.getResponseNote() : null)
                .distributedAt(dist != null ? dist.getDistributedAt() : req.getCreatedAt())
                .respondedAt(dist != null ? dist.getRespondedAt() : null)
                .canRespond(canRespond)
                .canMessage(canMessage)
                .conversationId(conversationId)
                .selectedMentor(isSelectedMentor)
                .otherMentorSelected(otherMentorSelected)
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }

    private boolean isSameFormat(MentorProfile mentorProfile, MentoringRequest request) {
        return isWorkingModeCompatible(mentorProfile.getWorkingMode(), request.getWorkingMode())
                && isParticipationTypeCompatible(mentorProfile.getMentoringType(), request.getParticipationType());
    }

    private boolean isWorkingModeCompatible(MentoringWorkingMode mentorMode, MentoringWorkingMode requestMode) {
        return mentorMode == null || requestMode == null
                || mentorMode == MentoringWorkingMode.BOTH
                || requestMode == MentoringWorkingMode.BOTH
                || mentorMode == requestMode;
    }

    private boolean isParticipationTypeCompatible(MentoringType mentorType, MentoringType requestType) {
        return mentorType == null || requestType == null
                || mentorType == MentoringType.BOTH
                || requestType == MentoringType.BOTH
                || mentorType == requestType;
    }
}
