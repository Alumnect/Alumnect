package com.alumnect.alumnect_backend.service.forum;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AnswerStatus;
import com.alumnect.alumnect_backend.dao.forum.AnswerRepository;
import com.alumnect.alumnect_backend.dao.forum.QuestionRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.forum.CreateAnswerRequest;
import com.alumnect.alumnect_backend.dto.response.forum.AnswerResponse;
import com.alumnect.alumnect_backend.entity.forum.Answer;
import com.alumnect.alumnect_backend.entity.forum.Question;
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

import java.util.List;
import java.util.Map;
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

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: kiểm tra tham số phân trang → xác nhận câu hỏi tồn tại và ACTIVE (404 nếu không) →
     * truy vấn câu trả lời ACTIVE (sắp theo thời gian tạo tăng dần) → gộp hồ sơ tác giả theo lô →
     * map sang {@link AnswerResponse}.
     */
    @Override
    public PageResponse<AnswerResponse> getAnswers(Long questionId, int page, int size) {
        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        // Câu hỏi phải tồn tại và đang ACTIVE; ngược lại coi như không tìm thấy (không trả câu trả lời).
        questionRepository.findActiveDetailById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi với id: " + questionId));

        Sort sortSpec = Sort.by(Sort.Direction.ASC, "createdAt");
        Page<Answer> answersPage = answerRepository.findActiveByQuestionId(questionId, PageRequest.of(page, size, sortSpec));
        log.info("Lấy danh sách câu trả lời: questionId={}, page={}, size={}, tổng kết quả={}",
                questionId, page, size, answersPage.getTotalElements());

        // Gộp truy vấn hồ sơ tác giả theo lô (batch) thay vì truy vấn riêng lẻ cho từng câu trả lời.
        List<Long> authorIds = answersPage.getContent().stream()
                .map(a -> a.getAuthor().getId())
                .distinct()
                .collect(Collectors.toList());
        Map<Long, UserProfile> profileByUserId = userProfileRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));

        List<AnswerResponse> content = answersPage.getContent().stream()
                .map(answer -> answerMapper.toResponse(answer, profileByUserId.get(answer.getAuthor().getId())))
                .collect(Collectors.toList());

        return PageResponse.<AnswerResponse>builder()
                .content(content)
                .pageNumber(answersPage.getNumber())
                .pageSize(answersPage.getSize())
                .totalElements(answersPage.getTotalElements())
                .totalPages(answersPage.getTotalPages())
                .last(answersPage.isLast())
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

        Answer answer = Answer.builder()
                .question(question)
                .author(author)
                .body(request.getBody().trim())
                .status(AnswerStatus.ACTIVE)
                .voteCount(0)
                .build();
        Answer saved = answerRepository.save(answer);

        // Tăng bộ đếm số câu trả lời (denormalized) của câu hỏi.
        question.setAnswerCount(question.getAnswerCount() + 1);
        questionRepository.save(question);

        log.info("Tạo câu trả lời mới: id={}, questionId={}, tác giả={}", saved.getId(), questionId, email);

        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);
        return answerMapper.toResponse(saved, profile);
    }
}
