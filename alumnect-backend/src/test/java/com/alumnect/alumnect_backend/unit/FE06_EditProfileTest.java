package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.FollowRepository;
import com.alumnect.alumnect_backend.dao.user.MajorRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.user.UserSkillRepository;
import com.alumnect.alumnect_backend.dto.request.user.UpdateProfileRequest;
import com.alumnect.alumnect_backend.dto.request.user.UserSkillRequest;
import com.alumnect.alumnect_backend.dto.response.user.UserProfileResponse;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.user.UserProfileMapper;
import com.alumnect.alumnect_backend.service.user.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-06 Edit Profile & Manage Skills.
 * Report sheet : FE-06 (Report5_Unit_Test.xlsx)
 * Functions    : UserServiceImpl.updateOwnProfile()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-06 Edit Profile & Manage Skills")
class FE06_EditProfileTest {

    // ===== Mocks (dependencies) =====
    @Mock UserRepository userRepository;
    @Mock UserProfileRepository userProfileRepository;
    @Mock UserProfileMapper userProfileMapper;
    @Mock BCryptPasswordEncoder passwordEncoder;
    @Mock ExperienceRepository experienceRepository;
    @Mock MajorRepository majorRepository;
    @Mock UserSkillRepository userSkillRepository;
    @Mock FollowRepository followRepository;

    // ===== System under test =====
    private UserServiceImpl userService;

    // ===== Test data =====
    private static final String EMAIL = "student@fpt.edu.vn";
    private User user;
    private UserProfile profile;

    @BeforeEach
    void setUp() {
        userService = new UserServiceImpl(
                userRepository,
                userProfileRepository,
                userProfileMapper,
                passwordEncoder,
                experienceRepository,
                majorRepository,
                userSkillRepository,
                followRepository
        );

        profile = UserProfile.builder().userId(1L).fullName("Nguyen Van A").build();
        user = User.builder()
                .id(1L)
                .email(EMAIL)
                .accountStatus(AccountStatus.ACTIVE)
                .profile(profile)
                .build();
    }

    // ================= updateOwnProfile() =================

    @Test
    @DisplayName("UTCID01 - Update with majorId=1 & 2 skills -> profile saved, old skills deleted, 2 skills saved")
    void utcid01_updateOwnProfile_ok() {
        // Given
        UserSkillRequest s1 = UserSkillRequest.builder().groupName("Tech").skillName("Java").sortOrder((short) 1).build();
        UserSkillRequest s2 = UserSkillRequest.builder().groupName("Tech").skillName("React").sortOrder((short) 2).build();
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Nguyen Van A Updated")
                .majorId(1L)
                .skills(List.of(s1, s2))
                .build();

        Major major = Major.builder().id(1L).build();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(majorRepository.findById(1L)).thenReturn(Optional.of(major));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        UserProfileResponse res = new UserProfileResponse();
        when(userProfileMapper.toResponse(profile)).thenReturn(res);
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(1L)).thenReturn(Optional.empty());

        // When
        UserProfileResponse response = userService.updateOwnProfile(EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        verify(userProfileMapper).updateEntityFromRequest(request, profile);
        ArgumentCaptor<UserProfile> profileCaptor = ArgumentCaptor.forClass(UserProfile.class);
        verify(userProfileRepository).save(profileCaptor.capture());
        assertThat(profileCaptor.getValue().getMajor()).isEqualTo(major);

        verify(userSkillRepository).deleteByUserId(1L);
        verify(userSkillRepository).flush();
        verify(userSkillRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("UTCID02 - majorId = null & skills = null -> major cleared null, skills untouched")
    void utcid02_updateOwnProfile_okClearMajor() {
        // Given
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Nguyen Van A")
                .majorId(null)
                .skills(null)
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        UserProfileResponse res = new UserProfileResponse();
        when(userProfileMapper.toResponse(profile)).thenReturn(res);
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(1L)).thenReturn(Optional.empty());

        // When
        UserProfileResponse response = userService.updateOwnProfile(EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        ArgumentCaptor<UserProfile> captor = ArgumentCaptor.forClass(UserProfile.class);
        verify(userProfileRepository).save(captor.capture());
        assertThat(captor.getValue().getMajor()).isNull();

        verify(userSkillRepository, never()).deleteByUserId(any());
        verify(userSkillRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("UTCID03 - Major ID 99 does not exist -> ResourceNotFoundException")
    void utcid03_updateOwnProfile_notFoundMajor() {
        // Given
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Nguyen Van A")
                .majorId(99L)
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(majorRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThatThrownBy(() -> userService.updateOwnProfile(EMAIL, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Không tìm thấy chuyên ngành với ID: 99");

        verify(userProfileRepository, never()).save(any());
        verify(userSkillRepository, never()).deleteByUserId(any());
    }

    @Test
    @DisplayName("UTCID04 - skills = empty list -> existing skills deleted and nothing inserted")
    void utcid04_updateOwnProfile_okEmptySkills() {
        // Given
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Nguyen Van A")
                .skills(Collections.emptyList())
                .build();

        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(profile);
        when(userProfileRepository.findById(1L)).thenReturn(Optional.of(profile));
        UserProfileResponse res = new UserProfileResponse();
        when(userProfileMapper.toResponse(profile)).thenReturn(res);
        when(experienceRepository.findByUserIdAndIsPrimaryTrue(1L)).thenReturn(Optional.empty());

        // When
        UserProfileResponse response = userService.updateOwnProfile(EMAIL, request);

        // Then
        assertThat(response).isNotNull();
        verify(userSkillRepository).deleteByUserId(1L);
        verify(userSkillRepository).flush();
        verify(userSkillRepository, never()).saveAll(any());
    }
}
