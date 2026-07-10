package com.alumnect.alumnect_backend.service.forum;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dao.forum.ForumTopicRepository;
import com.alumnect.alumnect_backend.dao.forum.QuestionRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionResponse;
import com.alumnect.alumnect_backend.dto.response.forum.TopicResponse;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.mapper.forum.QuestionMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

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
    private UserProfileRepository userProfileRepository;

    @Autowired
    private QuestionMapper questionMapper;

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
    public PageResponse<QuestionResponse> getQuestions(int page, int size, String sort, Long topicId) {
        // Validate tham số phân trang trước khi tạo PageRequest — nếu không, PageRequest.of()
        // sẽ ném IllegalArgumentException và bị trả về nhầm HTTP 500 thay vì 400.
        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        Sort sortSpec = resolveSort(sort);
        Page<Question> questionsPage = questionRepository.findActiveQuestions(topicId, PageRequest.of(page, size, sortSpec));
        log.info("Lấy danh sách câu hỏi: page={}, size={}, sort={}, topicId={}, tổng kết quả={}",
                page, size, sort, topicId, questionsPage.getTotalElements());

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
     */
    @Override
    public List<TopicResponse> getTopics() {
        return forumTopicRepository.findAllByOrderByNameAsc().stream()
                .map(questionMapper::toTopicResponse)
                .collect(Collectors.toList());
    }

    /**
     * Chuyển tham số sắp xếp (không phân biệt hoa/thường) thành đối tượng {@link Sort}.
     * Mọi tiêu chí đều thêm createdAt DESC làm điều kiện phụ để kết quả ổn định khi trùng giá trị.
     *
     * @param sort Chuỗi tiêu chí: "recent" (mặc định), "votes", "answers"
     * @return Đối tượng Sort tương ứng
     * @throws BadRequestException nếu giá trị sort không hợp lệ
     */
    private Sort resolveSort(String sort) {
        String key = (sort == null || sort.isBlank()) ? "recent" : sort.trim().toLowerCase();
        return switch (key) {
            case "recent" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "votes" -> Sort.by(Sort.Direction.DESC, "voteCount").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            case "answers" -> Sort.by(Sort.Direction.DESC, "answerCount").and(Sort.by(Sort.Direction.DESC, "createdAt"));
            default -> throw new BadRequestException("Tiêu chí sắp xếp không hợp lệ: " + sort);
        };
    }
}
