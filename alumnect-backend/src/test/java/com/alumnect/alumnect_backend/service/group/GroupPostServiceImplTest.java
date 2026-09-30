package com.alumnect.alumnect_backend.service.group;

import com.alumnect.alumnect_backend.common.enums.GroupStatus;
import com.alumnect.alumnect_backend.common.enums.MembershipRole;
import com.alumnect.alumnect_backend.common.enums.MembershipStatus;
import com.alumnect.alumnect_backend.dao.group.*;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupCommentRequest;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupPostRequest;
import com.alumnect.alumnect_backend.entity.group.*;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GroupPostServiceImplTest {
    @Mock GroupPostRepository postRepository;
    @Mock GroupPostLikeRepository likeRepository;
    @Mock GroupPostCommentRepository commentRepository;
    @Mock CommunityGroupRepository groupRepository;
    @Mock GroupMemberRepository memberRepository;
    @Mock UserRepository userRepository;
    @Mock UserProfileRepository profileRepository;
    @InjectMocks GroupPostServiceImpl service;

    @Test
    void createPostStoresVideoAndRejectsMoreThanTenMedia() {
        User author = User.builder().id(7L).email("author@example.com").build();
        CommunityGroup group = CommunityGroup.builder().id(1L).status(GroupStatus.ACTIVE).build();
        GroupMember member = GroupMember.builder().user(author).role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE).build();
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(groupRepository.findVisibleById(1L)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(1L, 7L)).thenReturn(Optional.of(member));
        when(postRepository.save(any(GroupPost.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var request = CreateGroupPostRequest.builder().content("Nội dung")
                .imageUrls(List.of("image-url")).videoUrls(List.of("video-url")).build();
        var created = service.createPost(1L, author.getEmail(), request);
        assertEquals(List.of("video-url"), created.getVideoUrls());

        var tooMany = CreateGroupPostRequest.builder().content("Nội dung")
                .imageUrls(List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10"))
                .videoUrls(List.of("11")).build();
        assertThrows(BadRequestException.class, () -> service.createPost(1L, author.getEmail(), tooMany));
        verify(postRepository, times(1)).save(any(GroupPost.class));
    }

    @Test
    void replyToReplyIsAttachedToRootComment() {
        User author = User.builder().id(7L).email("author@example.com").build();
        CommunityGroup group = CommunityGroup.builder().id(1L).status(GroupStatus.ACTIVE).build();
        GroupMember member = GroupMember.builder().user(author).role(MembershipRole.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE).build();
        GroupPost post = GroupPost.builder().id(2L).group(group).author(author).build();
        GroupPostComment root = GroupPostComment.builder().id(3L).post(post).build();
        GroupPostComment reply = GroupPostComment.builder().id(4L).post(post).parentComment(root).build();
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(groupRepository.findVisibleById(1L)).thenReturn(Optional.of(group));
        when(memberRepository.findByGroupIdAndUserId(1L, 7L)).thenReturn(Optional.of(member));
        when(postRepository.findByIdAndGroupId(2L, 1L)).thenReturn(Optional.of(post));
        when(commentRepository.findByIdAndPostId(4L, 2L)).thenReturn(Optional.of(reply));
        when(commentRepository.save(any(GroupPostComment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var created = service.createComment(1L, 2L, author.getEmail(),
                CreateGroupCommentRequest.builder().content(" Trả lời ").parentId(4L).build());
        assertEquals(3L, created.getParentId());
        assertEquals("Trả lời", created.getContent());
    }

    @Test
    void deletingRootCommentDecrementsCountForItsReplies() {
        User author = User.builder().id(7L).email("author@example.com").build();
        CommunityGroup group = CommunityGroup.builder().id(1L).status(GroupStatus.ACTIVE).build();
        GroupPost post = GroupPost.builder().id(2L).group(group).author(author).build();
        GroupPostComment root = GroupPostComment.builder().id(3L).post(post).author(author).build();
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(groupRepository.findVisibleById(1L)).thenReturn(Optional.of(group));
        when(commentRepository.findByIdAndPostId(3L, 2L)).thenReturn(Optional.of(root));
        when(commentRepository.countByParentComment_Id(3L)).thenReturn(2L);

        service.deleteComment(1L, 2L, 3L, author.getEmail());

        verify(commentRepository).delete(root);
        verify(postRepository).decrementCommentCount(2L, 3);
    }
}
