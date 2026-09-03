package com.alumnect.alumnect_backend.service.forum;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.QuestionStatus;
import com.alumnect.alumnect_backend.common.enums.VoteTargetType;
import com.alumnect.alumnect_backend.dao.forum.ForumTopicRepository;
import com.alumnect.alumnect_backend.dao.forum.QuestionImageRepository;
import com.alumnect.alumnect_backend.dao.forum.QuestionRepository;
import com.alumnect.alumnect_backend.dao.forum.VoteRepository;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.forum.CreateQuestionRequest;
import com.alumnect.alumnect_backend.dto.request.forum.UpdateQuestionRequest;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionDetailResponse;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionResponse;
import com.alumnect.alumnect_backend.dto.response.forum.TopicResponse;
import com.alumnect.alumnect_backend.dto.response.forum.VoteResponse;
import com.alumnect.alumnect_backend.entity.forum.ForumTopic;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.forum.QuestionImage;
import com.alumnect.alumnect_backend.entity.forum.Vote;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.forum.QuestionMapper;
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
 * Lớp dịch vụ thực thi logic nghiệp vụ của danh sách câu hỏi diễn đàn (UC38 - View question list).
 * Triển khai interface {@link QuestionService}.
 */
@Service
public class QuestionServiceImpl implements QuestionService {

    private static final Logger log = LoggerFactory.getLogger(QuestionServiceImpl.class);

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ForumTopicRepository forumTopicRepository;

    @Autowired
    private QuestionImageRepository questionImageRepository;

    @Autowired
    private MajorRepository majorRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private QuestionMapper questionMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VoteRepository voteRepository;

    /** Độ dài tối đa cho phép của từ khóa tìm kiếm (UC44 - Search questions), khớp độ dài tối đa của title. */
    private static final int KEYWORD_MAX_LENGTH = 250;

    /** Ký tự dùng để escape các ký tự đặc biệt của LIKE ({@code %}, {@code _}) trong mẫu tìm kiếm. */
    private static final String LIKE_ESCAPE_CHAR = "\\";

    /**
     * {@inheritDoc}
     * <p>
     * Luồng xử lý:
     * <ol>
     *   <li>Kiểm tra tham số phân trang ({@code page} ≥ 0, {@code size} ≥ 1), ném lỗi 400 nếu vi phạm.</li>
     *   <li>Chuyển tham số {@code sort} thành đối tượng {@link Sort}, ném lỗi 400 nếu giá trị không hợp lệ.</li>
     *   <li>Chuẩn hóa {@code keyword} (trim, kiểm tra độ dài, escape ký tự đặc biệt của LIKE) nếu có (UC44).</li>
     *   <li>Truy vấn trang câu hỏi ACTIVE qua {@link QuestionRepository#findActiveQuestions}
     *       (đã JOIN FETCH tác giả + chủ đề để tránh N+1 query).</li>
     *   <li>Truy vấn gộp (batch) hồ sơ {@link UserProfile} của toàn bộ tác giả — tránh N+1 query lần 2.</li>
     *   <li>Map từng câu hỏi sang {@link QuestionResponse} rồi đóng gói vào {@link PageResponse}.</li>
     * </ol>
     */
    @Override
    public PageResponse<QuestionResponse> getQuestions(int page, int size, String sort, String keyword, List<Long> topicIds, List<Long> majorIds, String viewerEmail) {
        // Validate tham số phân trang trước khi tạo PageRequest — nếu không, PageRequest.of()
        // sẽ ném IllegalArgumentException và bị trả về nhầm HTTP 500 thay vì 400.
        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        // Tìm kiếm theo từ khóa (UC44 - Search questions, BR-44-01/BR-44-02): rỗng/blank = không tìm kiếm.
        String trimmedKeyword = keyword != null ? keyword.trim() : "";
        boolean filterByKeyword = !trimmedKeyword.isEmpty();
        if (filterByKeyword && trimmedKeyword.length() > KEYWORD_MAX_LENGTH) {
            throw new BadRequestException("Từ khóa tìm kiếm không được vượt quá " + KEYWORD_MAX_LENGTH + " ký tự");
        }
        String likePattern = filterByKeyword ? buildLikePattern(trimmedKeyword) : "";

        // Lọc theo nhiều THỂ LOẠI và/hoặc nhiều NGÀNH (tick chọn ở Frontend), độc lập nhau.
        // Khi một chiều không lọc, truyền danh sách giữ chỗ không rỗng để tránh mệnh đề IN () không hợp lệ;
        // điều kiện IN khi đó bị vô hiệu hóa bởi cờ filterByTopic/filterByMajor = false.
        boolean filterByTopic = topicIds != null && !topicIds.isEmpty();
        List<Long> effectiveTopicIds = filterByTopic ? topicIds : List.of(-1L);
        boolean filterByMajor = majorIds != null && !majorIds.isEmpty();
        List<Long> effectiveMajorIds = filterByMajor ? majorIds : List.of(-1L);

        Sort sortSpec = resolveSort(sort);
        Page<Question> questionsPage = questionRepository.findActiveQuestions(
                filterByKeyword, likePattern, filterByTopic, effectiveTopicIds, filterByMajor, effectiveMajorIds, PageRequest.of(page, size, sortSpec));
        log.info("Lấy danh sách câu hỏi: page={}, size={}, sort={}, keyword={}, topicIds={}, majorIds={}, tổng kết quả={}",
                page, size, sort, filterByKeyword ? trimmedKeyword : null, filterByTopic ? topicIds : null, filterByMajor ? majorIds : null, questionsPage.getTotalElements());

        // Gộp truy vấn hồ sơ tác giả theo lô (batch) thay vì truy vấn riêng lẻ cho từng câu hỏi.
        List<Long> authorIds = questionsPage.getContent().stream()
                .map(q -> q.getAuthor().getId())
                .distinct()
                .collect(Collectors.toList());
        Map<Long, UserProfile> profileByUserId = userProfileRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));

        // Gộp truy vấn ảnh đính kèm theo lô cho toàn bộ câu hỏi trong trang — tránh N+1 query.
        List<Long> questionIds = questionsPage.getContent().stream().map(Question::getId).collect(Collectors.toList());
        Map<Long, List<String>> imagesByQuestionId = loadImagesByQuestionIds(questionIds);

        // Gộp truy vấn trạng thái bình chọn (UC42) theo lô cho toàn bộ câu hỏi trong trang — tránh N+1 query.
        // Guest (viewerEmail = null) luôn nhận tập rỗng -> mọi câu hỏi voted = false.
        Set<Long> votedQuestionIds = computeVotedQuestionIds(viewerEmail, questionIds);

        List<QuestionResponse> content = questionsPage.getContent().stream()
                .map(question -> questionMapper.toResponse(
                        question,
                        profileByUserId.get(question.getAuthor().getId()),
                        imagesByQuestionId.getOrDefault(question.getId(), List.of()),
                        votedQuestionIds.contains(question.getId())))
                .collect(Collectors.toList());

        return PageResponse.<QuestionResponse>builder()
                .content(content)
                .pageNumber(questionsPage.getNumber())
                .pageSize(questionsPage.getSize())
                .totalElements(questionsPage.getTotalElements())
                .totalPages(questionsPage.getTotalPages())
                .last(questionsPage.isLast())
                .build();
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng xử lý:
     * <ol>
     *   <li>Truy vấn câu hỏi ACTIVE theo ID qua {@link QuestionRepository#findActiveDetailById}
     *       (đã JOIN FETCH tác giả + chủ đề). Nếu không tồn tại/không ACTIVE → ném lỗi 404.</li>
     *   <li>Truy vấn hồ sơ {@link UserProfile} của tác giả để lấy họ tên/avatar/headline.</li>
     *   <li>Map sang {@link QuestionDetailResponse} và trả về.</li>
     * </ol>
     */
    @Override
    public QuestionDetailResponse getQuestionDetail(Long id, String viewerEmail) {
        Question question = questionRepository.findActiveDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với id: " + id));
        log.info("Xem chi tiết câu hỏi: id={}, tác giả={}", id, question.getAuthor().getId());

        // Hồ sơ tác giả có thể chưa được tạo (null) — mapper tự xử lý fallback.
        UserProfile authorProfile = userProfileRepository.findById(question.getAuthor().getId()).orElse(null);
        List<String> images = loadImageUrls(question.getId());
        boolean voted = !computeVotedQuestionIds(viewerEmail, List.of(id)).isEmpty();
        return questionMapper.toDetailResponse(question, authorProfile, images, voted);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: tìm user theo email (404 nếu không có) → kiểm tra vai trò Student/Alumni (403 nếu khác)
     * → nếu có topicId thì kiểm tra chủ đề tồn tại (400 nếu không) → tạo Question trạng thái ACTIVE,
     * số vote/trả lời = 0 → lưu → map sang chi tiết trả về.
     */
    @Override
    @Transactional
    public QuestionDetailResponse createQuestion(String email, CreateQuestionRequest request) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        // RBAC (UC40): chỉ Sinh viên và Cựu sinh viên mới được đặt câu hỏi; Admin/khác bị từ chối 403.
        String roleName = author.getRole() != null ? author.getRole().getName().toUpperCase() : "";
        if (!roleName.equals("STUDENT") && !roleName.equals("ALUMNI")) {
            throw new ForbiddenException("Chỉ sinh viên và cựu sinh viên mới được đặt câu hỏi");
        }

        // Thể loại là tùy chọn: nếu có topicId thì phải tồn tại, ngược lại để null (chưa phân loại).
        ForumTopic topic = null;
        if (request.getTopicId() != null) {
            topic = forumTopicRepository.findById(request.getTopicId())
                    .orElseThrow(() -> new BadRequestException("Thể loại không tồn tại"));
        }

        // Ngành là tùy chọn: nếu có majorId thì phải tồn tại, ngược lại để null (chưa chọn ngành).
        Major major = null;
        if (request.getMajorId() != null) {
            major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new BadRequestException("Ngành không tồn tại"));
        }

        Question question = Question.builder()
                .author(author)
                .topic(topic)
                .major(major)
                .title(request.getTitle().trim())
                .body(request.getBody().trim())
                .status(QuestionStatus.ACTIVE)
                .voteCount(0)
                .answerCount(0)
                .build();

        Question saved;
        try {
            saved = questionRepository.save(question);
        } catch (Exception ex) {
            log.error("Lỗi khi lưu câu hỏi mới của user {}: ", email, ex);
            throw new RuntimeException("Lỗi hệ thống: Không thể tạo câu hỏi");
        }

        // Lưu ảnh đính kèm (nếu có) theo đúng thứ tự người dùng gửi lên.
        List<String> savedImages = replaceImages(saved, request.getImageUrls());
        log.info("Tạo câu hỏi mới: id={}, tác giả={}, topicId={}, majorId={}, số ảnh={}",
                saved.getId(), email, request.getTopicId(), request.getMajorId(), savedImages.size());

        // Nạp hồ sơ tác giả để trả về chi tiết đầy đủ (tên/avatar/headline) cho Frontend.
        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);
        // Câu hỏi vừa tạo chắc chắn chưa ai bình chọn (kể cả chính tác giả).
        return questionMapper.toDetailResponse(saved, profile, savedImages, false);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: tìm user theo email (404) → tìm câu hỏi ACTIVE theo id (404) → kiểm tra người dùng
     * chính là TÁC GIẢ (403 nếu không) → nếu có topicId/majorId thì kiểm tra tồn tại (400) →
     * cập nhật tiêu đề/nội dung/thể loại/ngành, thay toàn bộ ảnh → lưu → map chi tiết trả về.
     */
    @Override
    @Transactional
    public QuestionDetailResponse updateQuestion(String email, Long questionId, UpdateQuestionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        Question question = questionRepository.findActiveDetailById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với id: " + questionId));

        // Ownership (UC46): chỉ tác giả câu hỏi mới được chỉnh sửa; người khác nhận 403.
        if (!question.getAuthor().getId().equals(user.getId())) {
            throw new ForbiddenException("Chỉ tác giả mới được chỉnh sửa câu hỏi này");
        }

        // Thể loại tùy chọn: có thì phải tồn tại, không thì bỏ phân loại (null).
        ForumTopic topic = null;
        if (request.getTopicId() != null) {
            topic = forumTopicRepository.findById(request.getTopicId())
                    .orElseThrow(() -> new BadRequestException("Thể loại không tồn tại"));
        }

        // Ngành tùy chọn: có thì phải tồn tại, không thì bỏ chọn ngành (null).
        Major major = null;
        if (request.getMajorId() != null) {
            major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new BadRequestException("Ngành không tồn tại"));
        }

        question.setTitle(request.getTitle().trim());
        question.setBody(request.getBody().trim());
        question.setTopic(topic);
        question.setMajor(major);
        Question saved = questionRepository.save(question);

        // Thay toàn bộ ảnh cũ bằng bộ ảnh mới gửi lên (xóa hết rồi lưu lại).
        List<String> savedImages = replaceImages(saved, request.getImageUrls());
        log.info("Cập nhật câu hỏi: id={}, tác giả={}, topicId={}, majorId={}, số ảnh={}",
                saved.getId(), email, request.getTopicId(), request.getMajorId(), savedImages.size());

        UserProfile profile = userProfileRepository.findById(user.getId()).orElse(null);
        boolean voted = !computeVotedQuestionIds(email, List.of(saved.getId())).isEmpty();
        return questionMapper.toDetailResponse(saved, profile, savedImages, voted);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: tìm user theo email (404) → tìm câu hỏi ACTIVE theo id (404) → kiểm tra người dùng
     * chính là TÁC GIẢ (403 nếu không) → chuyển trạng thái sang DELETED → lưu.
     */
    @Override
    @Transactional
    public void deleteQuestion(String email, Long questionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        Question question = questionRepository.findActiveDetailById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với id: " + questionId));

        // Ownership (UC47): chỉ tác giả câu hỏi mới được xóa; người khác nhận 403.
        if (!question.getAuthor().getId().equals(user.getId())) {
            throw new ForbiddenException("Chỉ tác giả mới được xóa câu hỏi này");
        }

        question.setStatus(QuestionStatus.DELETED);
        questionRepository.save(question);
        log.info("Xóa câu hỏi: id={}, tác giả={}", questionId, email);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: xác thực user + vai trò Student/Alumni (403 nếu khác) → xác nhận câu hỏi ACTIVE (404) →
     * nếu CHƯA bình chọn thì tạo {@link Vote} (value=1) + tăng {@code voteCount} (idempotent — bình
     * chọn lần 2 không tạo thêm bản ghi/không tăng thêm, nhờ ràng buộc UNIQUE ở DB làm lớp bảo vệ cuối).
     */
    @Override
    @Transactional
    public VoteResponse voteQuestion(String email, Long questionId) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được bình chọn câu hỏi");
        Question question = questionRepository.findActiveDetailById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với id: " + questionId));

        if (!voteRepository.existsByUserIdAndTargetTypeAndTargetId(user.getId(), VoteTargetType.QUESTION, questionId)) {
            voteRepository.save(Vote.builder()
                    .user(user)
                    .targetType(VoteTargetType.QUESTION)
                    .targetId(questionId)
                    .value((short) 1)
                    .build());
            question.setVoteCount(question.getVoteCount() + 1);
            questionRepository.save(question);
            log.info("Bình chọn câu hỏi: id={}, người bình chọn={}", questionId, email);
        }
        return VoteResponse.builder().voted(true).voteCount(question.getVoteCount()).build();
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: xác thực user + vai trò Student/Alumni (403 nếu khác) → xác nhận câu hỏi ACTIVE (404) →
     * nếu ĐÃ bình chọn thì xóa {@link Vote} + giảm {@code voteCount} (không âm).
     */
    @Override
    @Transactional
    public VoteResponse unvoteQuestion(String email, Long questionId) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được bình chọn câu hỏi");
        Question question = questionRepository.findActiveDetailById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với id: " + questionId));

        if (voteRepository.existsByUserIdAndTargetTypeAndTargetId(user.getId(), VoteTargetType.QUESTION, questionId)) {
            voteRepository.deleteByUserIdAndTargetTypeAndTargetId(user.getId(), VoteTargetType.QUESTION, questionId);
            question.setVoteCount(Math.max(0, question.getVoteCount() - 1));
            questionRepository.save(question);
            log.info("Bỏ bình chọn câu hỏi: id={}, người bỏ bình chọn={}", questionId, email);
        }
        return VoteResponse.builder().voted(false).voteCount(question.getVoteCount()).build();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<TopicResponse> getTopics() {
        return forumTopicRepository.findAllByOrderByIdAsc().stream()
                .map(questionMapper::toTopicResponse)
                .collect(Collectors.toList());
    }

    /**
     * Thay TOÀN BỘ ảnh của một câu hỏi bằng bộ URL mới: xóa hết ảnh cũ rồi lưu lại theo đúng thứ tự.
     * Dùng chung cho tạo mới (không có ảnh cũ) và chỉnh sửa (thay ảnh cũ).
     *
     * @param question Câu hỏi đã được lưu
     * @param urls     Danh sách URL ảnh mới (có thể null/rỗng)
     * @return Danh sách URL ảnh đã lưu (đã lọc/giới hạn), theo thứ tự
     */
    private List<String> replaceImages(Question question, List<String> urls) {
        questionImageRepository.deleteByQuestion_Id(question.getId());
        List<String> sanitized = sanitizeImageUrls(urls);
        if (sanitized.isEmpty()) {
            return List.of();
        }
        List<QuestionImage> entities = new ArrayList<>();
        short order = 0;
        for (String url : sanitized) {
            entities.add(QuestionImage.builder()
                    .question(question)
                    .url(url)
                    .sortOrder(order++)
                    .build());
        }
        questionImageRepository.saveAll(entities);
        return sanitized;
    }

    /** Lọc bỏ URL rỗng/quá dài và giới hạn số ảnh tối đa. */
    private List<String> sanitizeImageUrls(List<String> urls) {
        if (urls == null) {
            return List.of();
        }
        return urls.stream()
                .filter(u -> u != null && !u.isBlank())
                .map(String::trim)
                .filter(u -> u.length() <= 500)
                .limit(CreateQuestionRequest.MAX_IMAGES)
                .collect(Collectors.toList());
    }

    /** Lấy danh sách URL ảnh của một câu hỏi, theo thứ tự hiển thị. */
    private List<String> loadImageUrls(Long questionId) {
        return questionImageRepository.findByQuestion_IdOrderBySortOrderAsc(questionId).stream()
                .map(QuestionImage::getUrl)
                .collect(Collectors.toList());
    }

    /** Lấy ảnh của nhiều câu hỏi cùng lúc (batch), gom theo id câu hỏi — tránh N+1 query. */
    private Map<Long, List<String>> loadImagesByQuestionIds(List<Long> questionIds) {
        if (questionIds == null || questionIds.isEmpty()) {
            return Map.of();
        }
        return questionImageRepository.findByQuestion_IdInOrderByQuestion_IdAscSortOrderAsc(questionIds).stream()
                .collect(Collectors.groupingBy(
                        img -> img.getQuestion().getId(),
                        Collectors.mapping(QuestionImage::getUrl, Collectors.toList())));
    }

    /**
     * Xác thực người dùng theo email và kiểm tra vai trò Student/Alumni — dùng chung cho các thao tác
     * bình chọn (UC42). Mirror pattern {@code resolveMemberOrThrow} của PostServiceImpl (UC17 - Like a post).
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
     * Tính tập ID câu hỏi (trong một tập cho trước) mà người xem hiện tại đã bình chọn (UC42), theo lô
     * để tránh N+1 query. Guest ({@code viewerEmail} null) hoặc danh sách rỗng luôn trả về tập rỗng.
     *
     * @param viewerEmail Email người xem hiện tại, null nếu là Guest
     * @param questionIds Tập ID câu hỏi cần kiểm tra
     * @return Tập con các ID câu hỏi mà người xem đã bình chọn
     */
    private Set<Long> computeVotedQuestionIds(String viewerEmail, List<Long> questionIds) {
        if (viewerEmail == null || questionIds.isEmpty()) {
            return new HashSet<>();
        }
        return userRepository.findByEmail(viewerEmail)
                .map(u -> new HashSet<>(voteRepository.findVotedTargetIds(u.getId(), VoteTargetType.QUESTION, questionIds)))
                .orElseGet(HashSet::new);
    }

    /**
     * Chuẩn hóa từ khóa tìm kiếm (UC44) thành mẫu LIKE an toàn: chữ thường, escape các ký tự đặc biệt
     * của LIKE ({@code \}, {@code %}, {@code _}) bằng {@link #LIKE_ESCAPE_CHAR}, rồi bọc {@code %...%}
     * để khớp substring không phân biệt hoa/thường (dùng cùng {@code ESCAPE '\'} khai báo trong JPQL).
     *
     * @param rawKeyword Từ khóa đã trim, không rỗng
     * @return Mẫu LIKE đã escape, sẵn sàng truyền cho {@link QuestionRepository#findActiveQuestions}
     */
    private String buildLikePattern(String rawKeyword) {
        String escaped = rawKeyword.toLowerCase()
                .replace(LIKE_ESCAPE_CHAR, LIKE_ESCAPE_CHAR + LIKE_ESCAPE_CHAR)
                .replace("%", LIKE_ESCAPE_CHAR + "%")
                .replace("_", LIKE_ESCAPE_CHAR + "_");
        return "%" + escaped + "%";
    }

    /**
     * Chuyển tham số sắp xếp thành đối tượng {@link Sort} hỗ trợ NHIỀU tiêu chí ưu tiên.
     * Tham số là chuỗi các key cách nhau bởi dấu phẩy (VD "votes,answers"): sắp theo tiêu chí đầu,
     * hòa thì theo tiêu chí kế; luôn thêm createdAt DESC cuối cùng để kết quả ổn định.
     *
     * @param sort Chuỗi tiêu chí cách nhau bởi dấu phẩy: "recent", "votes", "answers"
     * @return Đối tượng Sort theo đúng thứ tự ưu tiên
     * @throws BadRequestException nếu có tiêu chí không hợp lệ
     */
    private Sort resolveSort(String sort) {
        String raw = (sort == null || sort.isBlank()) ? "recent" : sort.trim().toLowerCase();
        List<Sort.Order> orders = new ArrayList<>();
        for (String part : raw.split(",")) {
            String key = part.trim();
            if (key.isEmpty()) {
                continue;
            }
            switch (key) {
                case "recent" -> orders.add(new Sort.Order(Sort.Direction.DESC, "createdAt"));
                case "votes" -> orders.add(new Sort.Order(Sort.Direction.DESC, "voteCount"));
                case "answers" -> orders.add(new Sort.Order(Sort.Direction.DESC, "answerCount"));
                default -> throw new BadRequestException("Tiêu chí sắp xếp không hợp lệ: " + key);
            }
        }
        // Thêm createdAt DESC làm điều kiện phụ cuối cùng nếu chưa có, đảm bảo thứ tự ổn định.
        boolean hasCreatedAt = orders.stream().anyMatch(o -> "createdAt".equals(o.getProperty()));
        if (!hasCreatedAt) {
            orders.add(new Sort.Order(Sort.Direction.DESC, "createdAt"));
        }
        return Sort.by(orders);
    }
}
