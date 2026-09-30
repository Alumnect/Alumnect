package com.alumnect.alumnect_backend.service.group;

import com.alumnect.alumnect_backend.common.enums.MembershipRole;
import com.alumnect.alumnect_backend.common.enums.MembershipStatus;
import com.alumnect.alumnect_backend.dao.group.CommunityGroupRepository;
import com.alumnect.alumnect_backend.dao.group.GroupMemberRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import com.alumnect.alumnect_backend.entity.group.GroupMember;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.mapper.group.GroupMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupServiceImplTest {
    @Mock CommunityGroupRepository groupRepository;
    @Mock GroupMemberRepository memberRepository;
    @Mock UserRepository userRepository;
    @Mock UserProfileRepository profileRepository;
    @Mock GroupMapper groupMapper;
    @InjectMocks GroupServiceImpl service;

    @Test
    void cannotAssignSecondActiveAdmin() {
        User owner = User.builder().id(1L).email("owner@example.com").build();
        User candidate = User.builder().id(2L).build();
        CommunityGroup group = CommunityGroup.builder().id(10L).owner(owner).build();
        GroupMember ownerMember = GroupMember.builder().role(MembershipRole.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE).build();
        GroupMember target = GroupMember.builder().user(candidate).role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE).build();
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(groupRepository.findVisibleById(10L)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(10L, 1L)).thenReturn(Optional.of(ownerMember));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(10L, 2L)).thenReturn(Optional.of(target));
        when(memberRepository.countByGroupIdAndRoleAndMembershipStatus(
                10L, MembershipRole.ADMIN, MembershipStatus.ACTIVE)).thenReturn(1L);

        assertThrows(BadRequestException.class,
                () -> service.changeMemberRole(10L, 2L, owner.getEmail(), MembershipRole.ADMIN));
        verify(memberRepository, never()).save(target);
    }

    @Test
    void transferringOwnershipReleasesOldOwnerSlotFirst() {
        User owner = User.builder().id(1L).email("owner@example.com").build();
        User successor = User.builder().id(2L).build();
        CommunityGroup group = CommunityGroup.builder().id(10L).owner(owner).memberCount(2).build();
        GroupMember ownerMember = GroupMember.builder().user(owner).role(MembershipRole.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE).build();
        GroupMember successorMember = GroupMember.builder().user(successor).role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE).build();
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(groupRepository.findVisibleById(10L)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(10L, 1L)).thenReturn(Optional.of(ownerMember));
        when(memberRepository.findByGroupIdAndUserIdForUpdate(10L, 2L)).thenReturn(Optional.of(successorMember));
        when(memberRepository.countByGroupIdAndMembershipStatus(10L, MembershipStatus.ACTIVE)).thenReturn(2L);

        service.leaveGroup(10L, owner.getEmail(), 2L);

        var order = inOrder(memberRepository);
        order.verify(memberRepository).saveAndFlush(ownerMember);
        order.verify(memberRepository).save(successorMember);
    }
}
