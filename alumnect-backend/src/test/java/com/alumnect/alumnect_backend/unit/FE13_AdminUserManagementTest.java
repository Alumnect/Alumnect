package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.mentorship.MentorProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.admin.AdminUpdateUserStatusDto;
import com.alumnect.alumnect_backend.dto.response.admin.AdminUserDto;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.admin.AdminMapper;
import com.alumnect.alumnect_backend.service.admin.AdminUserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-13_User Account Management.
 * Report sheet : FE-13 (Report5_Unit_Test.xlsx)
 * Functions    : AdminUserServiceImpl.getUsers(), AdminUserServiceImpl.getUserById(), AdminUserServiceImpl.updateUserStatus()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-13 User Account Management")
class FE13_AdminUserManagementTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private MentorProfileRepository mentorProfileRepository;

    @Mock
    private AdminMapper adminMapper;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private User user1;
    private User user2;
    private UserProfile profile1;
    private UserProfile profile2;
    private Role studentRole;

    @BeforeEach
    void setUp() {
        studentRole = Role.builder().id(1L).name("STUDENT").build();

        user1 = User.builder()
                .id(1L)
                .email("user1@fpt.edu.vn")
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .emailVerified(true)
                .build();

        user2 = User.builder()
                .id(2L)
                .email("user2@fpt.edu.vn")
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .emailVerified(true)
                .build();

        profile1 = UserProfile.builder()
                .userId(1L)
                .fullName("Nguyen Van A")
                .studentCode("SE1001")
                .build();

        profile2 = UserProfile.builder()
                .userId(2L)
                .fullName("Nguyen Van B")
                .studentCode("SE1002")
                .build();
    }

    // ================= getUsers =================

    @Test
    @DisplayName("UTCID01 - Filters match 2 users, user 1 has mentor profile and user 2 does not")
    @SuppressWarnings("unchecked")
    void utcid01_getUsers_twoUsersMentorAndNonMentor() {
        // Given
        Page<User> page = new PageImpl<>(List.of(user1, user2), PageRequest.of(0, 10), 2);
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(userProfileRepository.findAllById(List.of(1L, 2L))).thenReturn(List.of(profile1, profile2));

        MentorProfile mp1 = MentorProfile.builder().id(55L).user(user1).build();
        when(mentorProfileRepository.findByUserIdIn(List.of(1L, 2L))).thenReturn(List.of(mp1));

        AdminUserDto dto1 = AdminUserDto.builder().id(1L).email("user1@fpt.edu.vn").build();
        AdminUserDto dto2 = AdminUserDto.builder().id(2L).email("user2@fpt.edu.vn").build();
        when(adminMapper.toDto(user1, profile1)).thenReturn(dto1);
        when(adminMapper.toDto(user2, profile2)).thenReturn(dto2);

        // When
        PageResponse<AdminUserDto> response = adminUserService.getUsers("nguyen", "STUDENT", "ACTIVE", 1L, 2020, 0, 10);

        // Then
        assertThat(response.getContent()).hasSize(2);
        assertThat(response.getContent().get(0).getHasMentorProfile()).isTrue();
        assertThat(response.getContent().get(0).getMentorProfileId()).isEqualTo(55L);
        assertThat(response.getContent().get(1).getHasMentorProfile()).isFalse();
    }

    @Test
    @DisplayName("UTCID02 - No user matches filter -> empty PageResponse, skip profile lookups")
    @SuppressWarnings("unchecked")
    void utcid02_getUsers_noMatchesSkipsLookups() {
        // Given
        Page<User> emptyPage = new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0);
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        // When
        PageResponse<AdminUserDto> response = adminUserService.getUsers("zzz", null, null, null, null, 0, 10);

        // Then
        assertThat(response.getContent()).isEmpty();
        verify(userProfileRepository, never()).findAllById(anyList());
        verify(mentorProfileRepository, never()).findByUserIdIn(anyList());
    }

    @Test
    @DisplayName("UTCID03 - Duplicate mentor profiles for one user -> merge keeps first without exception")
    @SuppressWarnings("unchecked")
    void utcid03_getUsers_duplicateMentorProfilesMerged() {
        // Given
        Page<User> page = new PageImpl<>(List.of(user1), PageRequest.of(0, 10), 1);
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(userProfileRepository.findAllById(List.of(1L))).thenReturn(List.of(profile1));

        MentorProfile mpFirst = MentorProfile.builder().id(55L).user(user1).build();
        MentorProfile mpSecond = MentorProfile.builder().id(56L).user(user1).build();
        when(mentorProfileRepository.findByUserIdIn(List.of(1L))).thenReturn(List.of(mpFirst, mpSecond));

        AdminUserDto dto = AdminUserDto.builder().id(1L).email("user1@fpt.edu.vn").build();
        when(adminMapper.toDto(user1, profile1)).thenReturn(dto);

        // When
        PageResponse<AdminUserDto> response = adminUserService.getUsers(null, null, null, null, null, 0, 10);

        // Then
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getHasMentorProfile()).isTrue();
        assertThat(response.getContent().get(0).getMentorProfileId()).isEqualTo(55L);
    }

    @Test
    @DisplayName("UTCID04 - Exactly 1 user in system -> PageResponse page=0, size=1, totalPages=1, last=true")
    @SuppressWarnings("unchecked")
    void utcid04_getUsers_singleUserPaginationBoundary() {
        // Given
        Page<User> page = new PageImpl<>(List.of(user1), PageRequest.of(0, 1), 1);
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(userProfileRepository.findAllById(List.of(1L))).thenReturn(List.of(profile1));
        when(mentorProfileRepository.findByUserIdIn(List.of(1L))).thenReturn(Collections.emptyList());

        AdminUserDto dto = AdminUserDto.builder().id(1L).build();
        when(adminMapper.toDto(user1, profile1)).thenReturn(dto);

        // When
        PageResponse<AdminUserDto> response = adminUserService.getUsers(null, null, null, null, null, 0, 1);

        // Then
        assertThat(response.getPageNumber()).isEqualTo(0);
        assertThat(response.getPageSize()).isEqualTo(1);
        assertThat(response.getTotalPages()).isEqualTo(1);
        assertThat(response.isLast()).isTrue();
    }

    // ================= getUserById =================

    @Test
    @DisplayName("UTCID05 - User and profile exist, user owns mentor profile id 55")
    void utcid05_getUserById_hasMentorProfile() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile1));
        MentorProfile mp = MentorProfile.builder().id(55L).user(user1).build();
        when(mentorProfileRepository.findByUserId(1L)).thenReturn(Optional.of(mp));

        AdminUserDto dto = AdminUserDto.builder().id(1L).build();
        when(adminMapper.toDto(user1, profile1)).thenReturn(dto);

        // When
        AdminUserDto result = adminUserService.getUserById(1L);

        // Then
        assertThat(result.getHasMentorProfile()).isTrue();
        assertThat(result.getMentorProfileId()).isEqualTo(55L);
    }

    @Test
    @DisplayName("UTCID06 - User and profile exist, no mentor profile")
    void utcid06_getUserById_noMentorProfile() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile1));
        when(mentorProfileRepository.findByUserId(1L)).thenReturn(Optional.empty());

        AdminUserDto dto = AdminUserDto.builder().id(1L).build();
        when(adminMapper.toDto(user1, profile1)).thenReturn(dto);

        // When
        AdminUserDto result = adminUserService.getUserById(1L);

        // Then
        assertThat(result.getHasMentorProfile()).isFalse();
        assertThat(result.getMentorProfileId()).isNull();
    }

    @Test
    @DisplayName("UTCID07 - User not found -> ResourceNotFoundException")
    void utcid07_getUserById_userNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> adminUserService.getUserById(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng với ID: 999");
    }

    @Test
    @DisplayName("UTCID08 - User exists but profile not found -> ResourceNotFoundException")
    void utcid08_getUserById_profileNotFound() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        when(userProfileRepository.findById(1L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> adminUserService.getUserById(1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy hồ sơ cho người dùng với ID: 1");
    }

    // ================= updateUserStatus =================

    @Test
    @DisplayName("UTCID09 - ACTIVE user 1 -> lock account saves user with LOCKED")
    void utcid09_updateUserStatus_lockAccount() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        AdminUpdateUserStatusDto request = new AdminUpdateUserStatusDto();
        request.setStatus("LOCKED");

        // When
        adminUserService.updateUserStatus(1L, request);

        // Then
        assertThat(user1.getAccountStatus()).isEqualTo(AccountStatus.LOCKED);
        verify(userRepository).save(user1);
    }

    @Test
    @DisplayName("UTCID10 - LOCKED user 1 -> unlock with lower-case status 'active' is case-insensitive")
    void utcid10_updateUserStatus_caseInsensitiveActive() {
        // Given
        user1.setAccountStatus(AccountStatus.LOCKED);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        AdminUpdateUserStatusDto request = new AdminUpdateUserStatusDto();
        request.setStatus("active");

        // When
        adminUserService.updateUserStatus(1L, request);

        // Then
        assertThat(user1.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
        verify(userRepository).save(user1);
    }

    @Test
    @DisplayName("UTCID11 - Invalid status 'BANNED' -> BadRequestException")
    void utcid11_updateUserStatus_invalidStatusBanned() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(user1));
        AdminUpdateUserStatusDto request = new AdminUpdateUserStatusDto();
        request.setStatus("BANNED");

        // When + Then
        assertThatThrownBy(() -> adminUserService.updateUserStatus(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Trạng thái tài khoản không hợp lệ: BANNED");
    }

    @Test
    @DisplayName("UTCID12 - User not found 999 -> ResourceNotFoundException")
    void utcid12_updateUserStatus_userNotFound() {
        // Given
        when(userRepository.findById(999L)).thenReturn(Optional.empty());
        AdminUpdateUserStatusDto request = new AdminUpdateUserStatusDto();
        request.setStatus("LOCKED");

        // When + Then
        assertThatThrownBy(() -> adminUserService.updateUserStatus(999L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy người dùng với ID: 999");
    }
}
