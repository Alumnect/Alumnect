package com.alumnect.alumnect_backend.mapper.user;

import com.alumnect.alumnect_backend.dto.response.user.UserProfileResponse;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Lớp MapStruct Mapper chuyển đổi dữ liệu hồ sơ người dùng.
 * Chuyển đổi từ Entity UserProfile sang DTO UserProfileResponse để phản hồi cho Client.
 */
@Mapper(componentModel = "spring", uses = {MajorMapper.class, ExperienceMapper.class, UserSkillMapper.class})
public interface UserProfileMapper {

    /**
     * Chuyển đổi từ UserProfile Entity sang UserProfileResponse DTO.
     * Ánh xạ cả thông tin tài khoản cơ bản từ thực thể User liên kết.
     *
     * @param userProfile Thực thể hồ sơ người dùng
     * @return DTO chứa thông tin hồ sơ chi tiết
     */
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "role", source = "user.role.name")
    @Mapping(target = "accountStatus", source = "user.accountStatus")
    @Mapping(target = "isAccountVerified", source = "user.accountVerified")
    @Mapping(target = "primaryExperience", ignore = true)
    @Mapping(target = "followersCount", ignore = true)
    @Mapping(target = "followingCount", ignore = true)
    @Mapping(target = "isFollowing", ignore = true)
    UserProfileResponse toResponse(UserProfile userProfile);

    /**
     * Chuyển đổi từ UserProfile Entity sang UserDirectoryResponse DTO phục vụ tìm kiếm.
     *
     * @param userProfile Thực thể hồ sơ người dùng
     * @return DTO chứa thông tin tóm tắt danh bạ thành viên
     */
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "role", source = "user.role.name")
    @Mapping(target = "isAccountVerified", source = "user.accountVerified")
    @Mapping(target = "createdAt", source = "user.createdAt")
    @Mapping(target = "primaryExperience", ignore = true)
    @Mapping(target = "followersCount", ignore = true)
    @Mapping(target = "followingCount", ignore = true)
    @Mapping(target = "isFollowing", ignore = true)
    com.alumnect.alumnect_backend.dto.response.user.UserDirectoryResponse toDirectoryResponse(UserProfile userProfile);

    /**
     * Cập nhật thực thể UserProfile từ DTO UpdateProfileRequest.
     * Bỏ qua các thuộc tính không được trực tiếp map như user, major, skills, experiences, createdAt, updatedAt.
     *
     * @param request DTO chứa dữ liệu cập nhật
     * @param profile Thực thể UserProfile cần cập nhật
     */
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "studentCode", ignore = true)
    @Mapping(target = "major", ignore = true)
    @Mapping(target = "experiences", ignore = true)
    @Mapping(target = "skills", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(com.alumnect.alumnect_backend.dto.request.user.UpdateProfileRequest request, @org.mapstruct.MappingTarget UserProfile profile);

}
