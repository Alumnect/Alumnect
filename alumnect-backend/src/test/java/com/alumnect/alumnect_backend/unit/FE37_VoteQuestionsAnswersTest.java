package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.AnswerStatus;
import com.alumnect.alumnect_backend.common.enums.QuestionStatus;
import com.alumnect.alumnect_backend.common.enums.VoteTargetType;
import com.alumnect.alumnect_backend.dao.forum.AnswerRepository;
import com.alumnect.alumnect_backend.dao.forum.QuestionRepository;
import com.alumnect.alumnect_backend.dao.forum.VoteRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.forum.VoteResponse;
import com.alumnect.alumnect_backend.entity.forum.Answer;
import com.alumnect.alumnect_backend.entity.forum.Question;
import com.alumnect.alumnect_backend.entity.forum.Vote;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.forum.AnswerServiceImpl;
import com.alumnect.alumnect_backend.service.forum.QuestionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("FE-37 Forum Q&A - Voting on Questions and Answers")
public class FE37_VoteQuestionsAnswersTest {

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private AnswerRepository answerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VoteRepository voteRepository;

    @InjectMocks
    private QuestionServiceImpl questionService;

    @InjectMocks
    private AnswerServiceImpl answerService;

    private static final String STUDENT_EMAIL = "student@fpt.edu.vn";
    private static final String ADMIN_EMAIL = "admin@fpt.edu.vn";

    private User studentUser;
    private User adminUser;
    private Question question10;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(questionService, "questionRepository", questionRepository);
        ReflectionTestUtils.setField(questionService, "userRepository", userRepository);
        ReflectionTestUtils.setField(questionService, "voteRepository", voteRepository);

        ReflectionTestUtils.setField(answerService, "answerRepository", answerRepository);
        ReflectionTestUtils.setField(answerService, "userRepository", userRepository);
        ReflectionTestUtils.setField(answerService, "voteRepository", voteRepository);

        Role studentRole = Role.builder().id(1L).name("STUDENT").build();
        Role adminRole = Role.builder().id(2L).name("ADMIN").build();

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

        question10 = Question.builder()
                .id(10L)
                .title("Sample Question 10")
                .body("Question details")
                .status(QuestionStatus.ACTIVE)
                .voteCount(4)
                .build();
    }

    // ================= Vote Question (UTCID01 - UTCID04) =================

    @Test
    @DisplayName("UTCID01 - Member has not voted question 10 (voteCount = 4) -> VoteResponse(voted = true, voteCount = 5); Vote saved; counter incremented in DB")
    void utcid01_voteQuestion_okFirstVote() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(voteRepository.existsByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.QUESTION, 10L)).thenReturn(false);

        // When
        VoteResponse response = questionService.voteQuestion(STUDENT_EMAIL, 10L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isVoted()).isTrue();
        assertThat(response.getVoteCount()).isEqualTo(5);

        ArgumentCaptor<Vote> voteCaptor = ArgumentCaptor.forClass(Vote.class);
        verify(voteRepository).save(voteCaptor.capture());
        Vote savedVote = voteCaptor.getValue();
        assertThat(savedVote.getUser()).isEqualTo(studentUser);
        assertThat(savedVote.getTargetType()).isEqualTo(VoteTargetType.QUESTION);
        assertThat(savedVote.getTargetId()).isEqualTo(10L);
        assertThat(savedVote.getValue()).isEqualTo((short) 1);

        verify(questionRepository).incrementVoteCount(10L);
    }

    @Test
    @DisplayName("UTCID02 - Member already voted question 10 -> Idempotent: voted = true, voteCount stays 4, no new Vote row, counter not incremented")
    void utcid02_voteQuestion_okAlreadyVoted() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(voteRepository.existsByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.QUESTION, 10L)).thenReturn(true);

        // When
        VoteResponse response = questionService.voteQuestion(STUDENT_EMAIL, 10L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isVoted()).isTrue();
        assertThat(response.getVoteCount()).isEqualTo(4);

        verify(voteRepository, never()).save(any());
        verify(questionRepository, never()).incrementVoteCount(any());
    }

    @Test
    @DisplayName("UTCID03 - Account role is ADMIN -> ForbiddenException: Chỉ sinh viên và cựu sinh viên mới được bình chọn câu hỏi")
    void utcid03_voteQuestion_forbiddenAdmin() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));

        // When + Then
        assertThatThrownBy(() -> questionService.voteQuestion(ADMIN_EMAIL, 10L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới được bình chọn câu hỏi");
        verify(questionRepository, never()).findActiveDetailById(any());
        verify(voteRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID04 - Question 404 does not exist or is not ACTIVE -> ResourceNotFoundException: Không tìm thấy câu hỏi với id: 404")
    void utcid04_voteQuestion_notFoundQuestion() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(404L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> questionService.voteQuestion(STUDENT_EMAIL, 404L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy câu hỏi với id: 404");
        verify(voteRepository, never()).existsByUserIdAndTargetTypeAndTargetId(any(), any(), any());
    }

    // ================= Unvote Question (UTCID05 - UTCID07) =================

    @Test
    @DisplayName("UTCID05 - Member voted question 10 (voteCount = 4) -> VoteResponse(voted = false, voteCount = 3); Vote deleted and counter decremented")
    void utcid05_unvoteQuestion_okVoted() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(voteRepository.existsByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.QUESTION, 10L)).thenReturn(true);

        // When
        VoteResponse response = questionService.unvoteQuestion(STUDENT_EMAIL, 10L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isVoted()).isFalse();
        assertThat(response.getVoteCount()).isEqualTo(3);

        verify(voteRepository).deleteByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.QUESTION, 10L);
        verify(questionRepository).decrementVoteCount(10L);
    }

    @Test
    @DisplayName("UTCID06 - Member never voted question 10 -> No-op: voted = false, voteCount stays 4, nothing deleted")
    void utcid06_unvoteQuestion_okNeverVoted() {
        // Given
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(question10));
        when(voteRepository.existsByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.QUESTION, 10L)).thenReturn(false);

        // When
        VoteResponse response = questionService.unvoteQuestion(STUDENT_EMAIL, 10L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isVoted()).isFalse();
        assertThat(response.getVoteCount()).isEqualTo(4);

        verify(voteRepository, never()).deleteByUserIdAndTargetTypeAndTargetId(any(), any(), any());
        verify(questionRepository, never()).decrementVoteCount(any());
    }

    @Test
    @DisplayName("UTCID07 - Member voted but cached voteCount is 0 -> voteCount never negative (stays 0)")
    void utcid07_unvoteQuestion_okFloorZero() {
        // Given
        Question qZero = Question.builder().id(10L).status(QuestionStatus.ACTIVE).voteCount(0).build();
        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(questionRepository.findActiveDetailById(10L)).thenReturn(Optional.of(qZero));
        when(voteRepository.existsByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.QUESTION, 10L)).thenReturn(true);

        // When
        VoteResponse response = questionService.unvoteQuestion(STUDENT_EMAIL, 10L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isVoted()).isFalse();
        assertThat(response.getVoteCount()).isEqualTo(0);

        verify(voteRepository).deleteByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.QUESTION, 10L);
        verify(questionRepository).decrementVoteCount(10L);
    }

    // ================= Vote Answer (UTCID08 - UTCID12) =================

    @Test
    @DisplayName("UTCID08 - Member has not voted answer 20 (voteCount = 4) -> VoteResponse(voted = true, voteCount = 5); Vote saved; counter incremented")
    void utcid08_voteAnswer_okFirstVote() {
        // Given
        Answer ans20 = Answer.builder()
                .id(20L)
                .question(question10)
                .status(AnswerStatus.ACTIVE)
                .voteCount(4)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(20L)).thenReturn(Optional.of(ans20));
        when(voteRepository.existsByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.ANSWER, 20L)).thenReturn(false);

        // When
        VoteResponse response = answerService.voteAnswer(STUDENT_EMAIL, 10L, 20L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isVoted()).isTrue();
        assertThat(response.getVoteCount()).isEqualTo(5);

        ArgumentCaptor<Vote> voteCaptor = ArgumentCaptor.forClass(Vote.class);
        verify(voteRepository).save(voteCaptor.capture());
        Vote savedVote = voteCaptor.getValue();
        assertThat(savedVote.getUser()).isEqualTo(studentUser);
        assertThat(savedVote.getTargetType()).isEqualTo(VoteTargetType.ANSWER);
        assertThat(savedVote.getTargetId()).isEqualTo(20L);
        assertThat(savedVote.getValue()).isEqualTo((short) 1);

        verify(answerRepository).incrementVoteCount(20L);
    }

    @Test
    @DisplayName("UTCID09 - Member already voted answer 20 -> Idempotent: voteCount stays 4; nothing saved")
    void utcid09_voteAnswer_okAlreadyVoted() {
        // Given
        Answer ans20 = Answer.builder()
                .id(20L)
                .question(question10)
                .status(AnswerStatus.ACTIVE)
                .voteCount(4)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(20L)).thenReturn(Optional.of(ans20));
        when(voteRepository.existsByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.ANSWER, 20L)).thenReturn(true);

        // When
        VoteResponse response = answerService.voteAnswer(STUDENT_EMAIL, 10L, 20L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isVoted()).isTrue();
        assertThat(response.getVoteCount()).isEqualTo(4);

        verify(voteRepository, never()).save(any());
        verify(answerRepository, never()).incrementVoteCount(any());
    }

    @Test
    @DisplayName("UTCID10 - Answer 20 belongs to question 10 but the URL uses question 99 -> ResourceNotFoundException: Không tìm thấy câu trả lời với id: 20")
    void utcid10_voteAnswer_notFoundDiffQuest() {
        // Given
        Answer ans20 = Answer.builder()
                .id(20L)
                .question(question10)
                .status(AnswerStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(20L)).thenReturn(Optional.of(ans20));

        // When + Then
        assertThatThrownBy(() -> answerService.voteAnswer(STUDENT_EMAIL, 99L, 20L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy câu trả lời với id: 20");
        verify(voteRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID11 - Answer 20 status is DELETED -> ResourceNotFoundException: Không tìm thấy câu trả lời với id: 20")
    void utcid11_voteAnswer_notFoundDeleted() {
        // Given
        Answer ans20 = Answer.builder()
                .id(20L)
                .question(question10)
                .status(AnswerStatus.DELETED)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(20L)).thenReturn(Optional.of(ans20));

        // When + Then
        assertThatThrownBy(() -> answerService.voteAnswer(STUDENT_EMAIL, 10L, 20L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy câu trả lời với id: 20");
        verify(voteRepository, never()).save(any());
    }

    @Test
    @DisplayName("UTCID12 - Account role is ADMIN -> ForbiddenException: Chỉ sinh viên và cựu sinh viên mới được bình chọn câu trả lời")
    void utcid12_voteAnswer_forbiddenAdmin() {
        // Given
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(adminUser));

        // When + Then
        assertThatThrownBy(() -> answerService.voteAnswer(ADMIN_EMAIL, 10L, 20L))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Chỉ sinh viên và cựu sinh viên mới được bình chọn câu trả lời");
        verify(answerRepository, never()).findById(any());
    }

    // ================= Unvote Answer (UTCID13 - UTCID15) =================

    @Test
    @DisplayName("UTCID13 - Member voted answer 20 (voteCount = 4) -> VoteResponse(voted = false, voteCount = 3); Vote deleted and counter decremented")
    void utcid13_unvoteAnswer_okVoted() {
        // Given
        Answer ans20 = Answer.builder()
                .id(20L)
                .question(question10)
                .status(AnswerStatus.ACTIVE)
                .voteCount(4)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(20L)).thenReturn(Optional.of(ans20));
        when(voteRepository.existsByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.ANSWER, 20L)).thenReturn(true);

        // When
        VoteResponse response = answerService.unvoteAnswer(STUDENT_EMAIL, 10L, 20L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isVoted()).isFalse();
        assertThat(response.getVoteCount()).isEqualTo(3);

        verify(voteRepository).deleteByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.ANSWER, 20L);
        verify(answerRepository).decrementVoteCount(20L);
    }

    @Test
    @DisplayName("UTCID14 - Member never voted answer 20 -> No-op: voteCount stays 4")
    void utcid14_unvoteAnswer_okNeverVoted() {
        // Given
        Answer ans20 = Answer.builder()
                .id(20L)
                .question(question10)
                .status(AnswerStatus.ACTIVE)
                .voteCount(4)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(20L)).thenReturn(Optional.of(ans20));
        when(voteRepository.existsByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.ANSWER, 20L)).thenReturn(false);

        // When
        VoteResponse response = answerService.unvoteAnswer(STUDENT_EMAIL, 10L, 20L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isVoted()).isFalse();
        assertThat(response.getVoteCount()).isEqualTo(4);

        verify(voteRepository, never()).deleteByUserIdAndTargetTypeAndTargetId(any(), any(), any());
        verify(answerRepository, never()).decrementVoteCount(any());
    }

    @Test
    @DisplayName("UTCID15 - Member voted answer 20 but cached voteCount is 0 -> voteCount never negative (stays 0)")
    void utcid15_unvoteAnswer_okFloorZero() {
        // Given
        Answer ans20 = Answer.builder()
                .id(20L)
                .question(question10)
                .status(AnswerStatus.ACTIVE)
                .voteCount(0)
                .build();

        when(userRepository.findByEmail(STUDENT_EMAIL)).thenReturn(Optional.of(studentUser));
        when(answerRepository.findById(20L)).thenReturn(Optional.of(ans20));
        when(voteRepository.existsByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.ANSWER, 20L)).thenReturn(true);

        // When
        VoteResponse response = answerService.unvoteAnswer(STUDENT_EMAIL, 10L, 20L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.isVoted()).isFalse();
        assertThat(response.getVoteCount()).isEqualTo(0);

        verify(voteRepository).deleteByUserIdAndTargetTypeAndTargetId(studentUser.getId(), VoteTargetType.ANSWER, 20L);
        verify(answerRepository).decrementVoteCount(20L);
    }
}
