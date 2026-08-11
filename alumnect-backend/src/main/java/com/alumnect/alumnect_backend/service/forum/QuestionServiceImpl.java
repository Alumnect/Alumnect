package com.alumnect.alumnect_backend.service.forum;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.QuestionStatus;
import com.alumnect.alumnect_backend.dao.forum.ForumTopicRepository;
import com.alumnect.alumnect_backend.dao.forum.QuestionRepository;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.forum.CreateQuestionRequest;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionDetailResponse;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionResponse;
import com.alumnect.alumnect_backend.dto.response.forum.TopicResponse;
import com.alumnect.alumnect_backend.entity.forum.ForumTopic;
import com.alumnect.alumnect_backend.entity.forum.Question;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
    private MajorRepository majorRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private QuestionMapper questionMapper;

    @Autowired
    private UserRepository userRepository;

    /**
     * {@inheritDoc}
     * <p>
     * Luồng xử lý:
     * <ol>
     *   <li>Kiểm tra tham số phân trang ({@code page} ≥ 0, {@code size} ≥ 1), ném lỗi 400 nếu vi phạm.</li>
     *   <li>Chuyển tham số {@code sort} thành đối tượng {@link Sort}, ném lỗi 400 nếu giá trị không hợp lệ.</li>
     *   <li>Truy vấn trang câu hỏi ACTIVE qua {@link QuestionRepository#findActiveQuestions}
     *       (đã JOIN FETCH tác giả + chủ đề để tránh N+1 query).</li>
     *   <li>Truy vấn gộp (batch) hồ sơ {@link UserProfile} của toàn bộ tác giả — tránh N+1 query lần 2.</li>
     *   <li>Map từng câu hỏi sang {@link QuestionResponse} rồi đóng gói vào {@link PageResponse}.</li>
     * </ol>
     */
    @Override
    public PageResponse<QuestionResponse> getQuestions(int page, int size, String sort, List<Long> topicIds, List<Long> majorIds) {
        // Validate tham số phân trang trước khi tạo PageRequest — nếu không, PageRequest.of()
        // sẽ ném IllegalArgumentException và bị trả về nhầm HTTP 500 thay vì 400.
        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        // Lọc theo nhiều THỂ LOẠI và/hoặc nhiều NGÀNH (tick chọn ở Frontend), độc lập nhau.
        // Khi một chiều không lọc, truyền danh sách giữ chỗ không rỗng để tránh mệnh đề IN () không hợp lệ;
        // điều kiện IN khi đó bị vô hiệu hóa bởi cờ filterByTopic/filterByMajor = false.
        boolean filterByTopic = topicIds != null && !topicIds.isEmpty();
        List<Long> effectiveTopicIds = filterByTopic ? topicIds : List.of(-1L);
        boolean filterByMajor = majorIds != null && !majorIds.isEmpty();
        List<Long> effectiveMajorIds = filterByMajor ? majorIds : List.of(-1L);

        Sort sortSpec = resolveSort(sort);
        Page<Question> questionsPage = questionRepository.findActiveQuestions(
                filterByTopic, effectiveTopicIds, filterByMajor, effectiveMajorIds, PageRequest.of(page, size, sortSpec));
        log.info("Lấy danh sách câu hỏi: page={}, size={}, sort={}, topicIds={}, majorIds={}, tổng kết quả={}",
                page, size, sort, filterByTopic ? topicIds : null, filterByMajor ? majorIds : null, questionsPage.getTotalElements());

        // Gộp truy vấn hồ sơ tác giả theo lô (batch) thay vì truy vấn riêng lẻ cho từng câu hỏi.
        List<Long> authorIds = questionsPage.getContent().stream()
                .map(q -> q.getAuthor().getId())
                .distinct()
                .collect(Collectors.toList());
        Map<Long, UserProfile> profileByUserId = userProfileRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));

        List<QuestionResponse> content = questionsPage.getContent().stream()
                .map(question -> questionMapper.toResponse(question, profileByUserId.get(question.getAuthor().getId())))
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
    public QuestionDetailResponse getQuestionDetail(Long id) {
        Question question = questionRepository.findActiveDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với id: " + id));
        log.info("Xem chi tiết câu hỏi: id={}, tác giả={}", id, question.getAuthor().getId());

        // Hồ sơ tác giả có thể chưa được tạo (null) — mapper tự xử lý fallback.
        UserProfile authorProfile = userProfileRepository.findById(question.getAuthor().getId()).orElse(null);
        return questionMapper.toDetailResponse(question, authorProfile);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: tìm user theo email (404 nếu không có) → kiểm tra vai trò Student/Alumni (403 nếu khác)
     * → nếu có topicId thì kiểm tra chủ đề tồn tại (400 nếu không) → tạo Question trạng thái ACTIVE,
     * số vote/trả lời = 0 → lưu → map sang chi tiết trả về.
     */
    @Override
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
        log.info("Tạo câu hỏi mới: id={}, tác giả={}, topicId={}, majorId={}", saved.getId(), email, request.getTopicId(), request.getMajorId());

        // Nạp hồ sơ tác giả để trả về chi tiết đầy đủ (tên/avatar/headline) cho Frontend.
        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);
        return questionMapper.toDetailResponse(saved, profile);
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
