package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.AnswerStatus;
import com.alumnect.alumnect_backend.common.enums.QuestionStatus;
import com.alumnect.alumnect_backend.common.enums.VoteTargetType;
import com.alumnect.alumnect_backend.dao.forum.AnswerRepository;
import com.alumnect.alumnect_backend.dao.forum.QuestionRepository;
import com.alumnect.alumnect_backend.dao.forum.VoteRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.forum.CreateAnswerRequest;
import com.alumnect.alumnect_backend.dto.request.forum.UpdateAnswerRequest;
import com.alumnect.alumnect_backend.dto.response.forum.AnswerResponse;
import com.alumnect.alumnect_backend.entity.forum.Answer;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.forum.AnswerMapper;
import com.alumnect.alumnect_backend.service.forum.AnswerServiceImpl;
import com.alumnect.alumnect_backend.service.notification.NotificationService;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FE-36 Forum Q&A - Answer & Manage Answers")
public class FE36_AnswerManageAnswersTest {

    @Mock
    private com.alumnect.alumnect_backend.service.moderation.ContentModerationService contentModerationService;

    @Mock
    private AnswerRepository answerRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Spy
    private AnswerMapper answerMapper = new AnswerMapper();

    @Mock
    private VoteRepository voteRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AnswerServiceImpl answerService;

    private Validator validator;

    private static final String STUDENT_EMAIL = "student@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";
    private static final String OTHER_EMAIL = "other@fpt.edu.vn";

    private User studentUser;
    private User adminUser;
    private User otherUser;
    private User alumniUser;
    private UserProfile studentProfile;
    private Question question10;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.lenient()
                .when(contentModerationService.sanitizeContent(org.mockito.ArgumentMatchers.anyString()))
                .thenAnswer(invocation -> invocation.getArgument(0));
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role adminRole = Role.builder().id(2L).name("ADMIN").build();
        Role alumniRole = Role.builder().id(3L).name("ALUMNI").build();

        studentUser = User.builder()
                .id(1L)
                .email(STUDENT_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        adminUser = User.builder()
                .id(99L)
                .email(ADMIN_EMAIL)
                .role(adminRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        otherUser = User.builder()
                .id(2L)
                .email(OTHER_EMAIL)
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        alumniUser = User.builder()
                .id(3L)
                .email("alumni@fpt.edu.vn")
                .role(alumniRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .build();

        studentProfile = UserProfile.builder()
                .userId(1L)
                .fullName("Nguyen Van A")
                .avatarUrl("https://example.com/avatar.png")
                .headline("Student at FPT")
                .build();

        question10 = Question.builder()
                .id(10L)
                .title("Sample Question 10")
                .body("Question details")
                .author(otherUser)
                .status(QuestionStatus.ACTIVE)
                .answerCount(2)
                .createdAt(Instant.now().minusSeconds(3600))
                .build();
    }

    // ================= Query Answers =================

    @Test
    @DisplayName("UTCID01 - Question 10 has top-level answers 1 and 2; answer 3 is a reply of answer 1 -> PageResponse with 2 top-level AnswerResponse; the reply is nested inside answer 1")
    void utcid01_getAnswers_okNestedReplies() {
        // Given
        Answer ans1 = Answer.builder()
                .id(1L)
                .question(question10)
                .author(studentUser)
                .body("Top answer 1")
                .status(AnswerStatus.ACTIVE)
                .voteCount(5)
                .createdAt(Instant.now().minusSeconds(100))
                .build();

        Answer ans2 = Answer.builder()
                .id(2L)
                .question(question10)
                .author(otherUser)
                .body("Top answer 2")
                .status(AnswerStatus.ACTIVE)
                .voteCount(2)
                .createdAt(Instant.now().minusSeconds(50))
                .build();

        Answer ans3 = Answer.builder()
                .id(3L)
                .question(question10)
                .author(alumniUser)
                .parent(ans1)
                .body("Reply to answer 1")
                .status(AnswerStatus.ACTIVE)
                .voteCount(0)
                .createdAt(Instant.now().minusSeconds(20))
                .build();

        Page<Answer> topPage = new PageImpl<>(List.of(ans1, ans2), PageRequest.of(0, 10), 2);

        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(answerRepository.findActiveTopLevelByQuestionId(eq(10L), any(PageRequest.class))).thenReturn(topPage);
        when(answerRepository.findActiveRepliesByParentIds(List.of(1L, 2L))).thenReturn(List.of(ans3));
        when(userProfileRepository.findAllById(anySet())).thenReturn(List.of(studentProfile));

        // When
        PageResponse<AnswerResponse> response = answerService.getAnswers(10L, 0, 10, null);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getTotalElements()).isEqualTo(2);

        AnswerResponse res1 = response.getContent().get(0);
        assertThat(res1.getId()).isEqualTo("1");
        assertThat(res1.getReplies()).hasSize(1);
        assertThat(res1.getReplies().get(0).getId()).isEqualTo("3");

        AnswerResponse res2 = response.getContent().get(1);
        assertThat(res2.getId()).isEqualTo("2");
        assertThat(res2.getReplies()).isEmpty();
    }

    @Test
    @DisplayName("UTCID02 - page = -1 -> BadRequestException: Tham số page phải là số nguyên không âm")
    void utcid02_getAnswers_badRequestPageNegative() {
        // When + Then
        assertThatThrownBy(() -> answerService.getAnswers(10L, -1, 10, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số page phải là số nguyên không âm");
        verify(questionRepository, never()).findActiveDetailById(any());
    }

    @Test
    @DisplayName("UTCID03 - size = 0 -> BadRequestException: Tham số size phải là số nguyên dương")
    void utcid03_getAnswers_badRequestSizeZero() {
        // When + Then
        assertThatThrownBy(() -> answerService.getAnswers(10L, 0, 0, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số size phải là số nguyên dương");
        verify(questionRepository, never()).findActiveDetailById(any());
    }

    @Test
    @DisplayName("UTCID04 - Question 404 does not exist or is not ACTIVE -> ResourceNotFoundException: Không tìm thấy câu hỏi với id: 404")
    void utcid04_getAnswers_notFoundQuestion() {
        // Given
        when(questionRepository.findActiveDetailById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> answerService.getAnswers(404L, 0, 10, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy câu hỏi với id: 404");
        verify(answerRepository, never()).findActiveTopLevelByQuestionId(any(), any());
    }

    @Test
    @DisplayName("UTCID05 - Question has no answer -> Empty PageResponse; replies query is skipped")
    void utcid05_getAnswers_okEmptyAnswers() {
        // Given
        Page<Answer> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(answerRepository.findActiveTopLevelByQuestionId(eq(10L), any(PageRequest.class))).thenReturn(emptyPage);

        // When
        PageResponse<AnswerResponse> response = answerService.getAnswers(10L, 0, 10, null);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEmpty();
        assertThat(response.getTotalElements()).isEqualTo(0);
        verify(answerRepository, never()).findActiveRepliesByParentIds(any());
    }

    // ================= Create Answer =================

    @Test
    @DisplayName("UTCID06 - STUDENT replies to question 10 owned by someone else (answerCount = 2) -> Answer saved ACTIVE with trimmed body and 0 votes; question.answerCount = 3")
    void utcid06_createAnswer_okTopLevel() {
        // Given
        CreateAnswerRequest request = CreateAnswerRequest.builder()
                .body("  My answer  ")
                .parentId(null)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(answerRepository.save(any(Answer.class))).thenAnswer(inv -> {
            Answer a = inv.getArgument(0);
            a.setId(50L);
            if (a.getCreatedAt() == null) {
                a.setCreatedAt(Instant.now());
            }
            return a;
        });
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(studentProfile));

        // When
        AnswerResponse response = answerService.createAnswer(STUDENT_EMAIL, 10L, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getBody()).isEqualTo("My answer");
        assertThat(response.getVotes()).isEqualTo(0);
        assertThat(response.isVoted()).isFalse();

        ArgumentCaptor<Answer> answerCaptor = ArgumentCaptor.forClass(Answer.class);
        verify(answerRepository).save(answerCaptor.capture());
        Answer savedAnswer = answerCaptor.getValue();
        assertThat(savedAnswer.getBody()).isEqualTo("My answer");
        assertThat(savedAnswer.getStatus()).isEqualTo(AnswerStatus.ACTIVE);
        assertThat(savedAnswer.getVoteCount()).isEqualTo(0);
        assertThat(savedAnswer.getParent()).isNull();

        ArgumentCaptor<Question> questionCaptor = ArgumentCaptor.forClass(Question.class);
        verify(questionRepository).save(questionCaptor.capture());
        assertThat(questionCaptor.getValue().getAnswerCount()).isEqualTo(3);

        verify(notificationService).sendAnswerNotification(eq(studentUser), eq(question10), any(Answer.class));
    }

    @Test
    @DisplayName("UTCID07 - Top-level answer 1 of question 10 exists -> Reply saved with parent = answer 1; question.answerCount unchanged")
    void utcid07_createAnswer_okReply() {
        // Given
        CreateAnswerRequest request = CreateAnswerRequest.builder()
                .body("Reply")
                .parentId(1L)
                .build();

        Answer parentAns = Answer.builder()
                .id(1L)
                .question(question10)
                .parent(null)
                .status(AnswerStatus.ACTIVE)
                .createdAt(Instant.now().minusSeconds(100))
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(answerRepository.findById(1L)).thenReturn(Optional.of(parentAns));
        when(answerRepository.save(any(Answer.class))).thenAnswer(inv -> {
            Answer a = inv.getArgument(0);
            a.setId(51L);
            if (a.getCreatedAt() == null) {
                a.setCreatedAt(Instant.now());
            }
            return a;
        });
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(studentProfile));

        // When
        AnswerResponse response = answerService.createAnswer(STUDENT_EMAIL, 10L, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getParentId()).isEqualTo("1");
        assertThat(response.getBody()).isEqualTo("Reply");

        ArgumentCaptor<Answer> answerCaptor = ArgumentCaptor.forClass(Answer.class);
        verify(answerRepository).save(answerCaptor.capture());
        assertThat(answerCaptor.getValue().getParent()).isEqualTo(parentAns);

        verify(questionRepository, never()).save(any());
        assertThat(question10.getAnswerCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("UTCID08 - Account role is ADMIN -> ForbiddenException: Chỉ sinh viên và cựu sinh viên mới được trả lời câu hỏi")
    void utcid08_createAnswer_forbiddenAdmin() {
        // Given
        CreateAnswerRequest request = CreateAnswerRequest.builder().body("Answer").build();
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));

        // When + Then
        assertThatThrownBy(() -> answerService.createAnswer(ADMIN_EMAIL, 10L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới được trả lời câu hỏi");
        verify(questionRepository, never()).findActiveDetailById(any());
    }

    @Test
    @DisplayName("UTCID09 - questionId = 404 does not exist or is not ACTIVE -> ResourceNotFoundException: Không tìm thấy câu hỏi với id: 404")
    void utcid09_createAnswer_notFoundQuestion() {
        // Given
        CreateAnswerRequest request = CreateAnswerRequest.builder().body("Answer").build();
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> answerService.createAnswer(STUDENT_EMAIL, 404L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy câu hỏi với id: 404");
        verify(answerRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID10 - Parent answer 404 does not exist -> BadRequestException: Câu trả lời cha không tồn tại")
    void utcid10_createAnswer_badRequestNoParent() {
        // Given
        CreateAnswerRequest request = CreateAnswerRequest.builder().body("Reply").parentId(404L).build();
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(answerRepository.findById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> answerService.createAnswer(STUDENT_EMAIL, 10L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Câu trả lời cha không tồn tại");
        verify(answerRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID11 - Parent answer 1 exists but its status is DELETED -> BadRequestException: Câu trả lời cha không tồn tại")
    void utcid11_createAnswer_badRequestParentDel() {
        // Given
        CreateAnswerRequest request = CreateAnswerRequest.builder().body("Reply").parentId(1L).build();
        Answer deletedParent = Answer.builder().id(1L).status(AnswerStatus.DELETED).build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(answerRepository.findById(1L)).thenReturn(Optional.of(deletedParent));

        // When + Then
        assertThatThrownBy(() -> answerService.createAnswer(STUDENT_EMAIL, 10L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Câu trả lời cha không tồn tại");
        verify(answerRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID12 - Parent answer 1 belongs to another question (id 11) -> BadRequestException: Câu trả lời cha không thuộc câu hỏi này")
    void utcid12_createAnswer_badRequestDiffQuest() {
        // Given
        CreateAnswerRequest request = CreateAnswerRequest.builder().body("Reply").parentId(1L).build();
        Question question11 = Question.builder().id(11L).build();
        Answer parentOtherQuestion = Answer.builder()
                .id(1L)
                .status(AnswerStatus.ACTIVE)
                .question(question11)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(answerRepository.findById(1L)).thenReturn(Optional.of(parentOtherQuestion));

        // When + Then
        assertThatThrownBy(() -> answerService.createAnswer(STUDENT_EMAIL, 10L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Câu trả lời cha không thuộc câu hỏi này");
        verify(answerRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID13 - Answer 3 is already a reply (has a parent): nesting would reach level 3 -> BadRequestException: Chỉ được trả lời trực tiếp một câu trả lời gốc")
    void utcid13_createAnswer_badRequestLevel3() {
        // Given
        CreateAnswerRequest request = CreateAnswerRequest.builder().body("Reply").parentId(3L).build();
        Answer grandParent = Answer.builder().id(1L).build();
        Answer replyLevel2 = Answer.builder()
                .id(3L)
                .status(AnswerStatus.ACTIVE)
                .question(question10)
                .parent(grandParent)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(answerRepository.findById(3L)).thenReturn(Optional.of(replyLevel2));

        // When + Then
        assertThatThrownBy(() -> answerService.createAnswer(STUDENT_EMAIL, 10L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Chỉ được trả lời trực tiếp một câu trả lời gốc");
        verify(answerRepository, never()).save(any());
    }

    // ================= Update Answer =================

    @Test
    @DisplayName("UTCID14 - The student owns ACTIVE answer 5 of question 10 -> AnswerResponse; body trimmed and saved")
    void utcid14_updateAnswer_okTrimmed() {
        // Given
        UpdateAnswerRequest request = UpdateAnswerRequest.builder().body("  edited  ").build();
        Answer ans5 = Answer.builder()
                .id(5L)
                .author(studentUser)
                .question(question10)
                .status(AnswerStatus.ACTIVE)
                .body("old")
                .createdAt(Instant.now().minusSeconds(200))
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(5L)).thenReturn(Optional.of(ans5));
        when(answerRepository.save(any(Answer.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(studentProfile));

        // When
        AnswerResponse response = answerService.updateAnswer(STUDENT_EMAIL, 10L, 5L, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getBody()).isEqualTo("edited");
        assertThat(ans5.getBody()).isEqualTo("edited");
        verify(answerRepository).save(ans5);
    }

    @Test
    @DisplayName("UTCID15 - Answer 5 belongs to another user -> ForbiddenException: Chỉ tác giả mới được chỉnh sửa câu trả lời này")
    void utcid15_updateAnswer_forbiddenNotAuthor() {
        // Given
        UpdateAnswerRequest request = UpdateAnswerRequest.builder().body("edited").build();
        Answer ans5 = Answer.builder()
                .id(5L)
                .author(otherUser)
                .question(question10)
                .status(AnswerStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(5L)).thenReturn(Optional.of(ans5));

        // When + Then
        assertThatThrownBy(() -> answerService.updateAnswer(STUDENT_EMAIL, 10L, 5L, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ tác giả mới được chỉnh sửa câu trả lời này");
        verify(answerRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID16 - Answer 5 belongs to question 11 while the URL uses question 10 -> ResourceNotFoundException: Không tìm thấy câu trả lời với id: 5")
    void utcid16_updateAnswer_notFoundDiffQuestion() {
        // Given
        UpdateAnswerRequest request = UpdateAnswerRequest.builder().body("edited").build();
        Question question11 = Question.builder().id(11L).build();
        Answer ans5 = Answer.builder()
                .id(5L)
                .author(studentUser)
                .question(question11)
                .status(AnswerStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(5L)).thenReturn(Optional.of(ans5));

        // When + Then
        assertThatThrownBy(() -> answerService.updateAnswer(STUDENT_EMAIL, 10L, 5L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy câu trả lời với id: 5");
        verify(answerRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID17 - Answer 5 is DELETED -> ResourceNotFoundException: Không tìm thấy câu trả lời với id: 5")
    void utcid17_updateAnswer_notFoundDeleted() {
        // Given
        UpdateAnswerRequest request = UpdateAnswerRequest.builder().body("edited").build();
        Answer ans5 = Answer.builder()
                .id(5L)
                .author(studentUser)
                .question(question10)
                .status(AnswerStatus.DELETED)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(5L)).thenReturn(Optional.of(ans5));

        // When + Then
        assertThatThrownBy(() -> answerService.updateAnswer(STUDENT_EMAIL, 10L, 5L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy câu trả lời với id: 5");
        verify(answerRepository, never()).save(any());
    }

    // ================= Delete Answer =================

    @Test
    @DisplayName("UTCID18 - The student owns top-level answer 5 which has 2 ACTIVE replies (ids 6, 7); question.answerCount = 2 -> Void; votes removed, replies deleted first, answer 5 hard-deleted, question.answerCount = 1")
    void utcid18_deleteAnswer_okTopLevelWithReplies() {
        // Given
        Question q = Question.builder().id(10L).answerCount(2).build();
        Answer ans5 = Answer.builder()
                .id(5L)
                .author(studentUser)
                .question(q)
                .parent(null)
                .status(AnswerStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(5L)).thenReturn(Optional.of(ans5));
        when(answerRepository.findActiveReplyIdsByParentId(5L)).thenReturn(List.of(6L, 7L));

        // When
        answerService.deleteAnswer(STUDENT_EMAIL, 10L, 5L);

        // Then
        verify(voteRepository).deleteByTargetTypeAndTargetIdIn(VoteTargetType.ANSWER, List.of(5L, 6L, 7L));
        verify(answerRepository).deleteByParentId(5L);
        verify(answerRepository).delete(ans5);
        verify(questionRepository).save(q);
        assertThat(q.getAnswerCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("UTCID19 - The student owns reply 6 (has a parent) -> Reply deleted; question.answerCount unchanged; no reply sweep executed")
    void utcid19_deleteAnswer_okReplyNoSweep() {
        // Given
        Question q = Question.builder().id(10L).answerCount(2).build();
        Answer parentAns = Answer.builder().id(5L).build();
        Answer reply6 = Answer.builder()
                .id(6L)
                .author(studentUser)
                .question(q)
                .parent(parentAns)
                .status(AnswerStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(6L)).thenReturn(Optional.of(reply6));

        // When
        answerService.deleteAnswer(STUDENT_EMAIL, 10L, 6L);

        // Then
        verify(voteRepository).deleteByTargetTypeAndTargetIdIn(VoteTargetType.ANSWER, List.of(6L));
        verify(answerRepository, never()).findActiveReplyIdsByParentId(any());
        verify(answerRepository, never()).deleteByParentId(any());
        verify(answerRepository).delete(reply6);
        verify(questionRepository, never()).save(any());
        assertThat(q.getAnswerCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("UTCID20 - Answer 5 belongs to another user -> ForbiddenException: Chỉ tác giả mới được xóa câu trả lời này")
    void utcid20_deleteAnswer_forbiddenNotAuthor() {
        // Given
        Answer ans5 = Answer.builder()
                .id(5L)
                .author(otherUser)
                .question(question10)
                .status(AnswerStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(5L)).thenReturn(Optional.of(ans5));

        // When + Then
        assertThatThrownBy(() -> answerService.deleteAnswer(STUDENT_EMAIL, 10L, 5L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ tác giả mới được xóa câu trả lời này");
        verify(answerRepository, never()).delete(any());
    }

    @Test
    @DisplayName("UTCID21 - Top-level answer 5 owned by the student; cached question.answerCount is already 0 -> answerCount never goes negative (stays 0)")
    void utcid21_deleteAnswer_okCountNotNegative() {
        // Given
        Question q = Question.builder().id(10L).answerCount(0).build();
        Answer ans5 = Answer.builder()
                .id(5L)
                .author(studentUser)
                .question(q)
                .parent(null)
                .status(AnswerStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(5L)).thenReturn(Optional.of(ans5));
        when(answerRepository.findActiveReplyIdsByParentId(5L)).thenReturn(Collections.emptyList());

        // When
        answerService.deleteAnswer(STUDENT_EMAIL, 10L, 5L);

        // Then
        verify(questionRepository).save(q);
        assertThat(q.getAnswerCount()).isEqualTo(0);
        verify(answerRepository).delete(ans5);
    }

    // ================= DTO Validation =================

    @Test
    @DisplayName("UTCID22 - body length = 10000 (maximum) on CreateAnswerRequest -> No constraint violation")
    void utcid22_createAnswer_okMaxBodyValidation() {
        // Given
        CreateAnswerRequest request = CreateAnswerRequest.builder()
                .body("a".repeat(10000))
                .build();

        // When
        Set<ConstraintViolation<CreateAnswerRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("UTCID23 - body length = 10001 on CreateAnswerRequest -> ConstraintViolation: Nội dung câu trả lời không được vượt quá 10000 ký tự")
    void utcid23_createAnswer_invalidBodyTooLong() {
        // Given
        CreateAnswerRequest request = CreateAnswerRequest.builder()
                .body("a".repeat(10001))
                .build();

        // When
        Set<ConstraintViolation<CreateAnswerRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage()).isEqualTo("Nội dung câu trả lời không được vượt quá 10000 ký tự");
    }

    @Test
    @DisplayName("UTCID24 - body = '   ' (blank) on UpdateAnswerRequest -> ConstraintViolation: Nội dung câu trả lời không được để trống")
    void utcid24_updateAnswer_invalidBlankBody() {
        // Given
        UpdateAnswerRequest request = UpdateAnswerRequest.builder()
                .body("   ")
                .build();

        // When
        Set<ConstraintViolation<UpdateAnswerRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).anyMatch(v -> v.getMessage().equals("Nội dung câu trả lời không được để trống"));
    }
}
