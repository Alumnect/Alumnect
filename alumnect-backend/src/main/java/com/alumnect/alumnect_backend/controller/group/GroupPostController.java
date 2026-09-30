package com.alumnect.alumnect_backend.controller.group;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupCommentRequest;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupPostRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupPostRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupCommentRequest;
import com.alumnect.alumnect_backend.dto.response.group.GroupCommentResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupPostLikeResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupPostResponse;
import com.alumnect.alumnect_backend.service.group.GroupPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý Bài viết và Thảo luận trong Hội nhóm (Group Posts).
 * Tiền tố URL: /api/v1/groups/{groupId}/posts
 */
@RestController
@RequestMapping("/groups/{groupId}/posts")
@RequiredArgsConstructor
public class GroupPostController {

    private final GroupPostService groupPostService;

    /**
     * Lấy danh sách bài viết / thảo luận trong hội nhóm (bài ghim lên đầu, phân trang).
     * Nhóm PUBLIC cho phép xem công khai; nhóm PRIVATE yêu cầu thành viên ACTIVE.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<GroupPostResponse>>> listPosts(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String topic,
            Authentication authentication) {
        PageResponse<GroupPostResponse> result = groupPostService.listPosts(groupId, emailOrNull(authentication), page, size, topic);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bài viết hội nhóm thành công", result));
    }

    /**
     * Lấy chi tiết một bài viết trong hội nhóm.
     */
    @GetMapping("/{postId}")
    public ResponseEntity<ApiResponse<GroupPostResponse>> getPostDetail(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            Authentication authentication) {
        GroupPostResponse result = groupPostService.getPostDetail(groupId, postId, emailOrNull(authentication));
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết bài viết thành công", result));
    }

    /**
     * Đăng bài viết / thảo luận mới trong hội nhóm. Yêu cầu là thành viên ACTIVE.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<GroupPostResponse>> createPost(
            @PathVariable Long groupId,
            @Valid @RequestBody CreateGroupPostRequest request,
            Authentication authentication) {
        GroupPostResponse result = groupPostService.createPost(groupId, authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng bài thảo luận thành công", result));
    }

    /**
     * Chỉnh sửa bài viết trong hội nhóm. Chỉ tác giả mới có quyền sửa.
     */
    @PutMapping("/{postId}")
    public ResponseEntity<ApiResponse<GroupPostResponse>> updatePost(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @Valid @RequestBody UpdateGroupPostRequest request,
            Authentication authentication) {
        GroupPostResponse result = groupPostService.updatePost(groupId, postId, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật bài viết thành công", result));
    }

    /**
     * Xóa bài viết trong hội nhóm. Tác giả hoặc Owner / Admin nhóm có quyền xóa.
     */
    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            Authentication authentication) {
        groupPostService.deletePost(groupId, postId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Xóa bài viết thành công", null));
    }

    /**
     * Thích hoặc bỏ thích bài viết trong hội nhóm. Yêu cầu là thành viên ACTIVE.
     */
    @PostMapping("/{postId}/like")
    public ResponseEntity<ApiResponse<GroupPostLikeResponse>> toggleLike(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            Authentication authentication) {
        GroupPostLikeResponse result = groupPostService.toggleLike(groupId, postId, authentication.getName());
        String msg = result.isLiked() ? "Đã thích bài viết" : "Đã bỏ thích bài viết";
        return ResponseEntity.ok(ApiResponse.success(msg, result));
    }

    /**
     * Ghim hoặc bỏ ghim bài viết trong hội nhóm. Chỉ Owner / Admin nhóm có quyền.
     */
    @PutMapping("/{postId}/pin")
    public ResponseEntity<ApiResponse<GroupPostResponse>> togglePin(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            Authentication authentication) {
        GroupPostResponse result = groupPostService.togglePin(groupId, postId, authentication.getName());
        String msg = result.isPinned() ? "Đã ghim bài viết lên đầu nhóm" : "Đã bỏ ghim bài viết";
        return ResponseEntity.ok(ApiResponse.success(msg, result));
    }

    /**
     * Lấy danh sách bình luận của bài viết trong hội nhóm.
     */
    @GetMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<PageResponse<GroupCommentResponse>>> listComments(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        PageResponse<GroupCommentResponse> result = groupPostService.listComments(groupId, postId, emailOrNull(authentication), page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bình luận thành công", result));
    }

    /**
     * Gửi bình luận vào bài viết trong hội nhóm. Yêu cầu là thành viên ACTIVE.
     */
    @PostMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<GroupCommentResponse>> createComment(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @Valid @RequestBody CreateGroupCommentRequest request,
            Authentication authentication) {
        GroupCommentResponse result = groupPostService.createComment(groupId, postId, authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi bình luận thành công", result));
    }

    /** Chỉ tác giả bình luận được chỉnh sửa bình luận của mình. */
    @PutMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<GroupCommentResponse>> updateComment(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateGroupCommentRequest request,
            Authentication authentication) {
        GroupCommentResponse result = groupPostService.updateComment(
                groupId, postId, commentId, authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Chỉnh sửa bình luận thành công", result));
    }

    /**
     * Xóa bình luận. Tác giả bình luận, tác giả bài viết hoặc Owner / Admin nhóm có quyền xóa.
     */
    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @PathVariable Long commentId,
            Authentication authentication) {
        groupPostService.deleteComment(groupId, postId, commentId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Xóa bình luận thành công", null));
    }

    private String emailOrNull(Authentication authentication) {
        boolean authenticated = authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
        return authenticated ? authentication.getName() : null;
    }
}
