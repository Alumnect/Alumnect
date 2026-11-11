package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.response.message.ChatUserProjection;
import com.alumnect.alumnect_backend.dto.response.message.ChatUserResponse;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.service.message.ChatServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;

/**
 * FE-66 Search Users for Chat.
 * Report sheet : FE-66 (Report5_Unit_Test.xlsx)
 * Functions    : ChatServiceImpl.searchUsersForChat()
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("FE-66 Search Users for Chat")
class FE66_SearchUsersForChatTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private ChatServiceImpl chatService;

    private static final String CURRENT_USER_EMAIL = "current@example.com";
    private static final Long CURRENT_USER_ID = 1L;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = User.builder()
                .id(CURRENT_USER_ID)
                .email(CURRENT_USER_EMAIL)
                .build();
    }

    // ================= searchUsersForChat() =================

    @Test
    @DisplayName("UTCID01 - Native search with null isFollowing -> Mapped to false")
    void utcid01_searchUsersForChat_ok() {
        // Given
        ChatUserProjection proj1 = mock(ChatUserProjection.class);
        when(proj1.getUserId()).thenReturn(2L);
        when(proj1.getEmail()).thenReturn("user2@example.com");
        when(proj1.getFullName()).thenReturn("Nguyen Van A");
        when(proj1.getAvatarUrl()).thenReturn("https://avatar1.png");
        when(proj1.getHeadline()).thenReturn("Dev");
        when(proj1.getMajor()).thenReturn("SE");
        when(proj1.getIsFollowing()).thenReturn(Boolean.TRUE);

        ChatUserProjection proj2 = mock(ChatUserProjection.class);
        when(proj2.getUserId()).thenReturn(3L);
        when(proj2.getEmail()).thenReturn("user3@example.com");
        when(proj2.getFullName()).thenReturn("Nguyen Van B");
        when(proj2.getAvatarUrl()).thenReturn("https://avatar2.png");
        when(proj2.getHeadline()).thenReturn("QA");
        when(proj2.getMajor()).thenReturn("IS");
        when(proj2.getIsFollowing()).thenReturn(null);

        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(userProfileRepository.searchUsersForChatNative(
                CURRENT_USER_ID, "nguyen", "nguyen%", "% nguyen%", "nguyen%", 25))
                .thenReturn(List.of(proj1, proj2));

        // When
        List<ChatUserResponse> result = chatService.searchUsersForChat(CURRENT_USER_EMAIL, "nguyen");

        // Then
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getUserId()).isEqualTo(2L);
        assertThat(result.get(0).isFollowing()).isTrue();
        assertThat(result.get(1).getUserId()).isEqualTo(3L);
        assertThat(result.get(1).isFollowing()).isFalse();
    }

    @Test
    @DisplayName("UTCID02 - Blank keyword -> Passes null keyword to native query")
    void utcid02_searchUsersForChat_okBlank() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(userProfileRepository.searchUsersForChatNative(
                CURRENT_USER_ID, null, "%", "% %", "%", 25))
                .thenReturn(Collections.emptyList());

        // When
        List<ChatUserResponse> result = chatService.searchUsersForChat(CURRENT_USER_EMAIL, "   ");

        // Then
        assertThat(result).isEmpty();
        verify(userProfileRepository).searchUsersForChatNative(CURRENT_USER_ID, null, "%", "% %", "%", 25);
    }

    @Test
    @DisplayName("UTCID03 - Accented keyword -> Generates unaccented patterns and query")
    void utcid03_searchUsersForChat_okAccented() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(userProfileRepository.searchUsersForChatNative(
                CURRENT_USER_ID, "Nguyễn", "nguyen%", "% nguyen%", "nguyễn%", 25))
                .thenReturn(Collections.emptyList());

        // When
        List<ChatUserResponse> result = chatService.searchUsersForChat(CURRENT_USER_EMAIL, "Nguyễn");

        // Then
        assertThat(result).isEmpty();
        verify(userProfileRepository).searchUsersForChatNative(
                CURRENT_USER_ID, "Nguyễn", "nguyen%", "% nguyen%", "nguyễn%", 25);
    }

    @Test
    @DisplayName("UTCID04 - Unknown email -> ResourceNotFoundException, native search not called")
    void utcid04_searchUsersForChat_userNotFound() {
        // Given
        when(userRepository.findByEmail("ghost@fpt.edu.vn")).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> chatService.searchUsersForChat("ghost@fpt.edu.vn", "nguyen"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng với email: ghost@fpt.edu.vn");
        verify(userProfileRepository, never()).searchUsersForChatNative(anyLong(), anyString(), anyString(), anyString(), anyString(), anyInt());
    }

    @Test
    @DisplayName("UTCID05 - Keyword matches nobody -> Empty list")
    void utcid05_searchUsersForChat_noMatch() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(userProfileRepository.searchUsersForChatNative(
                CURRENT_USER_ID, "zzzqqq", "zzzqqq%", "% zzzqqq%", "zzzqqq%", 25))
                .thenReturn(Collections.emptyList());

        // When
        List<ChatUserResponse> result = chatService.searchUsersForChat(CURRENT_USER_EMAIL, "zzzqqq");

        // Then
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("UTCID06 - Search is limited to 25 rows and scoped to the current user id")
    void utcid06_searchUsersForChat_limitAndUserId() {
        // Given
        when(userRepository.findByEmail(CURRENT_USER_EMAIL)).thenReturn(Optional.of(currentUser));
        when(userProfileRepository.searchUsersForChatNative(
                any(), any(), any(), any(), any(), anyInt())).thenReturn(Collections.emptyList());

        // When
        chatService.searchUsersForChat(CURRENT_USER_EMAIL, "an");

        // Then
        verify(userProfileRepository).searchUsersForChatNative(
                CURRENT_USER_ID, "an", "an%", "% an%", "an%", 25);
    }
}
