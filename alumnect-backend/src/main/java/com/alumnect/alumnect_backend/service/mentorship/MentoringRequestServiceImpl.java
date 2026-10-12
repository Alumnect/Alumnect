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
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.alumnect.alumnect_backend.dto.response.mentorship.MentorResponseItemResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringRequestDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringResponseSummaryResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
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

        if (!mentoringRequest.getStudent().getId().equals(student.getId())) {
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

        if (!mentoringRequest.getStudent().getId().equals(student.getId())) {
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
            distributionNote = "Đã tự động phân phối yêu cầu tới " + summary.getTotalDistributed() + " Mentor phù hợp trong mạng lưới.";
        } else {
            distributionNote = "Hiện tại chưa tìm thấy Mentor phù hợp. Yêu cầu của bạn đã được ghi nhận vào hệ thống và sẽ sẵn sàng phân phối khi có Mentor mới.";
        }

        return MentoringRequestDetailResponse.builder()
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
                .createdAt(entity.getCreatedAt())
                .build();
    }

    /**
     * Tiện ích chuyển đổi một bản ghi distribution sang MentorResponseItemResponse.
     */
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
        boolean canMessage = dist.getStatus() == MentoringDistributionStatus.ACCEPTED;

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
    public PageResponse<MentorIncomingRequestResponse> getIncomingRequests(String mentorEmail, String status, String requestType, int page, int size) {
        log.info("Lấy danh sách incoming requests cho mentor: {}, status={}, requestType={}, page={}, size={}",
                mentorEmail, status, requestType, page, size);

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

        Pageable pageable = PageRequest.of(page, size);
        Page<MentoringRequestDistribution> pageResult = mentoringRequestDistributionRepository.findIncomingRequests(
                mentorProfile.getId(), distStatus, reqType, pageable);

        List<MentoringRequestDistribution> distributions = pageResult.getContent();
        List<Long> studentUserIds = distributions.stream()
                .map(d -> d.getRequest().getStudent().getId())
                .distinct()
                .toList();

        Map<Long, UserProfile> userProfileMap = studentUserIds.isEmpty()
                ? Collections.emptyMap()
                : userProfileRepository.findAllById(studentUserIds).stream()
                        .collect(Collectors.toMap(UserProfile::getUserId, p -> p));

        List<MentorIncomingRequestResponse> content = distributions.stream()
                .map(d -> mapToIncomingResponse(d, userProfileMap.get(d.getRequest().getStudent().getId())))
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

        // Kiểm tra yêu cầu có tồn tại hay không
        mentoringRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));

        // Kiểm tra phân phối: Mentor chỉ xem được yêu cầu thực sự được phân phối/gửi đến mình (Rule 1 & Rule 3)
        MentoringRequestDistribution distribution = mentoringRequestDistributionRepository.findByRequestIdAndMentorProfileId(requestId, mentorProfile.getId())
                .orElseThrow(() -> {
                    log.warn("Truy cập trái phép: Mentor ID={} cố xem yêu cầu ID={} không được phân phối cho mình", mentorProfile.getId(), requestId);
                    return new ForbiddenException("Bạn không có quyền truy cập hoặc yêu cầu này không được phân phối tới bạn");
                });

        boolean isMentorActive = mentorProfile.getMentorStatus() == MentorStatus.ACTIVE;
        boolean hasValidSub = hasActiveSubscription(mentorProfile.getId());

        return mapToIncomingDetailResponse(distribution, mentorProfile, isMentorActive, hasValidSub);
    }

    /**
     * Mentor chấp nhận (ACCEPT) yêu cầu Mentoring được phân phối hoặc gửi trực tiếp tới mình (UC103).
     * - Xác thực Mentor ACTIVE và Subscription còn hiệu lực.
     * - Kiểm tra Request OPEN và bản ghi phân phối đang PENDING (WAITING).
     * - Cập nhật trạng thái phân phối thành ACCEPTED và lưu thời điểm phản hồi (respondedAt).
     * - Không tự động tạo Deal, không trừ phí, không đóng yêu cầu (Rule 4 & Rule 5).
     *
     * @param mentorEmail Email của Mentor đang đăng nhập
     * @param requestId ID của yêu cầu Mentoring
     * @param requestDto DTO chứa lời nhắn phản hồi tùy chọn
     * @return DTO chi tiết yêu cầu sau khi chấp nhận
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

        MentoringRequest mentoringRequest = mentoringRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));

        MentoringRequestDistribution distribution = mentoringRequestDistributionRepository.findByRequestIdAndMentorProfileId(requestId, mentorProfile.getId())
                .orElseThrow(() -> new ForbiddenException("Bạn không có quyền truy cập hoặc yêu cầu này không được phân phối tới bạn"));

        // Kiểm tra trạng thái yêu cầu: Chỉ cho phép phản hồi khi request OPEN (Rule 7)
        if (mentoringRequest.getStatus() != MentoringRequestStatus.OPEN) {
            log.warn("Yêu cầu ID={} không còn OPEN (hiện tại: {})", requestId, mentoringRequest.getStatus());
            throw new BadRequestException("Yêu cầu cố vấn này đã đóng hoặc không còn tiếp nhận phản hồi mới");
        }

        // Kiểm tra trạng thái phân phối hiện tại: Không cho phản hồi trùng lặp (Rule 8 / Concurrency)
        if (distribution.getStatus() == MentoringDistributionStatus.ACCEPTED) {
            throw new ConflictException("Bạn đã chấp nhận yêu cầu này trước đó, không thể phản hồi lại");
        }
        if (distribution.getStatus() == MentoringDistributionStatus.REJECTED) {
            throw new ConflictException("Bạn đã từ chối yêu cầu này trước đó, không thể phản hồi lại");
        }
        if (distribution.getStatus() == MentoringDistributionStatus.EXPIRED) {
            throw new BadRequestException("Yêu cầu phân phối đã quá hạn phản hồi");
        }
        if (distribution.getStatus() != MentoringDistributionStatus.PENDING) {
            throw new ConflictException("Yêu cầu này đã được xử lý phản hồi trước đó");
        }

        // Cập nhật trạng thái phân phối thành ACCEPTED (Atomic update, Rule 9)
        distribution.setStatus(MentoringDistributionStatus.ACCEPTED);
        distribution.setRespondedAt(Instant.now());
        if (requestDto != null && requestDto.getResponseNote() != null && !requestDto.getResponseNote().trim().isEmpty()) {
            distribution.setResponseNote(requestDto.getResponseNote().trim());
        }

        MentoringRequestDistribution savedDist = mentoringRequestDistributionRepository.save(distribution);
        log.info("Mentor ID={} đã ACCEPT thành công yêu cầu ID={}. Lưu ý: KHÔNG tự động tạo Deal theo Rule 4", mentorProfile.getId(), requestId);

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

        MentoringRequest mentoringRequest = mentoringRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu cố vấn với ID: " + requestId));

        MentoringRequestDistribution distribution = mentoringRequestDistributionRepository.findByRequestIdAndMentorProfileId(requestId, mentorProfile.getId())
                .orElseThrow(() -> new ForbiddenException("Bạn không có quyền truy cập hoặc yêu cầu này không được phân phối tới bạn"));

        // Kiểm tra trạng thái yêu cầu
        if (mentoringRequest.getStatus() != MentoringRequestStatus.OPEN) {
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
        log.info("Mentor ID={} đã DECLINE thành công yêu cầu ID={}", mentorProfile.getId(), requestId);

        return mapToIncomingDetailResponse(savedDist, mentorProfile, true, true);
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
    private MentorIncomingRequestResponse mapToIncomingResponse(MentoringRequestDistribution dist, UserProfile studentProfile) {
        MentoringRequest req = dist.getRequest();
        User studentUser = req.getStudent();

        String name = studentProfile != null ? studentProfile.getFullName() : (studentUser != null ? studentUser.getEmail() : "Sinh viên");
        String avatar = studentProfile != null ? studentProfile.getAvatarUrl() : null;
        String headline = studentProfile != null ? studentProfile.getHeadline() : null;

        List<MentoringRequestAttachment> atts = mentoringRequestAttachmentRepository.findByRequestId(req.getId());

        return MentorIncomingRequestResponse.builder()
                .id(req.getId())
                .distributionId(dist.getId())
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
                .distributionStatus(dist.getStatus())
                .responseStatus(mapDistributionStatusToBusiness(dist.getStatus()))
                .responseNote(dist.getResponseNote())
                .distributedAt(dist.getDistributedAt())
                .respondedAt(dist.getRespondedAt())
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

        MentoringRequest req = dist.getRequest();
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
                && dist.getStatus() == MentoringDistributionStatus.PENDING;

        boolean canMessage = dist.getStatus() == MentoringDistributionStatus.ACCEPTED;

        return MentorIncomingRequestDetailResponse.builder()
                .id(req.getId())
                .distributionId(dist.getId())
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
                .distributionStatus(dist.getStatus())
                .responseStatus(mapDistributionStatusToBusiness(dist.getStatus()))
                .responseNote(dist.getResponseNote())
                .distributedAt(dist.getDistributedAt())
                .respondedAt(dist.getRespondedAt())
                .canRespond(canRespond)
                .canMessage(canMessage)
                .createdAt(req.getCreatedAt())
                .updatedAt(req.getUpdatedAt())
                .build();
    }
}
