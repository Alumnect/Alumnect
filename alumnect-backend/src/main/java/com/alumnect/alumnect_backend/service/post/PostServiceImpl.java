package com.alumnect.alumnect_backend.service.post;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.CommentStatus;
import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.dao.post.CommentRepository;
import com.alumnect.alumnect_backend.dao.post.PostLikeRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.post.PostSaveRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.post.CreateCommentRequest;
import com.alumnect.alumnect_backend.dto.request.post.CreatePostRequest;
import com.alumnect.alumnect_backend.dto.request.post.EditPostRequest;
import com.alumnect.alumnect_backend.dto.request.post.RepostRequest;
import com.alumnect.alumnect_backend.dto.request.post.UpdateCommentRequest;
import com.alumnect.alumnect_backend.dto.response.post.CommentResponse;
import com.alumnect.alumnect_backend.dto.response.post.LikeResponse;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.dto.response.post.SavePostResponse;
import com.alumnect.alumnect_backend.entity.post.Comment;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.post.PostLike;
import com.alumnect.alumnect_backend.entity.post.PostMedia;
import com.alumnect.alumnect_backend.entity.post.PostSave;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.post.CommentMapper;
import com.alumnect.alumnect_backend.mapper.post.PostMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PostServiceImpl implements PostService {

    private static final Logger log = LoggerFactory.getLogger(PostServiceImpl.class);

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private com.alumnect.alumnect_backend.dao.event.EventRepository eventRepository;

    @Autowired
    private com.alumnect.alumnect_backend.dao.job.JobPostingRepository jobPostingRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostMapper postMapper;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private CommentMapper commentMapper;

    @Autowired
    private PostLikeRepository postLikeRepository;

    @Autowired
    private PostSaveRepository postSaveRepository;

    @Override
    @Transactional
    public PostResponse createPost(String email, CreatePostRequest request) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        String roleName = author.getRole() != null ? author.getRole().getName().toUpperCase() : "";
        if (!roleName.equals("STUDENT") && !roleName.equals("ALUMNI")) {
            throw new ForbiddenException("Chỉ sinh viên và cựu sinh viên mới được đăng bài viết");
        }

        PostCategory category = parsePostCategory(request.getType());

        Long eventId = null;
        if (category == PostCategory.EVENT && request.getEvent() != null) {
            com.alumnect.alumnect_backend.entity.event.Event event = com.alumnect.alumnect_backend.entity.event.Event.builder()
                    .organizer(author)
                    .title(request.getEvent().getTitle() != null ? request.getEvent().getTitle() : "")
                    .startTime(request.getEvent().getStartTime())
                    .endTime(request.getEvent().getEndTime())
                    .location(request.getEvent().getLocation())
                    .capacity(request.getEvent().getCapacity())
                    .build();
            eventId = eventRepository.save(event).getId();
        }

        Long jobId = null;
        if (category == PostCategory.RECRUITMENT && request.getJob() != null) {
            com.alumnect.alumnect_backend.entity.job.JobPosting job = com.alumnect.alumnect_backend.entity.job.JobPosting.builder()
                    .poster(author)
                    .title(request.getJob().getTitle() != null ? request.getJob().getTitle() : "")
                    .company(request.getJob().getCompany() != null ? request.getJob().getCompany() : "")
                    .location(request.getJob().getLocation())
                    .salaryMin(request.getJob().getSalaryMin())
                    .salaryMax(request.getJob().getSalaryMax())
                    .applyUrl(request.getJob().getApplyUrl())
                    .contactEmail(request.getJob().getContactEmail())
                    .build();
            jobId = jobPostingRepository.save(job).getId();
        }

        Post post = Post.builder()
                .author(author)
                .category(category != null ? category : PostCategory.GENERAL)
                .content(request.getContent().trim())
                .status(PostStatus.ACTIVE)
                .eventId(eventId)
                .jobId(jobId)
                .likeCount(0)
                .commentCount(0)
                .repostCount(0)
                .build();

        // Support multiple images via mediaUrls list (legacy imageUrl still accepted)
        if (request.getMediaUrls() != null && !request.getMediaUrls().isEmpty()) {
            for (int i = 0; i < request.getMediaUrls().size(); i++) {
                String url = request.getMediaUrls().get(i);
                if (url != null && !url.isBlank()) {
                    PostMedia media = PostMedia.builder()
                            .url(url.trim())
                            .mediaType("IMAGE")
                            .sortOrder((short) i)
                            .build();
                    post.addMedia(media);
                }
            }
        } else if (request.getImageUrl() != null && !request.getImageUrl().isBlank()) {
            PostMedia media = PostMedia.builder()
                    .url(request.getImageUrl().trim())
                    .mediaType("IMAGE")
                    .sortOrder((short) 0)
                    .build();
            post.addMedia(media);
        }

        Post saved;
        try {
            saved = postRepository.save(post);
        } catch (Exception ex) {
            log.error("Lỗi khi lưu bài viết mới của user {}: ", email, ex);
            throw new RuntimeException("Lỗi hệ thống: Không thể tạo bài viết");
        }
        log.info("Tạo bài viết mới: id={}, tác giả={}, loại={}", saved.getId(), email, saved.getCategory());

        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);
        com.alumnect.alumnect_backend.entity.job.JobPosting savedJob = jobId != null ? jobPostingRepository.findById(jobId).orElse(null) : null;
        com.alumnect.alumnect_backend.entity.event.Event savedEvent = eventId != null ? eventRepository.findById(eventId).orElse(null) : null;
        return postMapper.toResponse(saved, profile, false, false, savedJob, savedEvent);
    }

    @Override
    public PageResponse<PostResponse> getFeed(int page, int size, String type, boolean isAuthenticated, String viewerEmail) {
        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        PostCategory category = parsePostCategory(type);
        boolean guestMode = !isAuthenticated;

        Page<Post> postsPage = postRepository.findFeed(guestMode, category, PageRequest.of(page, size));
        log.info("Lấy bảng tin: page={}, size={}, category={}, tổng kết quả={}", page, size, type, postsPage.getTotalElements());

        List<PostResponse> content = mapPostsToResponses(postsPage.getContent(), viewerEmail, false);

        return PageResponse.<PostResponse>builder()
                .content(content)
                .pageNumber(postsPage.getNumber())
                .pageSize(postsPage.getSize())
                .totalElements(postsPage.getTotalElements())
                .totalPages(postsPage.getTotalPages())
                .last(postsPage.isLast())
                .build();
    }

    @Override
    public PageResponse<PostResponse> getUserPosts(Long userId, int page, int size, String type, boolean isAuthenticated, String viewerEmail) {
        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        PostCategory category = parsePostCategory(type);

        Page<Post> postsPage = postRepository.findByAuthorIdAndCategory(userId, category, PageRequest.of(page, size));
        log.info("Lấy bài viết của user: userId={}, page={}, size={}, category={}, tổng kết quả={}", userId, page, size, type, postsPage.getTotalElements());

        List<PostResponse> content = mapPostsToResponses(postsPage.getContent(), viewerEmail, false);

        return PageResponse.<PostResponse>builder()
                .content(content)
                .pageNumber(postsPage.getNumber())
                .pageSize(postsPage.getSize())
                .totalElements(postsPage.getTotalElements())
                .totalPages(postsPage.getTotalPages())
                .last(postsPage.isLast())
                .build();
    }

    @Override
    public PostResponse getPostDetail(Long id, boolean isAuthenticated, String viewerEmail) {
        Post post = loadViewablePost(id, isAuthenticated);
        log.info("Xem chi tiết bài viết: id={}", id);
        return mapPostsToResponses(List.of(post), viewerEmail, false).get(0);
    }

    @Override
    public PageResponse<CommentResponse> getPostComments(Long postId, int page, int size, boolean isAuthenticated) {
        loadViewablePost(postId, isAuthenticated);

        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        Page<Comment> commentsPage = commentRepository.findActiveByPostId(postId, PageRequest.of(page, size));
        
        List<Long> authorIds = commentsPage.getContent().stream()
                .map(c -> c.getUser().getId())
                .distinct()
                .collect(Collectors.toList());
        Map<Long, UserProfile> profileByUserId = userProfileRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));

        List<CommentResponse> content = commentsPage.getContent().stream()
                .map(comment -> commentMapper.toResponse(comment, profileByUserId.get(comment.getUser().getId())))
                .collect(Collectors.toList());

        return PageResponse.<CommentResponse>builder()
                .content(content)
                .pageNumber(commentsPage.getNumber())
                .pageSize(commentsPage.getSize())
                .totalElements(commentsPage.getTotalElements())
                .totalPages(commentsPage.getTotalPages())
                .last(commentsPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public CommentResponse createComment(String email, Long postId, CreateCommentRequest request) {
        User author = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được bình luận");
        Post post = loadViewablePost(postId, true);

        Comment parent = resolveParentOrThrow(request.getParentId(), postId);

        Comment comment = commentRepository.save(Comment.builder()
                .post(post)
                .user(author)
                .parentComment(parent)
                .content(request.getContent().trim())
                .status(CommentStatus.ACTIVE)
                .build());

        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);
        return commentMapper.toResponse(comment, profile);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: kiểm tra vai trò thành viên → tìm bình luận ACTIVE → xác nhận bình luận thuộc đúng bài viết
     * trên URL → kiểm tra quyền sở hữu → cập nhật nội dung đã trim trong cùng transaction → trả về DTO mới.
     */
    @Override
    @Transactional
    public CommentResponse updateComment(String email, Long postId, Long commentId, UpdateCommentRequest request) {
        User editor = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được chỉnh sửa bình luận");

        Comment comment = commentRepository.findById(commentId)
                .filter(item -> item.getStatus() == CommentStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Bình luận này không còn khả dụng"));

        // Không để một URL có postId khác vô tình sửa được bình luận hợp lệ ở bài viết khác.
        if (!comment.getPost().getId().equals(postId)) {
            throw new ResourceNotFoundException("Bình luận này không còn khả dụng");
        }

        if (!comment.getUser().getId().equals(editor.getId())) {
            throw new ForbiddenException("Bạn chỉ được chỉnh sửa bình luận của chính mình");
        }

        comment.setContent(request.getContent().trim());
        Comment saved = commentRepository.save(comment);
        log.info("Cập nhật bình luận: id={}, postId={}, tác giả={}", saved.getId(), postId, email);

        UserProfile profile = userProfileRepository.findById(editor.getId()).orElse(null);
        return commentMapper.toResponse(saved, profile);
    }

    private Comment resolveParentOrThrow(Long parentId, Long postId) {
        if (parentId == null) {
            return null;
        }
        Comment parent = commentRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Bình luận cần trả lời không còn khả dụng"));
        if (parent.getStatus() != CommentStatus.ACTIVE || !postId.equals(parent.getPost().getId())) {
            throw new ResourceNotFoundException("Bình luận cần trả lời không còn khả dụng");
        }
        return parent.getParentComment() != null ? parent.getParentComment() : parent;
    }

    @Override
    @Transactional
    public LikeResponse likePost(String email, Long postId) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được thích bài viết");
        Post post = loadViewablePost(postId, true);
        if (!postLikeRepository.existsByPostIdAndUserId(postId, user.getId())) {
            postLikeRepository.save(PostLike.builder().post(post).user(user).build());
            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);
        }
        return LikeResponse.builder().liked(true).likeCount(post.getLikeCount()).build();
    }

    @Override
    @Transactional
    public LikeResponse unlikePost(String email, Long postId) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được thích bài viết");
        Post post = loadViewablePost(postId, true);
        if (postLikeRepository.existsByPostIdAndUserId(postId, user.getId())) {
            postLikeRepository.deleteByPostIdAndUserId(postId, user.getId());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            postRepository.save(post);
        }
        return LikeResponse.builder().liked(false).likeCount(post.getLikeCount()).build();
    }

    private User resolveMemberOrThrow(String email, String forbiddenMessage) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));
        String role = user.getRole() != null ? user.getRole().getName().toUpperCase() : "";
        if (!role.equals("STUDENT") && !role.equals("ALUMNI")) {
            throw new ForbiddenException(forbiddenMessage);
        }
        return user;
    }

    private Set<Long> computeLikedPostIds(String viewerEmail, List<Long> postIds) {
        if (viewerEmail == null || postIds.isEmpty()) {
            return new HashSet<>();
        }
        return userRepository.findByEmail(viewerEmail)
                .<Set<Long>>map(u -> new HashSet<>(postLikeRepository.findLikedPostIds(u.getId(), postIds)))
                .orElseGet(HashSet::new);
    }

    private Post loadViewablePost(Long id, boolean isAuthenticated) {
        Post post = postRepository.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết này không còn khả dụng"));

        if (post.getStatus() != PostStatus.ACTIVE) {
            throw new ResourceNotFoundException("Bài viết này không còn khả dụng");
        }

        return post;
    }

    @Override
    @Transactional
    public PostResponse editPost(String email, Long postId, EditPostRequest request) {
        User author = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được chỉnh sửa bài viết");
        Post post = loadViewablePost(postId, true);

        if (!post.getAuthor().getId().equals(author.getId())) {
            throw new ForbiddenException("Bạn chỉ được chỉnh sửa bài viết của chính mình");
        }

        post.setContent(request.getContent().trim());

        PostCategory newCategory = parsePostCategory(request.getCategory());
        if (newCategory != null) {
            post.setCategory(newCategory);
        } else {
            newCategory = post.getCategory();
        }

        // Handle Event Update
        if (newCategory == PostCategory.EVENT && request.getEvent() != null) {
            if (post.getEventId() != null) {
                com.alumnect.alumnect_backend.entity.event.Event existingEvent = eventRepository.findById(post.getEventId()).orElse(null);
                if (existingEvent != null) {
                    existingEvent.setTitle(request.getEvent().getTitle() != null ? request.getEvent().getTitle() : "");
                    existingEvent.setStartTime(request.getEvent().getStartTime());
                    existingEvent.setEndTime(request.getEvent().getEndTime());
                    existingEvent.setLocation(request.getEvent().getLocation());
                    existingEvent.setCapacity(request.getEvent().getCapacity());
                    eventRepository.save(existingEvent);
                }
            } else {
                com.alumnect.alumnect_backend.entity.event.Event newEvent = com.alumnect.alumnect_backend.entity.event.Event.builder()
                        .organizer(author)
                        .title(request.getEvent().getTitle() != null ? request.getEvent().getTitle() : "")
                        .startTime(request.getEvent().getStartTime())
                        .endTime(request.getEvent().getEndTime())
                        .location(request.getEvent().getLocation())
                        .capacity(request.getEvent().getCapacity())
                        .build();
                post.setEventId(eventRepository.save(newEvent).getId());
            }
        } else if (newCategory != PostCategory.EVENT) {
            post.setEventId(null);
        }

        // Handle Job Update
        if (newCategory == PostCategory.RECRUITMENT && request.getJob() != null) {
            if (post.getJobId() != null) {
                com.alumnect.alumnect_backend.entity.job.JobPosting existingJob = jobPostingRepository.findById(post.getJobId()).orElse(null);
                if (existingJob != null) {
                    existingJob.setTitle(request.getJob().getTitle() != null ? request.getJob().getTitle() : "");
                    existingJob.setCompany(request.getJob().getCompany() != null ? request.getJob().getCompany() : "");
                    existingJob.setLocation(request.getJob().getLocation());
                    existingJob.setSalaryMin(request.getJob().getSalaryMin());
                    existingJob.setSalaryMax(request.getJob().getSalaryMax());
                    existingJob.setApplyUrl(request.getJob().getApplyUrl());
                    existingJob.setContactEmail(request.getJob().getContactEmail());
                    jobPostingRepository.save(existingJob);
                }
            } else {
                com.alumnect.alumnect_backend.entity.job.JobPosting newJob = com.alumnect.alumnect_backend.entity.job.JobPosting.builder()
                        .poster(author)
                        .title(request.getJob().getTitle() != null ? request.getJob().getTitle() : "")
                        .company(request.getJob().getCompany() != null ? request.getJob().getCompany() : "")
                        .location(request.getJob().getLocation())
                        .salaryMin(request.getJob().getSalaryMin())
                        .salaryMax(request.getJob().getSalaryMax())
                        .applyUrl(request.getJob().getApplyUrl())
                        .contactEmail(request.getJob().getContactEmail())
                        .build();
                post.setJobId(jobPostingRepository.save(newJob).getId());
            }
        } else if (newCategory != PostCategory.RECRUITMENT) {
            post.setJobId(null);
        }

        if (request.getMediaUrls() != null) {
            post.getMediaList().clear();
            short sortOrder = 0;
            for (String url : request.getMediaUrls()) {
                if (url != null && !url.isBlank()) {
                    PostMedia media = PostMedia.builder()
                            .url(url.trim())
                            .mediaType("IMAGE")
                            .sortOrder(sortOrder++)
                            .build();
                    post.addMedia(media);
                }
            }
        }

        Post saved;
        try {
            saved = postRepository.save(post);
        } catch (Exception ex) {
            throw new RuntimeException("Lỗi hệ thống: Không thể cập nhật bài viết");
        }

        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);
        boolean liked = !computeLikedPostIds(email, List.of(saved.getId())).isEmpty();
        boolean savedFlag = !computeSavedPostIds(email, List.of(saved.getId())).isEmpty();
        com.alumnect.alumnect_backend.entity.job.JobPosting editedJob = saved.getJobId() != null ? jobPostingRepository.findById(saved.getJobId()).orElse(null) : null;
        com.alumnect.alumnect_backend.entity.event.Event editedEvent = saved.getEventId() != null ? eventRepository.findById(saved.getEventId()).orElse(null) : null;
        return postMapper.toResponse(saved, profile, liked, savedFlag, editedJob, editedEvent);
    }

    private PostCategory parsePostCategory(String category) {
        if (category == null || category.isBlank() || category.trim().equalsIgnoreCase("ALL")) {
            return null;
        }
        String upper = category.trim().toUpperCase();
        if ("NORMAL".equals(upper)) {
            return PostCategory.GENERAL;
        }
        try {
            return PostCategory.valueOf(upper);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Loại bài viết không hợp lệ: " + category);
        }
    }

    @Override
    @Transactional
    public void deletePost(String email, Long postId) {
        User author = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được xóa bài viết");
        Post post = loadViewablePost(postId, true);

        if (!post.getAuthor().getId().equals(author.getId())) {
            throw new ForbiddenException("Bạn chỉ được xóa bài viết của chính mình");
        }

        post.setStatus(PostStatus.DELETED);
        postRepository.save(post);
        log.info("Xóa bài viết: id={}, tác giả={}", postId, email);
    }

    @Override
    @Transactional
    public SavePostResponse savePost(String email, Long postId) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được lưu bài viết");
        Post post = loadViewablePost(postId, true);
        if (!postSaveRepository.existsByPostIdAndUserId(postId, user.getId())) {
            postSaveRepository.save(PostSave.builder().post(post).user(user).build());
            log.info("Người dùng {} đã lưu bài viết {}", email, postId);
        }
        return SavePostResponse.builder().saved(true).build();
    }

    @Override
    @Transactional
    public SavePostResponse unsavePost(String email, Long postId) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được lưu bài viết");
        Post post = loadViewablePost(postId, true);
        if (postSaveRepository.existsByPostIdAndUserId(postId, user.getId())) {
            postSaveRepository.deleteByPostIdAndUserId(postId, user.getId());
            log.info("Người dùng {} đã bỏ lưu bài viết {}", email, postId);
        }
        return SavePostResponse.builder().saved(false).build();
    }

    @Override
    public PageResponse<PostResponse> getSavedPosts(String email, int page, int size) {
        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được xem bài viết đã lưu");

        Page<PostSave> savedPage = postSaveRepository.findActiveSavedPostsByUserId(user.getId(), PageRequest.of(page, size));
        log.info("Lấy danh sách bài viết đã lưu: user={}, page={}, size={}, tổng={}", email, page, size, savedPage.getTotalElements());

        List<Post> posts = savedPage.getContent().stream().map(PostSave::getPost).collect(Collectors.toList());
        List<PostResponse> content = mapPostsToResponses(posts, email, true);

        return PageResponse.<PostResponse>builder()
                .content(content)
                .pageNumber(savedPage.getNumber())
                .pageSize(savedPage.getSize())
                .totalElements(savedPage.getTotalElements())
                .totalPages(savedPage.getTotalPages())
                .last(savedPage.isLast())
                .build();
    }

    private Set<Long> computeSavedPostIds(String viewerEmail, List<Long> postIds) {
        if (viewerEmail == null || postIds.isEmpty()) {
            return new HashSet<>();
        }
        return userRepository.findByEmail(viewerEmail)
                .<Set<Long>>map(u -> new HashSet<>(postSaveRepository.findSavedPostIds(u.getId(), postIds)))
                .orElseGet(HashSet::new);
    }

    private List<PostResponse> mapPostsToResponses(List<Post> posts, String viewerEmail, boolean defaultSavedStatus) {
        if (posts.isEmpty()) return new ArrayList<>();

        List<Long> authorIds = posts.stream().map(p -> p.getAuthor().getId()).collect(Collectors.toList());
        List<Long> originalAuthorIds = posts.stream().filter(p -> p.getRepostOf() != null).map(p -> p.getRepostOf().getAuthor().getId()).collect(Collectors.toList());
        authorIds.addAll(originalAuthorIds);
        authorIds = authorIds.stream().distinct().collect(Collectors.toList());
        Map<Long, UserProfile> profileByUserId = userProfileRepository.findAllById(authorIds).stream().collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));

        List<Long> postIds = posts.stream().map(Post::getId).collect(Collectors.toList());
        List<Long> originalPostIds = posts.stream().filter(p -> p.getRepostOf() != null).map(p -> p.getRepostOf().getId()).collect(Collectors.toList());
        List<Long> allPostIds = new ArrayList<>(postIds);
        allPostIds.addAll(originalPostIds);
        Set<Long> likedPostIds = computeLikedPostIds(viewerEmail, allPostIds);
        Set<Long> savedPostIds = computeSavedPostIds(viewerEmail, allPostIds);

        List<Long> jobIds = posts.stream().filter(p -> p.getJobId() != null).map(Post::getJobId).collect(Collectors.toList());
        List<Long> originalJobIds = posts.stream().filter(p -> p.getRepostOf() != null && p.getRepostOf().getJobId() != null).map(p -> p.getRepostOf().getJobId()).collect(Collectors.toList());
        jobIds.addAll(originalJobIds);
        jobIds = jobIds.stream().distinct().collect(Collectors.toList());

        List<Long> eventIds = posts.stream().filter(p -> p.getEventId() != null).map(Post::getEventId).collect(Collectors.toList());
        List<Long> originalEventIds = posts.stream().filter(p -> p.getRepostOf() != null && p.getRepostOf().getEventId() != null).map(p -> p.getRepostOf().getEventId()).collect(Collectors.toList());
        eventIds.addAll(originalEventIds);
        eventIds = eventIds.stream().distinct().collect(Collectors.toList());

        Map<Long, com.alumnect.alumnect_backend.entity.job.JobPosting> jobById = jobIds.isEmpty() ? new java.util.HashMap<>() : jobPostingRepository.findAllById(jobIds).stream().collect(Collectors.toMap(com.alumnect.alumnect_backend.entity.job.JobPosting::getId, Function.identity()));
        Map<Long, com.alumnect.alumnect_backend.entity.event.Event> eventById = eventIds.isEmpty() ? new java.util.HashMap<>() : eventRepository.findAllById(eventIds).stream().collect(Collectors.toMap(com.alumnect.alumnect_backend.entity.event.Event::getId, Function.identity()));

        return posts.stream().map(post -> {
            PostResponse originalPostResponse = null;
            if (post.getRepostOf() != null) {
                Post original = post.getRepostOf();
                originalPostResponse = postMapper.toResponse(
                        original,
                        profileByUserId.get(original.getAuthor().getId()),
                        likedPostIds.contains(original.getId()),
                        savedPostIds.contains(original.getId()),
                        original.getJobId() != null ? jobById.get(original.getJobId()) : null,
                        original.getEventId() != null ? eventById.get(original.getEventId()) : null,
                        null
                );
            }
            return postMapper.toResponse(
                    post,
                    profileByUserId.get(post.getAuthor().getId()),
                    likedPostIds.contains(post.getId()),
                    defaultSavedStatus || savedPostIds.contains(post.getId()),
                    post.getJobId() != null ? jobById.get(post.getJobId()) : null,
                    post.getEventId() != null ? eventById.get(post.getEventId()) : null,
                    originalPostResponse);
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PostResponse repostPost(String email, Long postId, RepostRequest request) {
        User author = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được đăng lại bài viết");
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết không tồn tại"));
                
        if (post.getStatus() != PostStatus.ACTIVE) {
            throw new BadRequestException("Không thể đăng lại bài viết này");
        }
        
        Post originalPost = post.getRepostOf() != null ? post.getRepostOf() : post;
        
        if (originalPost.getStatus() != PostStatus.ACTIVE) {
            throw new BadRequestException("Không thể đăng lại bài viết này");
        }
        
        String content = request.getContent() != null ? request.getContent().trim() : null;
        
        Post newRepost = Post.builder()
                .author(author)
                .category(PostCategory.GENERAL)
                .content(content)
                .status(PostStatus.ACTIVE)
                .repostOf(originalPost)
                .likeCount(0)
                .commentCount(0)
                .repostCount(0)
                .build();
                
        Post savedRepost = postRepository.save(newRepost);
        
        originalPost.setRepostCount(originalPost.getRepostCount() + 1);
        postRepository.save(originalPost);
        
        log.info("Tạo bài đăng lại: id={}, tác giả={}, originalId={}", savedRepost.getId(), email, originalPost.getId());
        
        return mapPostsToResponses(List.of(savedRepost), email, false).get(0);
    }
}
