package com.alumnect.alumnect_backend.service.group;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.GroupPrivacy;
import com.alumnect.alumnect_backend.common.enums.GroupStatus;
import com.alumnect.alumnect_backend.common.enums.MembershipRole;
import com.alumnect.alumnect_backend.common.enums.MembershipStatus;
import com.alumnect.alumnect_backend.dao.group.CommunityGroupRepository;
import com.alumnect.alumnect_backend.dao.group.GroupMemberRepository;
import com.alumnect.alumnect_backend.dao.group.GroupPostCommentRepository;
import com.alumnect.alumnect_backend.dao.group.GroupPostLikeRepository;
import com.alumnect.alumnect_backend.dao.group.GroupPostRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupCommentRequest;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupPostRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupPostRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupCommentRequest;
import com.alumnect.alumnect_backend.dto.response.group.GroupCommentResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupPostAuthorResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupPostLikeResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupPostResponse;
import com.alumnect.alumnect_backend.entity.group.CommunityGroup;
import com.alumnect.alumnect_backend.entity.group.GroupMember;
import com.alumnect.alumnect_backend.entity.group.GroupPost;
import com.alumnect.alumnect_backend.entity.group.GroupPostComment;
import com.alumnect.alumnect_backend.entity.group.GroupPostLike;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Triển khai nghiệp vụ bài viết và thảo luận trong hội nhóm (Group Posts).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GroupPostServiceImpl implements GroupPostService {

    private final GroupPostRepository groupPostRepository;
    private final GroupPostLikeRepository groupPostLikeRepository;
    private final GroupPostCommentRepository groupPostCommentRepository;
    private final CommunityGroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GroupPostResponse> listPosts(Long groupId, String viewerEmail, int page, int size, String topic) {
        CommunityGroup group = getVisibleGroup(groupId);
        User viewer = viewerEmail != null ? getUserByEmailOrNull(viewerEmail) : null;
        GroupMember viewerMember = viewer != null
                ? groupMemberRepository.findByGroupIdAndUserId(groupId, viewer.getId()).orElse(null)
                : null;
        boolean isActiveMember = viewerMember != null && viewerMember.getMembershipStatus() == MembershipStatus.ACTIVE;

        // Kiểm tra quyền xem nội dung nhóm riêng tư
        if (group.getPrivacy() == GroupPrivacy.PRIVATE && !isActiveMember) {
            throw new ForbiddenException("Chỉ thành viên mới có quyền xem bài viết và thảo luận của hội nhóm riêng tư.");
        }

        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        Page<GroupPost> postPage;
        if (topic == null || topic.isBlank()) {
            postPage = groupPostRepository.findByGroupIdOrderByPinnedAndRecent(groupId, pageable);
        } else {
            String requestedTopic = topic.trim();
            String groupTopic = Optional.ofNullable(group.getTopics()).orElseGet(Collections::emptyList).stream()
                    .filter(candidate -> candidate.equalsIgnoreCase(requestedTopic))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Chủ đề đã chọn không thuộc hội nhóm này."));
            postPage = groupPostRepository.findByGroupIdAndTopicOrderByPinnedAndRecent(groupId, groupTopic, pageable);
        }

        if (postPage.isEmpty()) {
            return PageResponse.<GroupPostResponse>builder()
                    .content(Collections.emptyList())
                    .pageNumber(postPage.getNumber())
                    .pageSize(postPage.getSize())
                    .totalElements(0)
                    .totalPages(0)
                    .last(true)
                    .build();
        }

        List<GroupPost> posts = postPage.getContent();
        Set<Long> authorIds = posts.stream().map(p -> p.getAuthor().getId()).collect(Collectors.toSet());
        Set<Long> postIds = posts.stream().map(GroupPost::getId).collect(Collectors.toSet());

        // Tải trước hồ sơ tác giả và vai trò hội nhóm
        Map<Long, UserProfile> profileMap = userProfileRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));
        Map<Long, GroupMember> authorMemberMap = groupMemberRepository.findByUserIdAndGroupIdIn(authorIds.iterator().next(), List.of(groupId)).stream()
                .collect(Collectors.toMap(m -> m.getUser().getId(), Function.identity()));
        if (authorIds.size() > 1) {
            authorMemberMap = authorIds.stream()
                    .map(uid -> groupMemberRepository.findByGroupIdAndUserId(groupId, uid).orElse(null))
                    .filter(java.util.Objects::nonNull)
                    .collect(Collectors.toMap(m -> m.getUser().getId(), Function.identity()));
        }

        // Kiểm tra các bài viết người xem đã thích
        Set<Long> likedPostIds = (viewer != null)
                ? groupPostLikeRepository.findByUserIdAndPostIdIn(viewer.getId(), postIds).stream()
                .map(l -> l.getPost().getId())
                .collect(Collectors.toSet())
                : Collections.emptySet();

        boolean isViewerManager = isActiveMember && (viewerMember.getRole() == MembershipRole.OWNER || viewerMember.getRole() == MembershipRole.ADMIN);

        Map<Long, GroupMember> finalAuthorMemberMap = authorMemberMap;
        List<GroupPostResponse> responses = posts.stream().map(p -> {
            Long authorId = p.getAuthor().getId();
            UserProfile authorProfile = profileMap.get(authorId);
            GroupMember authorMember = finalAuthorMemberMap.get(authorId);
            boolean isAuthor = viewer != null && viewer.getId().equals(authorId);

            return GroupPostResponse.builder()
                    .id(p.getId())
                    .groupId(groupId)
                    .author(toAuthorResponse(p.getAuthor(), authorProfile, authorMember))
                    .content(p.getContent())
                    .topic(p.getTopic())
                    .imageUrls(p.getImageUrls() != null ? p.getImageUrls() : Collections.emptyList())
                    .videoUrls(p.getVideoUrls() != null ? p.getVideoUrls() : Collections.emptyList())
                    .isPinned(p.isPinned())
                    .likeCount(p.getLikeCount())
                    .commentCount(p.getCommentCount())
                    .likedByViewer(likedPostIds.contains(p.getId()))
                    .canPin(isViewerManager)
                    .canEdit(isAuthor)
                    .canDelete(isAuthor || isViewerManager)
                    .createdAt(p.getCreatedAt())
                    .updatedAt(p.getUpdatedAt())
                    .build();
        }).toList();

        return PageResponse.<GroupPostResponse>builder()
                .content(responses)
                .pageNumber(postPage.getNumber())
                .pageSize(postPage.getSize())
                .totalElements(postPage.getTotalElements())
                .totalPages(postPage.getTotalPages())
                .last(postPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public GroupPostResponse getPostDetail(Long groupId, Long postId, String viewerEmail) {
        CommunityGroup group = getVisibleGroup(groupId);
        User viewer = viewerEmail != null ? getUserByEmailOrNull(viewerEmail) : null;
        GroupMember viewerMember = viewer != null
                ? groupMemberRepository.findByGroupIdAndUserId(groupId, viewer.getId()).orElse(null)
                : null;
        boolean isActiveMember = viewerMember != null && viewerMember.getMembershipStatus() == MembershipStatus.ACTIVE;

        if (group.getPrivacy() == GroupPrivacy.PRIVATE && !isActiveMember) {
            throw new ForbiddenException("Chỉ thành viên mới có quyền xem bài viết của hội nhóm riêng tư.");
        }

        GroupPost post = groupPostRepository.findByIdAndGroupId(postId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại trong hội nhóm này."));

        Long authorId = post.getAuthor().getId();
        UserProfile authorProfile = userProfileRepository.findById(authorId).orElse(null);
        GroupMember authorMember = groupMemberRepository.findByGroupIdAndUserId(groupId, authorId).orElse(null);

        boolean liked = viewer != null && groupPostLikeRepository.existsByPostIdAndUserId(postId, viewer.getId());
        boolean isAuthor = viewer != null && viewer.getId().equals(authorId);
        boolean isViewerManager = isActiveMember && (viewerMember.getRole() == MembershipRole.OWNER || viewerMember.getRole() == MembershipRole.ADMIN);

        return GroupPostResponse.builder()
                .id(post.getId())
                .groupId(groupId)
                .author(toAuthorResponse(post.getAuthor(), authorProfile, authorMember))
                .content(post.getContent())
                .topic(post.getTopic())
                .imageUrls(post.getImageUrls() != null ? post.getImageUrls() : Collections.emptyList())
                .videoUrls(post.getVideoUrls() != null ? post.getVideoUrls() : Collections.emptyList())
                .isPinned(post.isPinned())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .likedByViewer(liked)
                .canPin(isViewerManager)
                .canEdit(isAuthor)
                .canDelete(isAuthor || isViewerManager)
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public GroupPostResponse createPost(Long groupId, String authorEmail, CreateGroupPostRequest request) {
        User author = getUserByEmail(authorEmail);
        CommunityGroup group = getVisibleGroup(groupId);
        checkGroupActive(group);
        GroupMember member = checkMemberActive(groupId, author.getId(), "Chỉ thành viên của hội nhóm mới có quyền đăng bài thảo luận.");

        List<String> cleanImages = sanitizeImages(request.getImageUrls());
        List<String> cleanVideos = sanitizeVideos(request.getVideoUrls());
        validateMediaCount(cleanImages, cleanVideos);
        String topic = resolveGroupTopic(group, request.getTopic());

        GroupPost post = GroupPost.builder()
                .group(group)
                .author(author)
                .content(request.getContent().trim())
                .topic(topic)
                .imageUrls(cleanImages)
                .videoUrls(cleanVideos)
                .isPinned(false)
                .likeCount(0)
                .commentCount(0)
                .build();

        GroupPost saved = groupPostRepository.save(post);
        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);

        boolean isManager = member.getRole() == MembershipRole.OWNER || member.getRole() == MembershipRole.ADMIN;

        return GroupPostResponse.builder()
                .id(saved.getId())
                .groupId(groupId)
                .author(toAuthorResponse(author, profile, member))
                .content(saved.getContent())
                .topic(saved.getTopic())
                .imageUrls(saved.getImageUrls() != null ? saved.getImageUrls() : Collections.emptyList())
                .videoUrls(saved.getVideoUrls() != null ? saved.getVideoUrls() : Collections.emptyList())
                .isPinned(saved.isPinned())
                .likeCount(0)
                .commentCount(0)
                .likedByViewer(false)
                .canPin(isManager)
                .canEdit(true)
                .canDelete(true)
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public GroupPostResponse updatePost(Long groupId, Long postId, String authorEmail, UpdateGroupPostRequest request) {
        User author = getUserByEmail(authorEmail);
        CommunityGroup group = getVisibleGroup(groupId);
        checkGroupActive(group);

        GroupPost post = groupPostRepository.findByIdAndGroupId(postId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại trong hội nhóm này."));

        if (!post.getAuthor().getId().equals(author.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể chỉnh sửa bài viết do chính mình đăng.");
        }

        post.setContent(request.getContent().trim());
        post.setTopic(resolveGroupTopic(group, request.getTopic()));
        List<String> cleanImages = sanitizeImages(request.getImageUrls());
        List<String> cleanVideos = sanitizeVideos(request.getVideoUrls());
        validateMediaCount(cleanImages, cleanVideos);
        post.setImageUrls(cleanImages);
        post.setVideoUrls(cleanVideos);
        GroupPost saved = groupPostRepository.save(post);

        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, author.getId()).orElse(null);
        boolean isManager = member != null && member.getMembershipStatus() == MembershipStatus.ACTIVE &&
                (member.getRole() == MembershipRole.OWNER || member.getRole() == MembershipRole.ADMIN);
        boolean liked = groupPostLikeRepository.existsByPostIdAndUserId(postId, author.getId());

        return GroupPostResponse.builder()
                .id(saved.getId())
                .groupId(groupId)
                .author(toAuthorResponse(author, profile, member))
                .content(saved.getContent())
                .topic(saved.getTopic())
                .imageUrls(saved.getImageUrls() != null ? saved.getImageUrls() : Collections.emptyList())
                .videoUrls(saved.getVideoUrls() != null ? saved.getVideoUrls() : Collections.emptyList())
                .isPinned(saved.isPinned())
                .likeCount(saved.getLikeCount())
                .commentCount(saved.getCommentCount())
                .likedByViewer(liked)
                .canPin(isManager)
                .canEdit(true)
                .canDelete(true)
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deletePost(Long groupId, Long postId, String userEmail) {
        User user = getUserByEmail(userEmail);
        CommunityGroup group = getVisibleGroup(groupId);
        checkGroupActive(group);

        GroupPost post = groupPostRepository.findByIdAndGroupId(postId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại trong hội nhóm này."));

        boolean isAuthor = post.getAuthor().getId().equals(user.getId());
        boolean isManager = isGroupManager(groupId, user.getId());

        if (!isAuthor && !isManager) {
            throw new ForbiddenException("Bạn không có quyền xóa bài viết này.");
        }

        groupPostRepository.delete(post);
        log.info("Xóa bài viết hội nhóm thành công: postId={}, groupId={}, deletedBy={}", postId, groupId, user.getId());
    }

    @Override
    @Transactional
    public GroupPostLikeResponse toggleLike(Long groupId, Long postId, String userEmail) {
        User user = getUserByEmail(userEmail);
        CommunityGroup group = getVisibleGroup(groupId);
        checkGroupActive(group);
        checkMemberActive(groupId, user.getId(), "Vui lòng tham gia hội nhóm để thích bài viết.");

        GroupPost post = groupPostRepository.findByIdAndGroupId(postId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại trong hội nhóm này."));

        Optional<GroupPostLike> likeOpt = groupPostLikeRepository.findByPostIdAndUserId(postId, user.getId());
        boolean liked;
        int count = post.getLikeCount();

        if (likeOpt.isPresent()) {
            groupPostLikeRepository.delete(likeOpt.get());
            groupPostRepository.decrementLikeCount(postId);
            liked = false;
            count = Math.max(0, count - 1);
        } else {
            GroupPostLike newLike = GroupPostLike.builder()
                    .post(post)
                    .user(user)
                    .build();
            groupPostLikeRepository.save(newLike);
            groupPostRepository.incrementLikeCount(postId);
            liked = true;
            count = count + 1;
        }

        return GroupPostLikeResponse.builder()
                .postId(postId)
                .liked(liked)
                .likeCount(count)
                .build();
    }

    @Override
    @Transactional
    public GroupPostResponse togglePin(Long groupId, Long postId, String userEmail) {
        User user = getUserByEmail(userEmail);
        CommunityGroup group = getVisibleGroup(groupId);
        checkGroupActive(group);

        if (!isGroupManager(groupId, user.getId())) {
            throw new ForbiddenException("Chỉ chủ sở hữu hoặc quản trị viên mới có quyền ghim bài viết.");
        }

        GroupPost post = groupPostRepository.findByIdAndGroupId(postId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại trong hội nhóm này."));

        post.setPinned(!post.isPinned());
        GroupPost saved = groupPostRepository.save(post);

        UserProfile authorProfile = userProfileRepository.findById(saved.getAuthor().getId()).orElse(null);
        GroupMember authorMember = groupMemberRepository.findByGroupIdAndUserId(groupId, saved.getAuthor().getId()).orElse(null);
        boolean liked = groupPostLikeRepository.existsByPostIdAndUserId(postId, user.getId());
        boolean isAuthor = saved.getAuthor().getId().equals(user.getId());

        return GroupPostResponse.builder()
                .id(saved.getId())
                .groupId(groupId)
                .author(toAuthorResponse(saved.getAuthor(), authorProfile, authorMember))
                .content(saved.getContent())
                .topic(saved.getTopic())
                .imageUrls(saved.getImageUrls() != null ? saved.getImageUrls() : Collections.emptyList())
                .videoUrls(saved.getVideoUrls() != null ? saved.getVideoUrls() : Collections.emptyList())
                .isPinned(saved.isPinned())
                .likeCount(saved.getLikeCount())
                .commentCount(saved.getCommentCount())
                .likedByViewer(liked)
                .canPin(true)
                .canEdit(isAuthor)
                .canDelete(true)
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<GroupCommentResponse> listComments(Long groupId, Long postId, String viewerEmail, int page, int size) {
        CommunityGroup group = getVisibleGroup(groupId);
        User viewer = viewerEmail != null ? getUserByEmailOrNull(viewerEmail) : null;
        GroupMember viewerMember = viewer != null
                ? groupMemberRepository.findByGroupIdAndUserId(groupId, viewer.getId()).orElse(null)
                : null;
        boolean isActiveMember = viewerMember != null && viewerMember.getMembershipStatus() == MembershipStatus.ACTIVE;

        if (group.getPrivacy() == GroupPrivacy.PRIVATE && !isActiveMember) {
            throw new ForbiddenException("Chỉ thành viên mới có quyền xem bình luận của hội nhóm riêng tư.");
        }

        // Xác nhận bài viết thuộc nhóm
        GroupPost post = groupPostRepository.findByIdAndGroupId(postId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại trong hội nhóm này."));

        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        Page<GroupPostComment> commentPage = groupPostCommentRepository.findByPostIdOrderByCreatedAtAsc(postId, pageable);

        if (commentPage.isEmpty()) {
            return PageResponse.<GroupCommentResponse>builder()
                    .content(Collections.emptyList())
                    .pageNumber(commentPage.getNumber())
                    .pageSize(commentPage.getSize())
                    .totalElements(0)
                    .totalPages(0)
                    .last(true)
                    .build();
        }

        List<GroupPostComment> comments = commentPage.getContent();
        Set<Long> authorIds = comments.stream().map(c -> c.getAuthor().getId()).collect(Collectors.toSet());

        Map<Long, UserProfile> profileMap = userProfileRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));
        Map<Long, GroupMember> authorMemberMap = authorIds.stream()
                .map(uid -> groupMemberRepository.findByGroupIdAndUserId(groupId, uid).orElse(null))
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toMap(m -> m.getUser().getId(), Function.identity()));

        boolean isViewerManager = isActiveMember && (viewerMember.getRole() == MembershipRole.OWNER || viewerMember.getRole() == MembershipRole.ADMIN);
        boolean isPostAuthor = viewer != null && post.getAuthor().getId().equals(viewer.getId());

        List<GroupCommentResponse> responses = comments.stream().map(c -> {
            Long cAuthorId = c.getAuthor().getId();
            UserProfile authorProfile = profileMap.get(cAuthorId);
            GroupMember authorMember = authorMemberMap.get(cAuthorId);
            boolean isCommentAuthor = viewer != null && viewer.getId().equals(cAuthorId);
            boolean canDelete = isCommentAuthor || isPostAuthor || isViewerManager;

            return GroupCommentResponse.builder()
                    .id(c.getId())
                    .postId(postId)
                    .author(toAuthorResponse(c.getAuthor(), authorProfile, authorMember))
                    .content(c.getContent())
                    .parentId(c.getParentComment() != null ? c.getParentComment().getId() : null)
                    .canEdit(isCommentAuthor)
                    .canDelete(canDelete)
                    .createdAt(c.getCreatedAt())
                    .updatedAt(c.getUpdatedAt())
                    .build();
        }).toList();

        return PageResponse.<GroupCommentResponse>builder()
                .content(responses)
                .pageNumber(commentPage.getNumber())
                .pageSize(commentPage.getSize())
                .totalElements(commentPage.getTotalElements())
                .totalPages(commentPage.getTotalPages())
                .last(commentPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public GroupCommentResponse createComment(Long groupId, Long postId, String authorEmail, CreateGroupCommentRequest request) {
        User author = getUserByEmail(authorEmail);
        CommunityGroup group = getVisibleGroup(groupId);
        checkGroupActive(group);
        GroupMember member = checkMemberActive(groupId, author.getId(), "Vui lòng tham gia hội nhóm để bình luận.");

        GroupPost post = groupPostRepository.findByIdAndGroupId(postId, groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại trong hội nhóm này."));

        GroupPostComment parent = null;
        if (request.getParentId() != null) {
            parent = groupPostCommentRepository.findByIdAndPostId(request.getParentId(), postId)
                    .orElseThrow(() -> new ResourceNotFoundException("Bình luận cần trả lời không còn khả dụng."));
            if (parent.getParentComment() != null) parent = parent.getParentComment();
        }

        GroupPostComment comment = GroupPostComment.builder()
                .post(post)
                .author(author)
                .parentComment(parent)
                .content(request.getContent().trim())
                .build();

        GroupPostComment saved = groupPostCommentRepository.save(comment);
        groupPostRepository.incrementCommentCount(postId);

        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);

        return GroupCommentResponse.builder()
                .id(saved.getId())
                .postId(postId)
                .author(toAuthorResponse(author, profile, member))
                .content(saved.getContent())
                .parentId(parent != null ? parent.getId() : null)
                .canEdit(true)
                .canDelete(true)
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public GroupCommentResponse updateComment(Long groupId, Long postId, Long commentId, String authorEmail,
                                              UpdateGroupCommentRequest request) {
        User author = getUserByEmail(authorEmail);
        CommunityGroup group = getVisibleGroup(groupId);
        checkGroupActive(group);

        GroupPostComment comment = groupPostCommentRepository.findByIdAndPostId(commentId, postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bình luận không tồn tại trong bài viết này."));
        if (!comment.getPost().getGroup().getId().equals(groupId)) {
            throw new ResourceNotFoundException("Bình luận không tồn tại trong hội nhóm này.");
        }
        if (!comment.getAuthor().getId().equals(author.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể chỉnh sửa bình luận do chính mình đăng.");
        }

        comment.setContent(request.getContent().trim());
        GroupPostComment saved = groupPostCommentRepository.save(comment);
        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, author.getId()).orElse(null);

        return GroupCommentResponse.builder()
                .id(saved.getId())
                .postId(postId)
                .author(toAuthorResponse(author, profile, member))
                .content(saved.getContent())
                .parentId(saved.getParentComment() != null ? saved.getParentComment().getId() : null)
                .canEdit(true)
                .canDelete(true)
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteComment(Long groupId, Long postId, Long commentId, String userEmail) {
        User user = getUserByEmail(userEmail);
        CommunityGroup group = getVisibleGroup(groupId);
        checkGroupActive(group);

        GroupPostComment comment = groupPostCommentRepository.findByIdAndPostId(commentId, postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bình luận không tồn tại trong bài viết này."));

        GroupPost post = comment.getPost();
        if (!post.getGroup().getId().equals(groupId)) {
            throw new BadRequestException("Bình luận không thuộc hội nhóm này.");
        }

        boolean isCommentAuthor = comment.getAuthor().getId().equals(user.getId());
        boolean isPostAuthor = post.getAuthor().getId().equals(user.getId());
        boolean isManager = isGroupManager(groupId, user.getId());

        if (!isCommentAuthor && !isPostAuthor && !isManager) {
            throw new ForbiddenException("Bạn không có quyền xóa bình luận này.");
        }

        int deletedCount = Math.toIntExact(1 + (comment.getParentComment() == null
                ? groupPostCommentRepository.countByParentComment_Id(commentId) : 0));
        groupPostCommentRepository.delete(comment);
        groupPostRepository.decrementCommentCount(postId, deletedCount);
        log.info("Xóa bình luận hội nhóm thành công: commentId={}, postId={}, deletedBy={}", commentId, postId, user.getId());
    }

    // ==================== CÁC PHƯƠNG THỨC TIỆN ÍCH NỘI BỘ ====================

    private CommunityGroup getVisibleGroup(Long groupId) {
        return groupRepository.findVisibleById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Hội nhóm không tồn tại hoặc đã bị xóa."));
    }

    private void checkGroupActive(CommunityGroup group) {
        if (group.getStatus() == GroupStatus.INACTIVE) {
            throw new BadRequestException("Hội nhóm đang tạm ngừng hoạt động.");
        }
    }

    private GroupMember checkMemberActive(Long groupId, Long userId, String forbiddenMessage) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId).orElse(null);
        if (member == null || member.getMembershipStatus() != MembershipStatus.ACTIVE) {
            throw new ForbiddenException(forbiddenMessage);
        }
        return member;
    }

    private boolean isGroupManager(Long groupId, Long userId) {
        Optional<GroupMember> memberOpt = groupMemberRepository.findByGroupIdAndUserId(groupId, userId);
        return memberOpt.isPresent()
                && memberOpt.get().getMembershipStatus() == MembershipStatus.ACTIVE
                && (memberOpt.get().getRole() == MembershipRole.OWNER || memberOpt.get().getRole() == MembershipRole.ADMIN);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại."));
    }

    private User getUserByEmailOrNull(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    private List<String> sanitizeImages(List<String> images) {
        if (images == null || images.isEmpty()) {
            return new ArrayList<>();
        }
        return images.stream()
                .filter(url -> url != null && !url.isBlank())
                .limit(10)
                .collect(Collectors.toList());
    }

    private List<String> sanitizeVideos(List<String> videos) {
        if (videos == null || videos.isEmpty()) return new ArrayList<>();
        return videos.stream().filter(url -> url != null && !url.isBlank()).limit(10)
                .collect(Collectors.toList());
    }

    private void validateMediaCount(List<String> images, List<String> videos) {
        if (images.size() + videos.size() > 10) {
            throw new BadRequestException("Mỗi bài viết chỉ được đính kèm tối đa 10 ảnh hoặc video.");
        }
    }

    private String resolveGroupTopic(CommunityGroup group, String requested) {
        if (requested == null || requested.isBlank()) return null;
        String normalized = requested.trim();
        return Optional.ofNullable(group.getTopics()).orElseGet(Collections::emptyList).stream()
                .filter(topic -> topic.equalsIgnoreCase(normalized))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Chủ đề đã chọn không thuộc hội nhóm này."));
    }

    private GroupPostAuthorResponse toAuthorResponse(User user, UserProfile profile, GroupMember member) {
        String roleStr = null;
        String roleLabel = "Thành viên";
        if (member != null && member.getMembershipStatus() == MembershipStatus.ACTIVE) {
            roleStr = member.getRole().name();
            if (member.getRole() == MembershipRole.OWNER) {
                roleLabel = "Sáng lập";
            } else if (member.getRole() == MembershipRole.ADMIN) {
                roleLabel = "Quản trị viên";
            }
        }

        String name = (profile != null && profile.getFullName() != null && !profile.getFullName().isBlank())
                ? profile.getFullName()
                : user.getEmail();
        String avatar = (profile != null && profile.getAvatarUrl() != null) ? profile.getAvatarUrl() : "";

        return GroupPostAuthorResponse.builder()
                .userId(user.getId())
                .fullName(name)
                .avatarUrl(avatar)
                .groupRole(roleStr)
                .roleLabel(roleLabel)
                .build();
    }
}
