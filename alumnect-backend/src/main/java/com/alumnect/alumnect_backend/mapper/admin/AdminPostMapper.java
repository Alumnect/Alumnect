package com.alumnect.alumnect_backend.mapper.admin;

import com.alumnect.alumnect_backend.dto.response.admin.AdminPostResponse;
import com.alumnect.alumnect_backend.entity.post.Post;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper chuyển đổi thông tin bài viết sang DTO chuyên dụng cho Admin.
 */
@Mapper(componentModel = "spring")
public interface AdminPostMapper {

    /**
     * Chuyển đổi thực thể Post sang AdminPostResponse.
     * Ánh xạ thông tin người đăng từ trường user của thực thể.
     */
    @Mapping(target = "id", source = "post.id")
    @Mapping(target = "authorName", source = "post.user.profile.fullName")
    @Mapping(target = "authorEmail", source = "post.user.email")
    @Mapping(target = "type", source = "post.type")
    @Mapping(target = "content", source = "post.content")
    @Mapping(target = "imageUrl", source = "post.imageUrl")
    @Mapping(target = "visibility", source = "post.visibility")
    @Mapping(target = "likeCount", source = "post.likeCount")
    @Mapping(target = "commentCount", source = "post.commentCount")
    @Mapping(target = "repostCount", source = "post.repostCount")
    @Mapping(target = "hidden", source = "post.hidden")
    @Mapping(target = "createdAt", source = "post.createdAt")
    AdminPostResponse toDto(Post post);
}
