package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.QuestionStatus;
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
import com.alumnect.alumnect_backend.entity.forum.ForumTopic;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.forum.QuestionImage;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.forum.QuestionMapper;
import com.alumnect.alumnect_backend.service.forum.QuestionServiceImpl;
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

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-35 Forum Q&A - Create & Manage Questions.
 * Report sheet : FE-35 (Report5_Unit_Test.xlsx)
 * Functions    : QuestionServiceImpl.createQuestion(), updateQuestion(), deleteQuestion()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-35 Forum Q&A - Create & Manage Questions")
class FE35_CreateManageQuestionsTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private ForumTopicRepository forumTopicRepository;

    @Mock
    private QuestionImageRepository questionImageRepository;

    @Mock
    private MajorRepository majorRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Spy
    private QuestionMapper questionMapper = new QuestionMapper();

    @Mock
    private UserRepository userRepository;

    @Mock
    private VoteRepository voteRepository;

    // ===== System under test =====
    @InjectMocks
    private QuestionServiceImpl questionService;

    // ===== Test data =====
    private static final String STUDENT_EMAIL = "student@fpt.edu.vn";
    private static final String OTHER_EMAIL = "other@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";
    private static final Long QUESTION_ID = 7L;

    private Validator validator;
    private User studentUser;
    private User otherUser;
    private User adminUser;
    private UserProfile studentProfile;
    private ForumTopic topic1;
    private Major major2;
    private Question activeQuestion7;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();

        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role adminRole = Role.builder().id(3L).name("ADMIN").build();

        studentUser = User.builder()
                .id(10L)
                .email(STUDENT_EMAIL)
                .accountStatus(AccountStatus.ACTIVE)
                .role(studentRole)
                .build();

        otherUser = User.builder()
                .id(20L)
                .email(OTHER_EMAIL)
                .accountStatus(AccountStatus.ACTIVE)
                .role(studentRole)
                .build();

        adminUser = User.builder()
                .id(99L)
                .email(ADMIN_EMAIL)
                .accountStatus(AccountStatus.ACTIVE)
                .role(adminRole)
                .build();

        studentProfile = UserProfile.builder()
                .userId(10L)
                .fullName("Student Name")
                .avatarUrl("https://avatar.png")
                .build();

        topic1 = ForumTopic.builder().id(1L).name("Java").build();
        major2 = Major.builder().id(2L).name("SE").build();

        activeQuestion7 = Question.builder()
                .id(QUESTION_ID)
                .author(studentUser)
                .title("Original Title")
                .body("Original Body")
                .status(QuestionStatus.ACTIVE)
                .voteCount(0)
                .answerCount(0)
                .topic(topic1)
                .major(major2)
                .createdAt(Instant.now())
                .build();
    }

    // ================= createQuestion() =================

    @Test
    @DisplayName("UTCID01 - Valid request without topic/major -> Question saved ACTIVE with trimmed values")
    void utcid01_createQuestion_okDefault() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("  How to prepare?  ")
                .body("  Details  ")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question q = invocation.getArgument(0);
            q.setId(100L);
            if (q.getCreatedAt() == null) {
                q.setCreatedAt(Instant.now());
            }
            return q;
        });
        when(userProfileRepository.findById(10L)).thenReturn(Optional.of(studentProfile));

        // When
        QuestionDetailResponse response = questionService.createQuestion(STUDENT_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("How to prepare?");
        assertThat(response.getBody()).isEqualTo("Details");
        assertThat(response.getTopic()).isEqualTo("");
        assertThat(response.getMajor()).isEqualTo("");
        assertThat(response.getVotes()).isEqualTo(0);
        assertThat(response.getAnswers()).isEqualTo(0);

        ArgumentCaptor<Question> questionCaptor = ArgumentCaptor.forClass(Question.class);
        verify(questionRepository).save(questionCaptor.capture());
        Question savedQ = questionCaptor.getValue();
        assertThat(savedQ.getStatus()).isEqualTo(QuestionStatus.ACTIVE);
        assertThat(savedQ.getTopic()).isNull();
        assertThat(savedQ.getMajor()).isNull();
    }

    @Test
    @DisplayName("UTCID02 - Topic and major exist -> Question linked and 2 QuestionImage saved with sortOrder 0 and 1")
    void utcid02_createQuestion_okWithTopicMajorImages() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("How to prepare?")
                .body("Details")
                .topicId(1L)
                .majorId(2L)
                .imageUrls(List.of("https://a.png", "https://b.png"))
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(forumTopicRepository.findById(1L)).thenReturn(Optional.of(topic1));
        when(majorRepository.findById(2L)).thenReturn(Optional.of(major2));
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question q = invocation.getArgument(0);
            q.setId(100L);
            if (q.getCreatedAt() == null) {
                q.setCreatedAt(Instant.now());
            }
            return q;
        });
        when(userProfileRepository.findById(10L)).thenReturn(Optional.of(studentProfile));

        // When
        QuestionDetailResponse response = questionService.createQuestion(STUDENT_EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getTopicId()).isEqualTo(1L);
        assertThat(response.getMajorId()).isEqualTo(2L);
        assertThat(response.getImages()).containsExactly("https://a.png", "https://b.png");

        ArgumentCaptor<List<QuestionImage>> imgCaptor = ArgumentCaptor.forClass(List.class);
        verify(questionImageRepository).saveAll(imgCaptor.capture());
        List<QuestionImage> savedImages = imgCaptor.getValue();
        assertThat(savedImages).hasSize(2);
        assertThat(savedImages.get(0).getSortOrder()).isEqualTo((short) 0);
        assertThat(savedImages.get(0).getUrl()).isEqualTo("https://a.png");
        assertThat(savedImages.get(1).getSortOrder()).isEqualTo((short) 1);
        assertThat(savedImages.get(1).getUrl()).isEqualTo("https://b.png");
    }

    @Test
    @DisplayName("UTCID03 - User email not found -> ResourceNotFoundException")
    void utcid03_createQuestion_notFoundUser() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("Title")
                .body("Body")
                .build();

        when(userRepository.findByEmail("ghost@fpt.edu.vn")).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> questionService.createQuestion("ghost@fpt.edu.vn", request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy tài khoản người dùng");
    }

    @Test
    @DisplayName("UTCID04 - Account role is ADMIN -> ForbiddenException")
    void utcid04_createQuestion_forbiddenAdmin() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("Title")
                .body("Body")
                .build();

        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));

        // When + Then
        assertThatThrownBy(() -> questionService.createQuestion(ADMIN_EMAIL, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới được đặt câu hỏi");
        verify(questionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID05 - Topic 99 does not exist -> BadRequestException")
    void utcid05_createQuestion_badRequestTopicNotFound() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("Title")
                .body("Body")
                .topicId(99L)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(forumTopicRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> questionService.createQuestion(STUDENT_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thể loại không tồn tại");
        verify(questionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID06 - Major 99 does not exist -> BadRequestException")
    void utcid06_createQuestion_badRequestMajorNotFound() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("Title")
                .body("Body")
                .majorId(99L)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(majorRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> questionService.createQuestion(STUDENT_EMAIL, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Ngành không tồn tại");
        verify(questionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID07 - Database save fails -> RuntimeException")
    void utcid07_createQuestion_exceptionSaveFailed() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("Title")
                .body("Body")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.save(any(Question.class))).thenThrow(new RuntimeException("DB Connection down"));

        // When + Then
        assertThatThrownBy(() -> questionService.createQuestion(STUDENT_EMAIL, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Lỗi hệ thống: Không thể tạo câu hỏi");
    }

    @Test
    @DisplayName("UTCID08 - 6 image URLs bypassing DTO -> Service keeps only the first 5 images")
    void utcid08_createQuestion_okImagesCapped5() {
        // Given
        List<String> sixImages = List.of("1.png", "2.png", "3.png", "4.png", "5.png", "6.png");
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("Title")
                .body("Body")
                .imageUrls(sixImages)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question q = invocation.getArgument(0);
            q.setId(100L);
            if (q.getCreatedAt() == null) {
                q.setCreatedAt(Instant.now());
            }
            return q;
        });
        when(userProfileRepository.findById(10L)).thenReturn(Optional.of(studentProfile));

        // When
        QuestionDetailResponse response = questionService.createQuestion(STUDENT_EMAIL, request);

        // Then
        assertThat(response.getImages()).hasSize(5);
        assertThat(response.getImages()).containsExactly("1.png", "2.png", "3.png", "4.png", "5.png");
    }

    @Test
    @DisplayName("UTCID09 - Blank, null and over-long URLs -> Discarded, only valid URL stored")
    void utcid09_createQuestion_okSanitizeImages() {
        // Given
        String longUrl = "https://example.com/" + "a".repeat(500);
        List<String> mixedUrls = Arrays.asList("ok.png", "   ", null, longUrl);
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("Title")
                .body("Body")
                .imageUrls(mixedUrls)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question q = invocation.getArgument(0);
            q.setId(100L);
            if (q.getCreatedAt() == null) {
                q.setCreatedAt(Instant.now());
            }
            return q;
        });
        when(userProfileRepository.findById(10L)).thenReturn(Optional.of(studentProfile));

        // When
        QuestionDetailResponse response = questionService.createQuestion(STUDENT_EMAIL, request);

        // Then
        assertThat(response.getImages()).containsExactly("ok.png");
    }

    // ================= DTO Validation =================

    @Test
    @DisplayName("UTCID10 - Title length 250, body length 10000, 5 images -> No constraint violation")
    void utcid10_createQuestion_okValidationBoundaries() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("a".repeat(250))
                .body("b".repeat(10000))
                .imageUrls(List.of("1.png", "2.png", "3.png", "4.png", "5.png"))
                .build();

        // When
        Set<ConstraintViolation<CreateQuestionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("UTCID11 - Title length 251 -> ConstraintViolation")
    void utcid11_createQuestion_invalidTitleLength() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("a".repeat(251))
                .body("Valid body")
                .build();

        // When
        Set<ConstraintViolation<CreateQuestionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).extracting(ConstraintViolation::getMessage)
                .contains("Tiêu đề câu hỏi không được vượt quá 250 ký tự");
    }

    @Test
    @DisplayName("UTCID12 - Body length 10001 -> ConstraintViolation")
    void utcid12_createQuestion_invalidBodyLength() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("Valid title")
                .body("b".repeat(10001))
                .build();

        // When
        Set<ConstraintViolation<CreateQuestionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).extracting(ConstraintViolation::getMessage)
                .contains("Nội dung câu hỏi không được vượt quá 10000 ký tự");
    }

    @Test
    @DisplayName("UTCID13 - 6 image URLs -> ConstraintViolation")
    void utcid13_createQuestion_invalidImageCount() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("Valid title")
                .body("Valid body")
                .imageUrls(List.of("1.png", "2.png", "3.png", "4.png", "5.png", "6.png"))
                .build();

        // When
        Set<ConstraintViolation<CreateQuestionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).extracting(ConstraintViolation::getMessage)
                .contains("Chỉ được đính kèm tối đa 5 ảnh");
    }

    @Test
    @DisplayName("UTCID14 - Blank title and empty body -> ConstraintViolations")
    void utcid14_createQuestion_invalidBlankFields() {
        // Given
        CreateQuestionRequest request = CreateQuestionRequest.builder()
                .title("  ")
                .body("")
                .build();

        // When
        Set<ConstraintViolation<CreateQuestionRequest>> violations = validator.validate(request);

        // Then
        assertThat(violations).extracting(ConstraintViolation::getMessage)
                .contains("Tiêu đề câu hỏi không được để trống", "Nội dung câu hỏi không được để trống");
    }

    // ================= updateQuestion() =================

    @Test
    @DisplayName("UTCID15 - Owner updates question -> Updated trimmed values, topic cleared, images replaced")
    void utcid15_updateQuestion_ok() {
        // Given
        UpdateQuestionRequest request = UpdateQuestionRequest.builder()
                .title("  New title ")
                .body("New body")
                .topicId(null)
                .imageUrls(List.of("https://new.png"))
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(QUESTION_ID)).thenReturn(Optional.of(activeQuestion7));
        when(questionRepository.save(activeQuestion7)).thenReturn(activeQuestion7);
        when(userProfileRepository.findById(10L)).thenReturn(Optional.of(studentProfile));

        // When
        QuestionDetailResponse response = questionService.updateQuestion(STUDENT_EMAIL, QUESTION_ID, request);

        // Then
        assertThat(response).isNotNull();
        assertThat(activeQuestion7.getTitle()).isEqualTo("New title");
        assertThat(activeQuestion7.getBody()).isEqualTo("New body");
        assertThat(activeQuestion7.getTopic()).isNull();
        verify(questionImageRepository).deleteByQuestion_Id(QUESTION_ID);
        verify(questionImageRepository).saveAll(any());
        verify(questionRepository).save(activeQuestion7);
    }

    @Test
    @DisplayName("UTCID16 - Question belongs to another user -> ForbiddenException")
    void utcid16_updateQuestion_forbiddenNotAuthor() {
        // Given
        UpdateQuestionRequest request = UpdateQuestionRequest.builder()
                .title("New title")
                .body("New body")
                .build();

        when(userRepository.findByEmail(OTHER_EMAIL)).thenReturn(Optional.of(otherUser));
        when(questionRepository.findActiveDetailById(QUESTION_ID)).thenReturn(Optional.of(activeQuestion7));

        // When + Then
        assertThatThrownBy(() -> questionService.updateQuestion(OTHER_EMAIL, QUESTION_ID, request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ tác giả mới được chỉnh sửa câu hỏi này");
        verify(questionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID17 - Question 404 does not exist -> ResourceNotFoundException")
    void utcid17_updateQuestion_notFound() {
        // Given
        UpdateQuestionRequest request = UpdateQuestionRequest.builder()
                .title("New title")
                .body("New body")
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> questionService.updateQuestion(STUDENT_EMAIL, 404L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy câu hỏi với id: 404");
    }

    @Test
    @DisplayName("UTCID18 - Topic 99 does not exist on update -> BadRequestException")
    void utcid18_updateQuestion_badRequestTopicNotFound() {
        // Given
        UpdateQuestionRequest request = UpdateQuestionRequest.builder()
                .title("New title")
                .body("New body")
                .topicId(99L)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(QUESTION_ID)).thenReturn(Optional.of(activeQuestion7));
        when(forumTopicRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> questionService.updateQuestion(STUDENT_EMAIL, QUESTION_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Thể loại không tồn tại");
        verify(questionRepository, never()).save(any());
    }

    // ================= deleteQuestion() =================

    @Test
    @DisplayName("UTCID19 - Author deletes question -> status DELETED and saved")
    void utcid19_deleteQuestion_ok() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(QUESTION_ID)).thenReturn(Optional.of(activeQuestion7));

        // When
        questionService.deleteQuestion(STUDENT_EMAIL, QUESTION_ID);

        // Then
        assertThat(activeQuestion7.getStatus()).isEqualTo(QuestionStatus.DELETED);
        verify(questionRepository).save(activeQuestion7);
    }

    @Test
    @DisplayName("UTCID20 - Other user deletes question -> ForbiddenException")
    void utcid20_deleteQuestion_forbiddenNotAuthor() {
        // Given
        when(userRepository.findByEmail(OTHER_EMAIL)).thenReturn(Optional.of(otherUser));
        when(questionRepository.findActiveDetailById(QUESTION_ID)).thenReturn(Optional.of(activeQuestion7));

        // When + Then
        assertThatThrownBy(() -> questionService.deleteQuestion(OTHER_EMAIL, QUESTION_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ tác giả mới được xóa câu hỏi này");
        verify(questionRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID21 - Question 404 not found on delete -> ResourceNotFoundException")
    void utcid21_deleteQuestion_notFound() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> questionService.deleteQuestion(STUDENT_EMAIL, 404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy câu hỏi với id: 404");
        verify(questionRepository, never()).save(any());
    }
}
