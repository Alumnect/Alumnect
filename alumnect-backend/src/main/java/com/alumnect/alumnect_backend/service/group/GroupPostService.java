package com.alumnect.alumnect_backend.service.group;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupCommentRequest;
import com.alumnect.alumnect_backend.dto.request.group.CreateGroupPostRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupPostRequest;
import com.alumnect.alumnect_backend.dto.request.group.UpdateGroupCommentRequest;
import com.alumnect.alumnect_backend.dto.response.group.GroupCommentResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupPostLikeResponse;
import com.alumnect.alumnect_backend.dto.response.group.GroupPostResponse;

/**
 * Service xử lý nghiệp vụ bài viết / thảo luận trong hội nhóm (Group Posts).
 */
public interface GroupPostService {

    /**
     * Lấy danh sách bài viết / thảo luận trong hội nhóm (phân trang, bài ghim lên đầu).
     * Nhóm PUBLIC: xem được kể cả Guest.
     * Nhóm PRIVATE: chỉ thành viên ACTIVE mới được xem.
     */
    PageResponse<GroupPostResponse> listPosts(Long groupId, String viewerEmail, int page, int size, String topic);

    /**
     * Lấy thông tin chi tiết một bài viết trong hội nhóm.
     */
    GroupPostResponse getPostDetail(Long groupId, Long postId, String viewerEmail);

    /**
     * Đăng bài viết mới trong hội nhóm. Chỉ thành viên ACTIVE mới có quyền.
     */
    GroupPostResponse createPost(Long groupId, String authorEmail, CreateGroupPostRequest request);

    /**
     * Chỉnh sửa bài viết trong hội nhóm. Chỉ chính tác giả mới có quyền.
     */
    GroupPostResponse updatePost(Long groupId, Long postId, String authorEmail, UpdateGroupPostRequest request);

    /**
     * Xóa bài viết trong hội nhóm. Tác giả hoặc Owner / Admin nhóm có quyền xóa.
     */
    void deletePost(Long groupId, Long postId, String userEmail);

    /**
     * Thích / Bỏ thích bài viết trong hội nhóm. Chỉ thành viên ACTIVE mới có quyền.
     */
    GroupPostLikeResponse toggleLike(Long groupId, Long postId, String userEmail);

    /**
     * Ghim / Bỏ ghim bài viết trong hội nhóm. Chỉ Owner / Admin nhóm có quyền.
     */
    GroupPostResponse togglePin(Long groupId, Long postId, String userEmail);

    /**
     * Lấy danh sách bình luận của bài viết trong hội nhóm (phân trang).
     */
    PageResponse<GroupCommentResponse> listComments(Long groupId, Long postId, String viewerEmail, int page, int size);

    /**
     * Thêm bình luận vào bài viết trong hội nhóm. Chỉ thành viên ACTIVE mới có quyền.
     */
    GroupCommentResponse createComment(Long groupId, Long postId, String authorEmail, CreateGroupCommentRequest request);

    GroupCommentResponse updateComment(Long groupId, Long postId, Long commentId, String authorEmail,
                                       UpdateGroupCommentRequest request);

    /**
     * Xóa bình luận. Tác giả bình luận, tác giả bài viết hoặc Owner / Admin nhóm có quyền xóa.
     */
    void deleteComment(Long groupId, Long postId, Long commentId, String userEmail);
}
