package com.alumnect.alumnect_backend.service.forum;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AnswerStatus;
import com.alumnect.alumnect_backend.common.enums.VoteTargetType;
import com.alumnect.alumnect_backend.dao.forum.AnswerRepository;
import com.alumnect.alumnect_backend.dao.forum.QuestionRepository;
import com.alumnect.alumnect_backend.dao.forum.VoteRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.forum.CreateAnswerRequest;
import com.alumnect.alumnect_backend.dto.request.forum.UpdateAnswerRequest;
import com.alumnect.alumnect_backend.dto.response.forum.AnswerResponse;
import com.alumnect.alumnect_backend.dto.response.forum.VoteResponse;
import com.alumnect.alumnect_backend.entity.forum.Answer;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.forum.Vote;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.forum.AnswerMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Lớp dịch vụ thực thi logic nghiệp vụ câu trả lời diễn đàn (UC41 - Answer a question).
 * Triển khai interface {@link AnswerService}.
 */
@Service
public class AnswerServiceImpl implements AnswerService {

    private static final Logger log = LoggerFactory.getLogger(AnswerServiceImpl.class);

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private AnswerMapper answerMapper;

    @Autowired
    private VoteRepository voteRepository;

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: kiểm tra tham số phân trang → xác nhận câu hỏi tồn tại và ACTIVE (404 nếu không) →
     * truy vấn câu trả lời ACTIVE (sắp theo thời gian tạo tăng dần) → gộp hồ sơ tác giả theo lô →
     * map sang {@link AnswerResponse}.
     */
    @Override
    public PageResponse<AnswerResponse> getAnswers(Long questionId, int page, int size, String viewerEmail) {
        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        // Câu hỏi phải tồn tại và đang ACTIVE; ngược lại coi như không tìm thấy (không trả câu trả lời).
        questionRepository.findActiveDetailById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với id: " + questionId));

        // Lấy trang câu trả lời GỐC (top-level); các reply lấy riêng theo lô rồi lồng vào.
        Sort sortSpec = Sort.by(Sort.Direction.ASC, "createdAt");
        Page<Answer> topPage = answerRepository.findActiveTopLevelByQuestionId(questionId, PageRequest.of(page, size, sortSpec));
        List<Answer> tops = topPage.getContent();

        List<Long> topIds = tops.stream().map(Answer::getId).collect(Collectors.toList());
        List<Answer> replies = topIds.isEmpty() ? List.of() : answerRepository.findActiveRepliesByParentIds(topIds);
        log.info("Lấy danh sách câu trả lời: questionId={}, page={}, size={}, gốc={}, reply={}",
                questionId, page, size, topPage.getTotalElements(), replies.size());

        // Gộp truy vấn hồ sơ tác giả theo lô cho CẢ câu trả lời gốc lẫn reply — tránh N+1 query.
        Set<Long> authorIds = new HashSet<>();
        tops.forEach(a -> authorIds.add(a.getAuthor().getId()));
        replies.forEach(a -> authorIds.add(a.getAuthor().getId()));
        Map<Long, UserProfile> profileByUserId = userProfileRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));

        // Gộp truy vấn trạng thái bình chọn (UC43) theo lô cho CẢ câu trả lời gốc lẫn reply — tránh N+1 query.
        List<Long> allAnswerIds = new ArrayList<>();
        tops.forEach(a -> allAnswerIds.add(a.getId()));
        replies.forEach(a -> allAnswerIds.add(a.getId()));
        Set<Long> votedAnswerIds = computeVotedAnswerIds(viewerEmail, allAnswerIds);

        // Gom reply theo id câu trả lời gốc (parent), map sẵn sang DTO (reply không có reply con).
        Map<Long, List<AnswerResponse>> repliesByParent = replies.stream().collect(Collectors.groupingBy(
                r -> r.getParent().getId(),
                Collectors.mapping(r -> answerMapper.toResponse(r, profileByUserId.get(r.getAuthor().getId()), List.of(),
                        votedAnswerIds.contains(r.getId())),
                        Collectors.toList())));

        List<AnswerResponse> content = tops.stream()
                .map(a -> answerMapper.toResponse(a, profileByUserId.get(a.getAuthor().getId()),
                        repliesByParent.getOrDefault(a.getId(), List.of()), votedAnswerIds.contains(a.getId())))
                .collect(Collectors.toList());

        return PageResponse.<AnswerResponse>builder()
                .content(content)
                .pageNumber(topPage.getNumber())
                .pageSize(topPage.getSize())
                .totalElements(topPage.getTotalElements())
                .totalPages(topPage.getTotalPages())
                .last(topPage.isLast())
                .build();
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: tìm user theo email (404 nếu không có) → kiểm tra vai trò Student/Alumni (403 nếu khác)
     * → xác nhận câu hỏi tồn tại và ACTIVE (404 nếu không) → tạo Answer trạng thái ACTIVE, vote=0 → lưu
     * → tăng answer_count của câu hỏi → map sang chi tiết trả về. Chạy trong một transaction.
     */
    @Override
    @Transactional
    public AnswerResponse createAnswer(String email, Long questionId, CreateAnswerRequest request) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        // RBAC (UC41): chỉ Sinh viên và Cựu sinh viên mới được trả lời; Admin/khác bị từ chối 403.
        String roleName = author.getRole() != null ? author.getRole().getName().toUpperCase() : "";
        if (!roleName.equals("STUDENT") && !roleName.equals("ALUMNI")) {
            throw new ForbiddenException("Chỉ sinh viên và cựu sinh viên mới được trả lời câu hỏi");
        }

        // Chỉ được trả lời câu hỏi đang ACTIVE; câu hỏi ẩn/xóa/không tồn tại → 404.
        Question question = questionRepository.findActiveDetailById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với id: " + questionId));

        // Nếu là REPLY: câu trả lời cha phải tồn tại, ACTIVE, cùng câu hỏi và là câu trả lời GỐC (2 cấp).
        Answer parent = null;
        if (request.getParentId() != null) {
            parent = answerRepository.findById(request.getParentId())
                    .filter(p -> p.getStatus() == AnswerStatus.ACTIVE)
                    .orElseThrow(() -> new BadRequestException("Câu trả lời cha không tồn tại"));
            if (!parent.getQuestion().getId().equals(questionId)) {
                throw new BadRequestException("Câu trả lời cha không thuộc câu hỏi này");
            }
            if (parent.getParent() != null) {
                throw new BadRequestException("Chỉ được trả lời trực tiếp một câu trả lời gốc");
            }
        }

        Answer answer = Answer.builder()
                .question(question)
                .author(author)
                .parent(parent)
                .body(request.getBody().trim())
                .status(AnswerStatus.ACTIVE)
                .voteCount(0)
                .build();
        Answer saved = answerRepository.save(answer);

        // Chỉ câu trả lời GỐC mới tăng bộ đếm answer_count (reply không tính vào số câu trả lời).
        if (parent == null) {
            question.setAnswerCount(question.getAnswerCount() + 1);
            questionRepository.save(question);
        }

        log.info("Tạo câu trả lời mới: id={}, questionId={}, parentId={}, tác giả={}",
                saved.getId(), questionId, request.getParentId(), email);

        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);
        // Câu trả lời vừa tạo chắc chắn chưa ai bình chọn (kể cả chính tác giả).
        return answerMapper.toResponse(saved, profile, List.of(), false);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: tìm user theo email (404) → tìm câu trả lời ACTIVE theo id (404) → xác nhận thuộc đúng
     * câu hỏi (404) → kiểm tra người dùng chính là TÁC GIẢ (403) → cập nhật nội dung → lưu → map trả về.
     */
    @Override
    @Transactional
    public AnswerResponse updateAnswer(String email, Long questionId, Long answerId, UpdateAnswerRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        Answer answer = answerRepository.findById(answerId)
                .filter(a -> a.getStatus() == AnswerStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu trả lời với id: " + answerId));

        // Câu trả lời phải thuộc đúng câu hỏi trên đường dẫn (tránh sửa nhầm chéo câu hỏi).
        if (!answer.getQuestion().getId().equals(questionId)) {
            throw new ResourceNotFoundException("Không tìm thấy câu trả lời với id: " + answerId);
        }

        // Ownership (UC48): chỉ tác giả câu trả lời mới được chỉnh sửa; người khác nhận 403.
        if (!answer.getAuthor().getId().equals(user.getId())) {
            throw new ForbiddenException("Chỉ tác giả mới được chỉnh sửa câu trả lời này");
        }

        answer.setBody(request.getBody().trim());
        Answer saved = answerRepository.save(answer);
        log.info("Cập nhật câu trả lời: id={}, questionId={}, tác giả={}", saved.getId(), questionId, email);

        UserProfile profile = userProfileRepository.findById(user.getId()).orElse(null);
        boolean voted = !computeVotedAnswerIds(email, List.of(saved.getId())).isEmpty();
        return answerMapper.toResponse(saved, profile, List.of(), voted);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: xác thực user + vai trò Student/Alumni (403 nếu khác) → tìm câu trả lời ACTIVE thuộc đúng
     * câu hỏi (404 nếu không) → nếu CHƯA bình chọn thì tạo {@link Vote} (value=1) + tăng {@code voteCount}
     * (idempotent — bình chọn lần 2 không tạo thêm bản ghi/không tăng thêm).
     */
    @Override
    @Transactional
    public VoteResponse voteAnswer(String email, Long questionId, Long answerId) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được bình chọn câu trả lời");
        Answer answer = findActiveAnswerInQuestion(questionId, answerId);

        if (!voteRepository.existsByUserIdAndTargetTypeAndTargetId(user.getId(), VoteTargetType.ANSWER, answerId)) {
            voteRepository.save(Vote.builder()
                    .user(user)
                    .targetType(VoteTargetType.ANSWER)
                    .targetId(answerId)
                    .value((short) 1)
                    .build());
            answer.setVoteCount(answer.getVoteCount() + 1);
            answerRepository.save(answer);
            log.info("Bình chọn câu trả lời: id={}, questionId={}, người bình chọn={}", answerId, questionId, email);
        }
        return VoteResponse.builder().voted(true).voteCount(answer.getVoteCount()).build();
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: xác thực user + vai trò Student/Alumni (403 nếu khác) → tìm câu trả lời ACTIVE thuộc đúng
     * câu hỏi (404 nếu không) → nếu ĐÃ bình chọn thì xóa {@link Vote} + giảm {@code voteCount} (không âm).
     */
    @Override
    @Transactional
    public VoteResponse unvoteAnswer(String email, Long questionId, Long answerId) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được bình chọn câu trả lời");
        Answer answer = findActiveAnswerInQuestion(questionId, answerId);

        if (voteRepository.existsByUserIdAndTargetTypeAndTargetId(user.getId(), VoteTargetType.ANSWER, answerId)) {
            voteRepository.deleteByUserIdAndTargetTypeAndTargetId(user.getId(), VoteTargetType.ANSWER, answerId);
            answer.setVoteCount(Math.max(0, answer.getVoteCount() - 1));
            answerRepository.save(answer);
            log.info("Bỏ bình chọn câu trả lời: id={}, questionId={}, người bỏ bình chọn={}", answerId, questionId, email);
        }
        return VoteResponse.builder().voted(false).voteCount(answer.getVoteCount()).build();
    }

    /**
     * Xác thực người dùng theo email và kiểm tra vai trò Student/Alumni — dùng chung cho các thao tác
     * bình chọn (UC43). Mirror pattern {@code resolveMemberOrThrow} của QuestionServiceImpl (UC42)/PostServiceImpl (UC17).
     *
     * @param email            Email người dùng đang đăng nhập
     * @param forbiddenMessage Thông điệp lỗi Tiếng Việt khi vai trò không phải Student/Alumni
     * @return User đã xác thực, chắc chắn có vai trò Student hoặc Alumni
     * @throws ResourceNotFoundException nếu không tìm thấy tài khoản
     * @throws ForbiddenException        nếu vai trò không phải Student/Alumni
     */
    private User resolveMemberOrThrow(String email, String forbiddenMessage) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));
        String role = user.getRole() != null ? user.getRole().getName().toUpperCase() : "";
        if (!role.equals("STUDENT") && !role.equals("ALUMNI")) {
            throw new ForbiddenException(forbiddenMessage);
        }
        return user;
    }

    /**
     * Tìm câu trả lời ACTIVE theo id, xác nhận thuộc đúng câu hỏi trên đường dẫn (tránh bình chọn nhầm
     * chéo câu hỏi) — dùng chung cho {@link #voteAnswer} và {@link #unvoteAnswer}, cùng cách kiểm tra
     * với {@link #updateAnswer} (UC48).
     *
     * @param questionId ID câu hỏi trên đường dẫn
     * @param answerId   ID câu trả lời cần tìm
     * @return Câu trả lời ACTIVE thuộc đúng câu hỏi
     * @throws ResourceNotFoundException nếu không tồn tại/không ACTIVE/không thuộc câu hỏi này
     */
    private Answer findActiveAnswerInQuestion(Long questionId, Long answerId) {
        Answer answer = answerRepository.findById(answerId)
                .filter(a -> a.getStatus() == AnswerStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu trả lời với id: " + answerId));
        if (!answer.getQuestion().getId().equals(questionId)) {
            throw new ResourceNotFoundException("Không tìm thấy câu trả lời với id: " + answerId);
        }
        return answer;
    }

    /**
     * Tính tập ID câu trả lời (trong một tập cho trước) mà người xem hiện tại đã bình chọn (UC43), theo
     * lô để tránh N+1 query. Guest ({@code viewerEmail} null) hoặc danh sách rỗng luôn trả về tập rỗng.
     *
     * @param viewerEmail Email người xem hiện tại, null nếu là Guest
     * @param answerIds   Tập ID câu trả lời cần kiểm tra
     * @return Tập con các ID câu trả lời mà người xem đã bình chọn
     */
    private Set<Long> computeVotedAnswerIds(String viewerEmail, List<Long> answerIds) {
        if (viewerEmail == null || answerIds.isEmpty()) {
            return new HashSet<>();
        }
        return userRepository.findByEmail(viewerEmail)
                .map(u -> new HashSet<>(voteRepository.findVotedTargetIds(u.getId(), VoteTargetType.ANSWER, answerIds)))
                .orElseGet(HashSet::new);
    }
}
