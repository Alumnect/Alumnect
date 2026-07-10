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
    UserProfileResponse toResponse(UserProfile userProfile);
}
