package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringDealStatus;
import com.alumnect.alumnect_backend.common.enums.MessageType;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDealRepository;
import com.alumnect.alumnect_backend.dao.mentorship.MentoringDealSnapshotRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationParticipantRepository;
import com.alumnect.alumnect_backend.dao.message.ConversationRepository;
import com.alumnect.alumnect_backend.dao.message.MessageRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.mentorship.ProposeDealRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.UpdateDealRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealSnapshotResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDealSnapshot;
import com.alumnect.alumnect_backend.entity.message.Conversation;
import com.alumnect.alumnect_backend.entity.message.ConversationParticipant;
import com.alumnect.alumnect_backend.entity.message.Message;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentoringDealMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Lớp cài đặt nghiệp vụ quản lý thỏa thuận và xác nhận Mentoring Deal (UC104).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MentoringDealServiceImpl implements MentoringDealService {

    private final MentoringDealRepository dealRepository;
    private final MentoringDealSnapshotRepository snapshotRepository;
    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final MentoringDealMapper dealMapper;

    /**
     * Khởi tạo đề xuất thỏa thuận Mentoring Deal mới giữa Student và Mentor.
     *
     * @param currentUserId ID người dùng thực hiện thao tác (Student hoặc Mentor)
     * @param request DTO chứa các điều khoản đề xuất ban đầu
     * @return DTO thông tin Deal vừa được khởi tạo
     */
    @Override
    @Transactional
    public MentoringDealResponse proposeDeal(Long currentUserId, ProposeDealRequest request) {
        log.info("Bắt đầu khởi tạo đề xuất Deal bởi userId={}: mentorId={}, studentId={}",
                currentUserId, request.getMentorId(), request.getStudentId());

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng đang thao tác."));

        Long targetStudentId = request.getStudentId();
        Long targetMentorId = request.getMentorId();

        // Xác định vai trò của người khởi tạo
        boolean isCurrentMentor = currentUserId.equals(targetMentorId);
        if (isCurrentMentor) {
            if (targetStudentId == null) {
                throw new BadRequestException("Cố vấn đề xuất thỏa thuận bắt buộc phải chỉ định ID của Học viên (Student).");
            }
        } else {
            // Người khởi tạo là Học viên
            targetStudentId = currentUserId;
        }

        if (Objects.equals(targetStudentId, targetMentorId)) {
            throw new BadRequestException("Không thể tự đề xuất thỏa thuận cố vấn với chính bản thân mình.");
        }

        final Long finalStudentId = targetStudentId;
        User student = userRepository.findById(finalStudentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin Học viên (ID: " + finalStudentId + ")."));

        User mentor = userRepository.findById(targetMentorId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin Cố vấn (ID: " + targetMentorId + ")."));

        // Kiểm tra tư cách Cố vấn (Mentor)
        boolean hasMentorProfile = mentorProfileRepository.findByUserId(targetMentorId).isPresent();
        if (!hasMentorProfile) {
            throw new BadRequestException("Người dùng (ID: " + targetMentorId + ") chưa đăng ký hồ sơ Cố vấn (Mentor) hợp lệ.");
        }

        // Kiểm tra và liên kết cuộc hội thoại Direct Messaging giữa hai bên
        Conversation conversation = null;
        if (request.getConversationId() != null) {
            conversation = conversationRepository.findById(request.getConversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy cuộc trò chuyện chỉ định (ID: " + request.getConversationId() + ")."));

            boolean isStudentInConv = participantRepository.existsByConversationIdAndUserId(conversation.getId(), targetStudentId);
            boolean isMentorInConv = participantRepository.existsByConversationIdAndUserId(conversation.getId(), targetMentorId);
            if (!isStudentInConv || !isMentorInConv) {
                throw new BadRequestException("Cuộc trò chuyện chỉ định không thuộc về cả Học viên và Cố vấn này.");
            }
        } else {
            // Tự động tìm cuộc trò chuyện 1-1 giữa Student và Mentor nếu có
            conversation = conversationRepository.findDirectConversationBetween(targetStudentId, targetMentorId).orElse(null);
        }

        // Khởi tạo thực thể MentoringDeal
        Instant now = Instant.now();
        MentoringDeal deal = MentoringDeal.builder()
                .student(student)
                .mentor(mentor)
                .conversation(conversation)
                .taskScope(request.getTaskScope().trim())
                .agreedPrice(request.getAgreedPrice())
                .deadline(request.getDeadline())
                .workingMode(request.getWorkingMode())
                .participationType(request.getParticipationType())
                .taskType(request.getTaskType())
                .expectedResult(request.getExpectedResult().trim())
                .version(1)
                .isLocked(false)
                .createdBy(currentUser)
                .updatedBy(currentUser)
                .createdAt(now)
                .updatedAt(now)
                .build();

        // Ghi nhận xác nhận từ phía bên chủ động khởi tạo
        if (isCurrentMentor) {
            deal.setMentorConfirmed(true);
            deal.setMentorConfirmedAt(now);
            deal.setStudentConfirmed(false);
            deal.setStatus(MentoringDealStatus.MENTOR_CONFIRMED);
        } else {
            deal.setStudentConfirmed(true);
            deal.setStudentConfirmedAt(now);
            deal.setMentorConfirmed(false);
            deal.setStatus(MentoringDealStatus.STUDENT_CONFIRMED);
        }

        MentoringDeal savedDeal = dealRepository.save(deal);

        // Tạo bản ghi Snapshot phiên bản 1 đầu tiên
        String initialNote = request.getChangeNote() != null && !request.getChangeNote().isBlank()
                ? request.getChangeNote().trim()
                : (isCurrentMentor ? "Cố vấn khởi tạo đề xuất thỏa thuận" : "Học viên khởi tạo đề xuất thỏa thuận");

        MentoringDealSnapshot snapshot = MentoringDealSnapshot.builder()
                .deal(savedDeal)
                .version(1)
                .taskScope(savedDeal.getTaskScope())
                .agreedPrice(savedDeal.getAgreedPrice())
                .deadline(savedDeal.getDeadline())
                .workingMode(savedDeal.getWorkingMode())
                .participationType(savedDeal.getParticipationType())
                .taskType(savedDeal.getTaskType())
                .expectedResult(savedDeal.getExpectedResult())
                .modifiedBy(currentUser)
                .changeNote(initialNote)
                .createdAt(now)
                .build();

        snapshotRepository.save(snapshot);

        // Gửi tin nhắn thông báo vào Direct Messaging nếu cuộc hội thoại tồn tại
        sendDealSystemMessage(conversation, currentUser,
                String.format("[HỆ THỐNG] %s đã gửi đề xuất Thỏa thuận cố vấn mới (Deal #%d, Phiên bản 1). Vui lòng xem và xác nhận.",
                        getUserDisplayName(currentUser), savedDeal.getId()));

        log.info("Khởi tạo thành công Mentoring Deal id={} phiên bản 1", savedDeal.getId());
        return enrichResponse(dealMapper.toResponse(savedDeal), savedDeal, currentUserId);
    }

    /**
     * Điều chỉnh các điều khoản của Deal (Task Scope, Price, Deadline, Working Mode...).
     * Tự động sinh ra phiên bản Snapshot mới và yêu cầu bên còn lại xác nhận lại.
     *
     * @param currentUserId ID người dùng thực hiện điều chỉnh
     * @param dealId ID của thỏa thuận Deal cần điều chỉnh
     * @param request DTO chứa các điều khoản mới cập nhật
     * @return DTO thông tin Deal sau khi cập nhật
     */
    @Override
    @Transactional
    public MentoringDealResponse updateDealTerms(Long currentUserId, Long dealId, UpdateDealRequest request) {
        log.info("Cập nhật điều khoản Deal id={} bởi userId={}", dealId, currentUserId);

        MentoringDeal deal = dealRepository.findDetailById(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thỏa thuận Deal (ID: " + dealId + ")."));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng đang thao tác."));

        // Kiểm tra quyền hạn tham gia
        boolean isStudent = deal.getStudent().getId().equals(currentUserId);
        boolean isMentor = deal.getMentor().getId().equals(currentUserId);
        if (!isStudent && !isMentor) {
            throw new ForbiddenException("Bạn không có quyền chỉnh sửa thỏa thuận này.");
        }

        // Kiểm tra trạng thái khóa bất biến (sau khi cả hai confirm)
        if (Boolean.TRUE.equals(deal.getIsLocked()) || deal.getStatus() == MentoringDealStatus.DEAL_CONFIRMED) {
            throw new ConflictException("Thỏa thuận đã được hai bên xác nhận và khóa, không thể chỉnh sửa điều khoản.");
        }

        if (deal.getStatus() == MentoringDealStatus.CANCELLED) {
            throw new BadRequestException("Thỏa thuận đã bị hủy bỏ, không thể chỉnh sửa điều khoản.");
        }

        // Tăng phiên bản thỏa thuận
        int nextVersion = deal.getVersion() + 1;
        Instant now = Instant.now();

        deal.setTaskScope(request.getTaskScope().trim());
        deal.setAgreedPrice(request.getAgreedPrice());
        deal.setDeadline(request.getDeadline());
        deal.setWorkingMode(request.getWorkingMode());
        deal.setParticipationType(request.getParticipationType());
        deal.setTaskType(request.getTaskType());
        deal.setExpectedResult(request.getExpectedResult().trim());
        deal.setVersion(nextVersion);
        deal.setUpdatedBy(currentUser);
        deal.setUpdatedAt(now);

        // Quy tắc: Bên vừa chỉnh sửa được ghi nhận xác nhận phiên bản mới, bên còn lại bị reset xác nhận
        if (isStudent) {
            deal.setStudentConfirmed(true);
            deal.setStudentConfirmedAt(now);
            deal.setMentorConfirmed(false);
            deal.setMentorConfirmedAt(null);
            deal.setStatus(MentoringDealStatus.STUDENT_CONFIRMED);
        } else {
            deal.setMentorConfirmed(true);
            deal.setMentorConfirmedAt(now);
            deal.setStudentConfirmed(false);
            deal.setStudentConfirmedAt(null);
            deal.setStatus(MentoringDealStatus.MENTOR_CONFIRMED);
        }

        MentoringDeal updatedDeal = dealRepository.save(deal);

        // Lưu Snapshot mới tương ứng với phiên bản
        String changeNote = request.getChangeNote() != null && !request.getChangeNote().isBlank()
                ? request.getChangeNote().trim()
                : String.format("Điều chỉnh điều khoản sang Phiên bản %d", nextVersion);

        MentoringDealSnapshot snapshot = MentoringDealSnapshot.builder()
                .deal(updatedDeal)
                .version(nextVersion)
                .taskScope(updatedDeal.getTaskScope())
                .agreedPrice(updatedDeal.getAgreedPrice())
                .deadline(updatedDeal.getDeadline())
                .workingMode(updatedDeal.getWorkingMode())
                .participationType(updatedDeal.getParticipationType())
                .taskType(updatedDeal.getTaskType())
                .expectedResult(updatedDeal.getExpectedResult())
                .modifiedBy(currentUser)
                .changeNote(changeNote)
                .createdAt(now)
                .build();

        snapshotRepository.save(snapshot);

        // Gửi thông báo trong tin nhắn trực tiếp
        sendDealSystemMessage(updatedDeal.getConversation(), currentUser,
                String.format("[HỆ THỐNG] %s đã điều chỉnh điều khoản Thỏa thuận (Deal #%d, Phiên bản %d). Vui lòng xem và xác nhận lại.",
                        getUserDisplayName(currentUser), updatedDeal.getId(), nextVersion));

        log.info("Cập nhật thành công Mentoring Deal id={} lên phiên bản {}", updatedDeal.getId(), nextVersion);
        return enrichResponse(dealMapper.toResponse(updatedDeal), updatedDeal, currentUserId);
    }

    /**
     * Xác nhận thỏa thuận Deal Snapshot hiện tại từ một bên (Student hoặc Mentor).
     * Khi cả hai bên đều xác nhận, hệ thống tự động khóa Snapshot và chuyển Deal sang DEAL_CONFIRMED.
     *
     * @param currentUserId ID người dùng thực hiện xác nhận
     * @param dealId ID của thỏa thuận Deal
     * @return DTO thông tin Deal với trạng thái xác nhận mới nhất
     */
    @Override
    @Transactional
    public MentoringDealResponse confirmDeal(Long currentUserId, Long dealId) {
        log.info("Xác nhận Deal id={} bởi userId={}", dealId, currentUserId);

        MentoringDeal deal = dealRepository.findDetailById(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thỏa thuận Deal (ID: " + dealId + ")."));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng đang thao tác."));

        boolean isStudent = deal.getStudent().getId().equals(currentUserId);
        boolean isMentor = deal.getMentor().getId().equals(currentUserId);
        if (!isStudent && !isMentor) {
            throw new ForbiddenException("Bạn không phải là thành viên tham gia thỏa thuận này.");
        }

        if (Boolean.TRUE.equals(deal.getIsLocked()) || deal.getStatus() == MentoringDealStatus.DEAL_CONFIRMED) {
            throw new ConflictException("Thỏa thuận này đã được cả hai bên xác nhận và khóa trước đó.");
        }

        if (deal.getStatus() == MentoringDealStatus.CANCELLED) {
            throw new BadRequestException("Thỏa thuận đã bị hủy bỏ, không thể xác nhận.");
        }

        Instant now = Instant.now();
        if (isStudent) {
            if (Boolean.TRUE.equals(deal.getStudentConfirmed())) {
                throw new BadRequestException("Bạn đã xác nhận phiên bản thỏa thuận này rồi.");
            }
            deal.setStudentConfirmed(true);
            deal.setStudentConfirmedAt(now);
        } else {
            if (Boolean.TRUE.equals(deal.getMentorConfirmed())) {
                throw new BadRequestException("Bạn đã xác nhận phiên bản thỏa thuận này rồi.");
            }
            deal.setMentorConfirmed(true);
            deal.setMentorConfirmedAt(now);
        }

        deal.setUpdatedBy(currentUser);
        deal.setUpdatedAt(now);

        // Kiểm tra xem cả hai bên đã cùng xác nhận hay chưa
        if (Boolean.TRUE.equals(deal.getStudentConfirmed()) && Boolean.TRUE.equals(deal.getMentorConfirmed())) {
            deal.setStatus(MentoringDealStatus.DEAL_CONFIRMED);
            deal.setIsLocked(true);
            deal.setLockedAt(now);

            sendDealSystemMessage(deal.getConversation(), currentUser,
                    String.format("[HỆ THỐNG] Thỏa thuận Mentoring Deal #%d (Phiên bản %d) đã được CẢ HAI BÊN XÁC NHẬN! Snapshot điều khoản đã được khóa và sẵn sàng cho thanh toán.",
                            deal.getId(), deal.getVersion()));
        } else {
            if (isStudent) {
                deal.setStatus(MentoringDealStatus.STUDENT_CONFIRMED);
            } else {
                deal.setStatus(MentoringDealStatus.MENTOR_CONFIRMED);
            }

            sendDealSystemMessage(deal.getConversation(), currentUser,
                    String.format("[HỆ THỐNG] %s đã xác nhận Thỏa thuận Deal #%d (Phiên bản %d). Đang chờ bên còn lại xác nhận.",
                            getUserDisplayName(currentUser), deal.getId(), deal.getVersion()));
        }

        MentoringDeal savedDeal = dealRepository.save(deal);
        log.info("Xác nhận Deal id={} thành công, trạng thái mới: {}", savedDeal.getId(), savedDeal.getStatus());
        return enrichResponse(dealMapper.toResponse(savedDeal), savedDeal, currentUserId);
    }

    /**
     * Xem thông tin chi tiết của một Deal bao gồm điều khoản hiện tại,
     * Snapshot mới nhất và toàn bộ lịch sử các phiên bản Snapshot.
     *
     * @param currentUserId ID người dùng đang truy cập
     * @param dealId ID của thỏa thuận Deal
     * @return DTO chi tiết toàn diện của Deal
     */
    @Override
    @Transactional(readOnly = true)
    public MentoringDealDetailResponse getDealDetail(Long currentUserId, Long dealId) {
        log.info("Lấy chi tiết Deal id={} bởi userId={}", dealId, currentUserId);

        MentoringDeal deal = dealRepository.findDetailById(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thỏa thuận Deal (ID: " + dealId + ")."));

        boolean isStudent = deal.getStudent().getId().equals(currentUserId);
        boolean isMentor = deal.getMentor().getId().equals(currentUserId);
        User currentUser = userRepository.findById(currentUserId).orElse(null);
        boolean isAdmin = currentUser != null && currentUser.getRole() != null && "ADMIN".equalsIgnoreCase(currentUser.getRole().getName());

        if (!isStudent && !isMentor && !isAdmin) {
            throw new ForbiddenException("Bạn không có quyền xem thỏa thuận Deal này.");
        }

        List<MentoringDealSnapshot> snapshots = snapshotRepository.findByDealIdOrderByVersionAsc(dealId);
        List<MentoringDealSnapshotResponse> snapshotResponses = dealMapper.toSnapshotResponseList(snapshots);

        MentoringDealSnapshotResponse latestSnapshot = snapshotResponses.isEmpty() ? null
                : snapshotResponses.get(snapshotResponses.size() - 1);

        MentoringDealResponse dealResponse = enrichResponse(dealMapper.toResponse(deal), deal, currentUserId);

        return MentoringDealDetailResponse.builder()
                .deal(dealResponse)
                .latestSnapshot(latestSnapshot)
                .snapshots(snapshotResponses)
                .build();
    }

    /**
     * Lấy danh sách các thỏa thuận Deal của người dùng hiện tại (với tư cách Student hoặc Mentor).
     *
     * @param currentUserId ID người dùng đang truy cập
     * @param status Bộ lọc trạng thái tùy chọn
     * @param pageable Tham số phân trang
     * @return Danh sách phân trang các Deal
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<MentoringDealResponse> getMyDeals(Long currentUserId, MentoringDealStatus status, Pageable pageable) {
        log.info("Lấy danh sách Deals của userId={}, status={}", currentUserId, status);

        Page<MentoringDeal> page = dealRepository.findByParticipantAndStatus(currentUserId, status, pageable);

        List<MentoringDealResponse> items = page.getContent().stream()
                .map(d -> enrichResponse(dealMapper.toResponse(d), d, currentUserId))
                .toList();

        return PageResponse.<MentoringDealResponse>builder()
                .content(items)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    /**
     * Lấy thông tin Deal mới nhất gắn với một cuộc trò chuyện Direct Messaging (1-1).
     *
     * @param currentUserId ID người dùng đang truy cập
     * @param conversationId ID cuộc trò chuyện
     * @return DTO chi tiết Deal hoặc null nếu chưa có thỏa thuận nào
     */
    @Override
    @Transactional(readOnly = true)
    public MentoringDealDetailResponse getDealByConversation(Long currentUserId, Long conversationId) {
        log.info("Lấy Deal theo conversationId={} bởi userId={}", conversationId, currentUserId);

        Optional<MentoringDeal> dealOpt = dealRepository.findFirstByConversationIdOrderByUpdatedAtDesc(conversationId);
        if (dealOpt.isEmpty()) {
            return null;
        }

        MentoringDeal deal = dealOpt.get();
        boolean isStudent = deal.getStudent().getId().equals(currentUserId);
        boolean isMentor = deal.getMentor().getId().equals(currentUserId);
        if (!isStudent && !isMentor) {
            throw new ForbiddenException("Bạn không phải thành viên tham gia thỏa thuận của đoạn chat này.");
        }

        return getDealDetail(currentUserId, deal.getId());
    }

    /**
     * Hủy bỏ một thỏa thuận Deal trước khi bị khóa chốt.
     *
     * @param currentUserId ID người dùng thực hiện hủy
     * @param dealId ID của thỏa thuận Deal
     * @param reason Lý do hủy bỏ tùy chọn
     * @return DTO thông tin Deal đã chuyển sang trạng thái CANCELLED
     */
    @Override
    @Transactional
    public MentoringDealResponse cancelDeal(Long currentUserId, Long dealId, String reason) {
        log.info("Hủy bỏ Deal id={} bởi userId={}", dealId, currentUserId);

        MentoringDeal deal = dealRepository.findDetailById(dealId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thỏa thuận Deal (ID: " + dealId + ")."));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin người dùng đang thao tác."));

        boolean isStudent = deal.getStudent().getId().equals(currentUserId);
        boolean isMentor = deal.getMentor().getId().equals(currentUserId);
        if (!isStudent && !isMentor) {
            throw new ForbiddenException("Bạn không có quyền hủy bỏ thỏa thuận này.");
        }

        if (Boolean.TRUE.equals(deal.getIsLocked()) || deal.getStatus() == MentoringDealStatus.DEAL_CONFIRMED) {
            throw new ConflictException("Không thể hủy thỏa thuận đã được cả hai bên xác nhận và khóa snapshot.");
        }

        if (deal.getStatus() == MentoringDealStatus.CANCELLED) {
            throw new BadRequestException("Thỏa thuận này đã bị hủy bỏ trước đó.");
        }

        Instant now = Instant.now();
        deal.setStatus(MentoringDealStatus.CANCELLED);
        deal.setUpdatedBy(currentUser);
        deal.setUpdatedAt(now);

        MentoringDeal savedDeal = dealRepository.save(deal);

        String cancelMessage = String.format("[HỆ THỐNG] %s đã hủy bỏ Thỏa thuận cố vấn (Deal #%d)%s.",
                getUserDisplayName(currentUser),
                deal.getId(),
                reason != null && !reason.isBlank() ? " vì lý do: " + reason.trim() : "");

        sendDealSystemMessage(deal.getConversation(), currentUser, cancelMessage);

        log.info("Hủy bỏ thành công Mentoring Deal id={}", savedDeal.getId());
        return enrichResponse(dealMapper.toResponse(savedDeal), savedDeal, currentUserId);
    }

    /**
     * Bổ sung các cờ quyền hạn canConfirm và canEdit dựa trên người dùng hiện tại và trạng thái của Deal.
     */
    private MentoringDealResponse enrichResponse(MentoringDealResponse response, MentoringDeal deal, Long currentUserId) {
        if (response == null || deal == null) return response;

        boolean isStudent = deal.getStudent().getId().equals(currentUserId);
        boolean isMentor = deal.getMentor().getId().equals(currentUserId);
        boolean isLocked = Boolean.TRUE.equals(deal.getIsLocked()) || deal.getStatus() == MentoringDealStatus.DEAL_CONFIRMED;
        boolean isCancelled = deal.getStatus() == MentoringDealStatus.CANCELLED;

        // Quyền xác nhận: nếu chưa bị khóa, chưa bị hủy, và người dùng hiện tại chưa xác nhận phiên bản này
        boolean canConfirm = false;
        if (!isLocked && !isCancelled) {
            if (isStudent && !Boolean.TRUE.equals(deal.getStudentConfirmed())) {
                canConfirm = true;
            } else if (isMentor && !Boolean.TRUE.equals(deal.getMentorConfirmed())) {
                canConfirm = true;
            }
        }

        // Quyền chỉnh sửa: người tham gia có thể chỉnh sửa nếu chưa bị khóa và chưa hủy
        boolean canEdit = (isStudent || isMentor) && !isLocked && !isCancelled;

        response.setCanConfirm(canConfirm);
        response.setCanEdit(canEdit);
        return response;
    }

    /**
     * Gửi tin nhắn SYSTEM tự động vào cuộc trò chuyện Direct Messaging nếu cuộc trò chuyện tồn tại.
     */
    private void sendDealSystemMessage(Conversation conversation, User sender, String content) {
        if (conversation == null) return;
        try {
            Message message = Message.builder()
                    .conversation(conversation)
                    .sender(sender)
                    .content(content)
                    .type(MessageType.SYSTEM)
                    .createdAt(Instant.now())
                    .build();

            messageRepository.save(message);
            conversation.setLastMessageAt(Instant.now());
            conversationRepository.save(conversation);
        } catch (Exception ex) {
            log.warn("Không thể gửi tin nhắn hệ thống vào cuộc hội thoại conversationId={}: {}",
                    conversation.getId(), ex.getMessage());
        }
    }

    /**
     * Lấy tên hiển thị của người dùng từ hồ sơ cá nhân hoặc email dự phòng.
     */
    private String getUserDisplayName(User user) {
        if (user == null) return "Người dùng";
        if (user.getProfile() != null && user.getProfile().getFullName() != null && !user.getProfile().getFullName().isBlank()) {
            return user.getProfile().getFullName();
        }
        return user.getEmail();
    }
}
