package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.MentoringRequestStatus;
import com.alumnect.alumnect_backend.config.MentoringProperties;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestAttachmentRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringRequestRepository;
import com.alumnect.alumnect_backend.dao.mentorship.UserTermsAcceptanceRepository;
import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentoringAttachmentRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.CreateMentoringRequestResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringAttachmentResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequestAttachment;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.user.User;
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
 * Lớp triển khai dịch vụ nghiệp vụ cho Mentoring Request (UC100).
 * Quản lý xác thực sinh viên, kiểm tra điều khoản, lưu trữ yêu cầu và điều phối matching Mentor.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MentoringRequestServiceImpl implements MentoringRequestService {

    /** Giới hạn kích thước tệp đính kèm: 10 MB = 10 * 1024 * 1024 bytes */
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024L * 1024L;

    private final UserRepository userRepository;
    private final IndustryRepository industryRepository;
    private final UserTermsAcceptanceRepository userTermsAcceptanceRepository;
    private final MentoringRequestRepository mentoringRequestRepository;
    private final MentoringRequestAttachmentRepository mentoringRequestAttachmentRepository;
    private final MentorMatchingService mentorMatchingService;
    private final MentoringProperties mentoringProperties;

    /**
     * Tạo mới một yêu cầu Mentoring chung theo UC100.
     * Quy trình xử lý chi tiết:
     * 1. Xác thực sinh viên từ email trong Security Context.
     * 2. Kiểm tra vai trò tài khoản: Bắt buộc là STUDENT.
     * 3. Kiểm tra trạng thái tài khoản: Bắt buộc là ACTIVE.
     * 4. Kiểm tra chấp nhận điều khoản Mentoring (UC90 / BR-02).
     * 5. Kiểm tra ngành nghề/lĩnh vực tồn tại trong cơ sở dữ liệu.
     * 6. Kiểm tra tính hợp lệ của khoảng ngân sách: budgetMax >= budgetMin >= 0 (BR-06).
     * 7. Kiểm tra thời hạn mong muốn: Phải ở trong tương lai (nếu có).
     * 8. Kiểm tra và validate danh sách file đính kèm: < 10 MB mỗi file (BR-07).
     * 9. Lưu yêu cầu Mentoring và các tệp đính kèm vào cơ sở dữ liệu trong Transaction.
     * 10. Kích hoạt Internal Matching tìm kiếm Mentor ACTIVE có Supported Field tương thích.
     * 11. Phân phối yêu cầu tới các Mentor phù hợp (BR-10).
     * 12. Nếu không tìm thấy Mentor nào: Request vẫn được lưu bền vững (BR-05), trả thông báo giải thích.
     * 13. Đóng gói kết quả và trả về cho Client.
     *
     * @param userEmail Email của sinh viên đăng nhập
     * @param request DTO chứa thông tin tạo yêu cầu
     * @return DTO kết quả tạo yêu cầu kèm thông tin phân phối
     */
    @Override
    @Transactional
    public CreateMentoringRequestResponse createMentoringRequest(String userEmail, CreateMentoringRequestRequest request) {
        log.info("Bắt đầu xử lý tạo yêu cầu Mentoring chung cho user: {}", userEmail);

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

        // 9. Lưu yêu cầu Mentoring vào cơ sở dữ liệu
        MentoringRequest mentoringRequest = MentoringRequest.builder()
                .student(student)
                .industry(industry)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .budgetMin(request.getBudgetMin())
                .budgetMax(request.getBudgetMax())
                .workingMode(request.getWorkingMode())
                .participationType(request.getParticipationType())
                .taskType(request.getTaskType())
                .expectedDeadline(request.getExpectedDeadline())
                .status(MentoringRequestStatus.OPEN)
                .matchedCount(0)
                .build();

        MentoringRequest savedRequest = mentoringRequestRepository.save(mentoringRequest);
        log.info("Lưu thành công MentoringRequest với ID={}", savedRequest.getId());

        // 10. Lưu các tệp đính kèm (nếu có)
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

        // 11. Kích hoạt Internal Matching và phân phối tới các Mentor phù hợp
        List<MentorProfile> matchingMentors = mentorMatchingService.findMatchingMentors(
                industry.getId(),
                request.getWorkingMode(),
                request.getParticipationType()
        );

        int distributedCount = mentorMatchingService.distributeRequestToMentors(savedRequest, matchingMentors);
        savedRequest.setMatchedCount(distributedCount);
        mentoringRequestRepository.save(savedRequest);

        // 12. Xây dựng ghi chú phân phối minh bạch cho người dùng (BR-05)
        String distributionNote;
        if (distributedCount > 0) {
            distributionNote = "Đã tự động tìm kiếm và phân phối yêu cầu của bạn tới " + distributedCount + " Mentor phù hợp trong mạng lưới.";
        } else {
            distributionNote = "Hiện tại chưa tìm thấy Mentor phù hợp. Yêu cầu của bạn đã được ghi nhận vào hệ thống và sẽ sẵn sàng phân phối khi có Mentor mới tham gia.";
        }

        log.info("Hoàn tất tạo yêu cầu Mentoring ID={}: matchedCount={}, note={}",
                savedRequest.getId(), distributedCount, distributionNote);

        // 13. Đóng gói kết quả trả về
        return CreateMentoringRequestResponse.builder()
                .id(savedRequest.getId())
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
                .matchedCount(distributedCount)
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
     * Tiện ích chuyển đổi Entity MentoringRequest sang Response DTO.
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

        String distributionNote;
        if (entity.getMatchedCount() > 0) {
            distributionNote = "Đã tự động phân phối yêu cầu tới " + entity.getMatchedCount() + " Mentor phù hợp trong mạng lưới.";
        } else {
            distributionNote = "Hiện tại chưa tìm thấy Mentor phù hợp. Yêu cầu của bạn đã được ghi nhận vào hệ thống và sẽ sẵn sàng phân phối khi có Mentor mới.";
        }

        return CreateMentoringRequestResponse.builder()
                .id(entity.getId())
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
