package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentorStatus;
import com.alumnect.alumnect_backend.common.enums.MentorSubscriptionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringDistributionStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestType;
import com.alumnect.alumnect_backend.config.MentoringProperties;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSubscriptionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentorSupportedFieldRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestAttachmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestDistributionRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
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
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

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
                .build();

        MentoringRequest savedRequest = mentoringRequestRepository.save(mentoringRequest);
        log.info("Lưu thành công MentoringRequest với ID={}, requestType={}", savedRequest.getId(), savedRequest.getRequestType());

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
            matchedCount = 1;

            UserProfile mentorUserProfile = userProfileRepository.findById(targetMentor.getUser().getId()).orElse(null);
            targetMentorName = mentorUserProfile != null ? mentorUserProfile.getFullName() : targetMentor.getUser().getEmail();
            targetMentorAvatar = mentorUserProfile != null ? mentorUserProfile.getAvatarUrl() : null;
            targetMentorHeadline = mentorUserProfile != null ? mentorUserProfile.getHeadline() : null;

            distributionNote = "Yêu cầu cố vấn của bạn đã được gửi trực tiếp tới Mentor " + targetMentorName + ". Vui lòng chờ Mentor phản hồi.";
            log.info("Đã gửi trực tiếp yêu cầu Mentoring ID={} tới Mentor ID={}", savedRequest.getId(), targetMentor.getId());
        } else {
            // UC100: Kích hoạt Internal Matching và phân phối tự động tới các Mentor phù hợp
            List<MentorProfile> matchingMentors = mentorMatchingService.findMatchingMentors(
                    industry.getId(),
                    request.getWorkingMode(),
                    request.getParticipationType()
            );

            matchedCount = mentorMatchingService.distributeRequestToMentors(savedRequest, matchingMentors);
            savedRequest.setMatchedCount(matchedCount);
            mentoringRequestRepository.save(savedRequest);

            if (matchedCount > 0) {
                distributionNote = "Đã tự động tìm kiếm và phân phối yêu cầu của bạn tới " + matchedCount + " Mentor phù hợp trong mạng lưới.";
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
                .createdAt(savedRequest.getCreatedAt())
                .build();
    }

    /**
     * Lấy danh sách các yêu cầu Mentoring của sinh viên đang đăng nhập (phân trang).
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param page Số thứ tự trang
     * @param size Số bản ghi mỗi trang
     * @return Danh sách phân trang các yêu cầu
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<CreateMentoringRequestResponse> getMyRequests(String userEmail, int page, int size) {
        User student = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + userEmail));

        Pageable pageable = PageRequest.of(page, size);
        Page<MentoringRequest> pageResult = mentoringRequestRepository.findByStudentIdOrderByCreatedAtDesc(student.getId(), pageable);

        List<CreateMentoringRequestResponse> content = pageResult.getContent().stream()
                .map(this::mapToResponse)
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

        MentoringRequest mentoringRequest = mentoringRequestRepository.findByIdAndStudentId(requestId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));

        return mapToResponse(mentoringRequest);
    }

    /**
     * Tiện ích chuyển đổi Entity MentoringRequest sang Response DTO (hỗ trợ cả GENERAL và DIRECT).
     */
    private CreateMentoringRequestResponse mapToResponse(MentoringRequest entity) {
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

        String distributionNote;
        if (reqType == MentoringRequestType.DIRECT) {
            distributionNote = "Yêu cầu cố vấn của bạn đã được gửi trực tiếp tới Mentor " + (targetMentorName != null ? targetMentorName : "") + ". Vui lòng chờ Mentor phản hồi.";
        } else if (entity.getMatchedCount() > 0) {
            distributionNote = "Đã tự động phân phối yêu cầu tới " + entity.getMatchedCount() + " Mentor phù hợp trong mạng lưới.";
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
                .matchedCount(entity.getMatchedCount())
                .distributionNote(distributionNote)
                .attachments(attResponses)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
