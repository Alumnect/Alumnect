package com.alumnect.alumnect_backend.unit;

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
import com.alumnect.alumnect_backend.dto.response.forum.QuestionDetailResponse;
import com.alumnect.alumnect_backend.dto.response.forum.QuestionResponse;
import com.alumnect.alumnect_backend.dto.response.forum.TopicResponse;
import com.alumnect.alumnect_backend.entity.forum.ForumTopic;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.forum.QuestionImage;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.forum.QuestionMapper;
import com.alumnect.alumnect_backend.service.forum.QuestionServiceImpl;
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
import org.springframework.data.domain.Sort;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-34 Forum Q&A - View, Search & Filter Questions.
 * Report sheet : FE-34 (Report5_Unit_Test.xlsx)
 * Functions    : QuestionServiceImpl.getQuestions(), getQuestionDetail(), getTopics()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-34 Forum Q&A - View, Search & Filter Questions")
class FE34_ForumQuestionsTest {

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
    private static final String VIEWER_EMAIL = "viewer@fpt.edu.vn";
    private User author;
    private User viewer;
    private UserProfile authorProfile;
    private Question q1;
    private Question q2;
    private Question q5;

    @BeforeEach
    void setUp() {
        author = User.builder()
                .id(10L)
                .email("author@example.com")
                .isAccountVerified(true)
                .build();

        viewer = User.builder()
                .id(99L)
                .email(VIEWER_EMAIL)
                .build();

        authorProfile = UserProfile.builder()
                .userId(10L)
                .fullName("Author Name")
                .avatarUrl("https://example.com/avatar.png")
                .headline("Software Engineer")
                .build();

        q1 = Question.builder()
                .id(1L)
                .author(author)
                .title("Question 1")
                .body("Body 1")
                .status(QuestionStatus.ACTIVE)
                .voteCount(5)
                .answerCount(2)
                .createdAt(Instant.now().minusSeconds(3600))
                .build();

        q2 = Question.builder()
                .id(2L)
                .author(author)
                .title("Question 2")
                .body("Body 2")
                .status(QuestionStatus.ACTIVE)
                .voteCount(10)
                .answerCount(4)
                .createdAt(Instant.now().minusSeconds(1800))
                .build();

        q5 = Question.builder()
                .id(5L)
                .author(author)
                .title("Question 5")
                .body("Body 5")
                .status(QuestionStatus.ACTIVE)
                .voteCount(3)
                .answerCount(1)
                .createdAt(Instant.now().minusSeconds(7200))
                .build();
    }

    // ================= getQuestions() =================

    @Test
    @DisplayName("UTCID01 - 2 active questions exist -> PageResponse returned sorted by createdAt DESC")
    void utcid01_getQuestions_okDefault() {
        // Given
        Page<Question> page = new PageImpl<>(List.of(q1, q2), PageRequest.of(0, 10), 2);
        when(questionRepository.findActiveQuestions(
                eq(false), eq(""), eq(false), eq(List.of(-1L)), eq(false), eq(List.of(-1L)), any(PageRequest.class)))
                .thenReturn(page);
        when(userProfileRepository.findAllById(List.of(10L))).thenReturn(List.of(authorProfile));
        when(questionImageRepository.findByQuestion_IdInOrderByQuestion_IdAscSortOrderAsc(List.of(1L, 2L)))
                .thenReturn(Collections.emptyList());

        // When
        PageResponse<QuestionResponse> response = questionService.getQuestions(
                0, 10, null, null, null, null, null);

        // Then
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getTotalElements()).isEqualTo(2);
        ArgumentCaptor<PageRequest> pageReqCaptor = ArgumentCaptor.forClass(PageRequest.class);
        verify(questionRepository).findActiveQuestions(
                eq(false), eq(""), eq(false), eq(List.of(-1L)), eq(false), eq(List.of(-1L)), pageReqCaptor.capture());
        Sort.Order order = pageReqCaptor.getValue().getSort().getOrderFor("createdAt");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("UTCID02 - Trimmed lowercase LIKE pattern -> filterByKeyword true and pattern %java%")
    void utcid02_getQuestions_okTrimmedPattern() {
        // Given
        when(questionRepository.findActiveQuestions(
                eq(true), eq("%java%"), anyBoolean(), anyList(), anyBoolean(), anyList(), any(PageRequest.class)))
                .thenReturn(Page.empty());

        // When
        questionService.getQuestions(0, 10, null, "  Java  ", null, null, null);

        // Then
        verify(questionRepository).findActiveQuestions(
                eq(true), eq("%java%"), anyBoolean(), anyList(), anyBoolean(), anyList(), any(PageRequest.class));
    }

    @Test
    @DisplayName("UTCID03 - Wildcard and escape characters in keyword -> Characters escaped literally")
    void utcid03_getQuestions_okEscapedWildcards() {
        // Given
        when(questionRepository.findActiveQuestions(
                eq(true), eq("%50\\%\\_off\\\\%"), anyBoolean(), anyList(), anyBoolean(), anyList(), any(PageRequest.class)))
                .thenReturn(Page.empty());

        // When
        questionService.getQuestions(0, 10, null, "50%_off\\", null, null, null);

        // Then
        verify(questionRepository).findActiveQuestions(
                eq(true), eq("%50\\%\\_off\\\\%"), anyBoolean(), anyList(), anyBoolean(), anyList(), any(PageRequest.class));
    }

    @Test
    @DisplayName("UTCID04 - Keyword length 250 -> Accepted and searched")
    void utcid04_getQuestions_okKeywordLength250() {
        // Given
        String keyword250 = "a".repeat(250);
        when(questionRepository.findActiveQuestions(
                eq(true), eq("%" + keyword250 + "%"), anyBoolean(), anyList(), anyBoolean(), anyList(), any(PageRequest.class)))
                .thenReturn(Page.empty());

        // When
        questionService.getQuestions(0, 10, null, keyword250, null, null, null);

        // Then
        verify(questionRepository).findActiveQuestions(
                eq(true), eq("%" + keyword250 + "%"), anyBoolean(), anyList(), anyBoolean(), anyList(), any(PageRequest.class));
    }

    @Test
    @DisplayName("UTCID05 - Keyword length 251 -> BadRequestException")
    void utcid05_getQuestions_badRequestKeywordLength251() {
        // Given
        String keyword251 = "a".repeat(251);

        // When + Then
        assertThatThrownBy(() -> questionService.getQuestions(0, 10, null, keyword251, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Từ khóa tìm kiếm không được vượt quá 250 ký tự");
    }

    @Test
    @DisplayName("UTCID06 - Negative page number -> BadRequestException")
    void utcid06_getQuestions_badRequestNegativePage() {
        // Given

        // When + Then
        assertThatThrownBy(() -> questionService.getQuestions(-1, 10, null, null, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số page phải là số nguyên không âm");
    }

    @Test
    @DisplayName("UTCID07 - Zero page size -> BadRequestException")
    void utcid07_getQuestions_badRequestZeroSize() {
        // Given

        // When + Then
        assertThatThrownBy(() -> questionService.getQuestions(0, 0, null, null, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tham số size phải là số nguyên dương");
    }

    @Test
    @DisplayName("UTCID08 - Filter by topic and major IDs -> filterByTopic and filterByMajor are true")
    void utcid08_getQuestions_okFilterTopicAndMajor() {
        // Given
        List<Long> topicIds = List.of(1L, 2L);
        List<Long> majorIds = List.of(3L);
        when(questionRepository.findActiveQuestions(
                eq(false), eq(""), eq(true), eq(topicIds), eq(true), eq(majorIds), any(PageRequest.class)))
                .thenReturn(Page.empty());

        // When
        questionService.getQuestions(0, 10, null, null, topicIds, majorIds, null);

        // Then
        verify(questionRepository).findActiveQuestions(
                eq(false), eq(""), eq(true), eq(topicIds), eq(true), eq(majorIds), any(PageRequest.class));
    }

    @Test
    @DisplayName("UTCID09 - Sort by votes,answers -> voteCount DESC, answerCount DESC, createdAt DESC")
    void utcid09_getQuestions_okSortVotesAndAnswers() {
        // Given
        when(questionRepository.findActiveQuestions(
                anyBoolean(), anyString(), anyBoolean(), anyList(), anyBoolean(), anyList(), any(PageRequest.class)))
                .thenReturn(Page.empty());

        // When
        questionService.getQuestions(0, 10, "votes,answers", null, null, null, null);

        // Then
        ArgumentCaptor<PageRequest> pageReqCaptor = ArgumentCaptor.forClass(PageRequest.class);
        verify(questionRepository).findActiveQuestions(
                anyBoolean(), anyString(), anyBoolean(), anyList(), anyBoolean(), anyList(), pageReqCaptor.capture());
        Sort sort = pageReqCaptor.getValue().getSort();
        assertThat(sort.getOrderFor("voteCount").getDirection()).isEqualTo(Sort.Direction.DESC);
        assertThat(sort.getOrderFor("answerCount").getDirection()).isEqualTo(Sort.Direction.DESC);
        assertThat(sort.getOrderFor("createdAt").getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("UTCID10 - Invalid sort criteria -> BadRequestException")
    void utcid10_getQuestions_badRequestInvalidSort() {
        // Given

        // When + Then
        assertThatThrownBy(() -> questionService.getQuestions(0, 10, "foo", null, null, null, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Tiêu chí sắp xếp không hợp lệ: foo");
    }

    @Test
    @DisplayName("UTCID11 - Viewer voted question 2 only -> Mapper receives voted true for question 2 only")
    void utcid11_getQuestions_okVotedFlagMapped() {
        // Given
        Page<Question> page = new PageImpl<>(List.of(q1, q2), PageRequest.of(0, 10), 2);
        when(questionRepository.findActiveQuestions(
                anyBoolean(), anyString(), anyBoolean(), anyList(), anyBoolean(), anyList(), any(PageRequest.class)))
                .thenReturn(page);
        when(userProfileRepository.findAllById(List.of(10L))).thenReturn(List.of(authorProfile));
        when(questionImageRepository.findByQuestion_IdInOrderByQuestion_IdAscSortOrderAsc(List.of(1L, 2L)))
                .thenReturn(Collections.emptyList());

        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(voteRepository.findVotedTargetIds(99L, VoteTargetType.QUESTION, List.of(1L, 2L)))
                .thenReturn(List.of(2L));

        // When
        PageResponse<QuestionResponse> response = questionService.getQuestions(
                0, 10, null, null, null, null, VIEWER_EMAIL);

        // Then
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getContent().get(0).isVoted()).isFalse();
        assertThat(response.getContent().get(1).isVoted()).isTrue();
    }

    @Test
    @DisplayName("UTCID12 - Question has two images -> Images loaded in batch in sort order")
    void utcid12_getQuestions_okImagesBatchLoaded() {
        // Given
        Page<Question> page = new PageImpl<>(List.of(q1), PageRequest.of(0, 10), 1);
        when(questionRepository.findActiveQuestions(
                anyBoolean(), anyString(), anyBoolean(), anyList(), anyBoolean(), anyList(), any(PageRequest.class)))
                .thenReturn(page);
        when(userProfileRepository.findAllById(List.of(10L))).thenReturn(List.of(authorProfile));

        QuestionImage qi1 = QuestionImage.builder().id(11L).question(q1).url("https://img1.png").sortOrder((short) 1).build();
        QuestionImage qi2 = QuestionImage.builder().id(12L).question(q1).url("https://img2.png").sortOrder((short) 2).build();
        when(questionImageRepository.findByQuestion_IdInOrderByQuestion_IdAscSortOrderAsc(List.of(1L)))
                .thenReturn(List.of(qi1, qi2));

        // When
        PageResponse<QuestionResponse> response = questionService.getQuestions(
                0, 10, null, null, null, null, null);

        // Then
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getImages()).containsExactly("https://img1.png", "https://img2.png");
    }

    @Test
    @DisplayName("UTCID13 - No question matches keyword -> Empty PageResponse")
    void utcid13_getQuestions_okNoMatch() {
        // Given
        when(questionRepository.findActiveQuestions(
                anyBoolean(), anyString(), anyBoolean(), anyList(), anyBoolean(), anyList(), any(PageRequest.class)))
                .thenReturn(Page.empty());

        // When
        PageResponse<QuestionResponse> response = questionService.getQuestions(
                0, 10, null, "zzz", null, null, null);

        // Then
        assertThat(response.getContent()).isEmpty();
        assertThat(response.getTotalElements()).isEqualTo(0);
    }

    // ================= getQuestionDetail() =================

    @Test
    @DisplayName("UTCID14 - Active question with 1 image and guest -> QuestionDetailResponse returned with voted false")
    void utcid14_getQuestionDetail_okGuest() {
        // Given
        when(questionRepository.findActiveDetailById(5L)).thenReturn(Optional.of(q5));
        when(userProfileRepository.findById(10L)).thenReturn(Optional.of(authorProfile));

        QuestionImage qi = QuestionImage.builder().id(51L).question(q5).url("https://img5.png").sortOrder((short) 1).build();
        when(questionImageRepository.findByQuestion_IdOrderBySortOrderAsc(5L)).thenReturn(List.of(qi));

        // When
        QuestionDetailResponse response = questionService.getQuestionDetail(5L, null);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("5");
        assertThat(response.isVoted()).isFalse();
        assertThat(response.getImages()).containsExactly("https://img5.png");
    }

    @Test
    @DisplayName("UTCID15 - Question 404 does not exist -> ResourceNotFoundException")
    void utcid15_getQuestionDetail_notFound() {
        // Given
        when(questionRepository.findActiveDetailById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> questionService.getQuestionDetail(404L, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy câu hỏi với id: 404");
    }

    @Test
    @DisplayName("UTCID16 - Viewer voted question 5 -> voted is true in QuestionDetailResponse")
    void utcid16_getQuestionDetail_okVoted() {
        // Given
        when(questionRepository.findActiveDetailById(5L)).thenReturn(Optional.of(q5));
        when(userProfileRepository.findById(10L)).thenReturn(Optional.of(authorProfile));
        when(questionImageRepository.findByQuestion_IdOrderBySortOrderAsc(5L)).thenReturn(Collections.emptyList());

        when(userRepository.findByEmail(VIEWER_EMAIL)).thenReturn(Optional.of(viewer));
        when(voteRepository.findVotedTargetIds(99L, VoteTargetType.QUESTION, List.of(5L)))
                .thenReturn(List.of(5L));

        // When
        QuestionDetailResponse response = questionService.getQuestionDetail(5L, VIEWER_EMAIL);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("5");
        assertThat(response.isVoted()).isTrue();
    }

    // ================= getTopics() =================

    @Test
    @DisplayName("UTCID17 - Two forum topics exist -> Returns 2 TopicResponse ordered by id ascending")
    void utcid17_getTopics_ok() {
        // Given
        ForumTopic t1 = ForumTopic.builder().id(1L).name("Java").build();
        ForumTopic t2 = ForumTopic.builder().id(2L).name("Spring").build();
        when(forumTopicRepository.findAllByOrderByIdAsc()).thenReturn(List.of(t1, t2));

        // When
        List<TopicResponse> topics = questionService.getTopics();

        // Then
        assertThat(topics).hasSize(2);
        assertThat(topics.get(0).getId()).isEqualTo(1L);
        assertThat(topics.get(0).getName()).isEqualTo("Java");
        assertThat(topics.get(1).getId()).isEqualTo(2L);
        assertThat(topics.get(1).getName()).isEqualTo("Spring");
    }
}
