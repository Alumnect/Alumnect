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
    @Mapping(target = "authorName", source = "post.author.profile.fullName")
    @Mapping(target = "authorEmail", source = "post.author.email")
    @Mapping(target = "authorAvatarUrl", source = "post.author.profile.avatarUrl")
    @Mapping(target = "type", source = "post.category")
    @Mapping(target = "content", source = "post.content")
    @Mapping(target = "imageUrl", expression = "java(post.getMediaList() != null && !post.getMediaList().isEmpty() ? post.getMediaList().get(0).getUrl() : null)")
    @Mapping(target = "visibility", expression = "java(post.getStatus() != null ? post.getStatus().name() : null)")
    @Mapping(target = "likeCount", source = "post.likeCount")
    @Mapping(target = "commentCount", source = "post.commentCount")
    @Mapping(target = "repostCount", source = "post.repostCount")
    @Mapping(target = "hidden", expression = "java(post.getStatus() == com.alumnect.alumnect_backend.common.enums.PostStatus.HIDDEN)")
    @Mapping(target = "createdAt", source = "post.createdAt")
    AdminPostResponse toDto(Post post);
}
