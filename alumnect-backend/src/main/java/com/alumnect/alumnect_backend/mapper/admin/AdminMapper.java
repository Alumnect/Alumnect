package com.alumnect.alumnect_backend.mapper.admin;

import com.alumnect.alumnect_backend.dto.response.admin.AdminUserDto;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper chuyển đổi thông tin người dùng sang DTO chi tiết phục vụ Admin.
 * Kết hợp thông tin từ cả thực thể User và UserProfile.
 */
@Mapper(componentModel = "spring")
public interface AdminMapper {

    /**
     * Chuyển đổi kết hợp giữa thực thể User và UserProfile thành AdminUserDto.
     *
     * @param user Thực thể tài khoản người dùng
     * @param profile Thực thể thông tin cá nhân người dùng
     * @return DTO chứa thông tin hồ sơ tổng hợp
     */
    @Mapping(target = "id", source = "user.id")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "fullName", source = "profile.fullName")
    @Mapping(target = "avatarUrl", source = "profile.avatarUrl")
    @Mapping(target = "phone", source = "profile.phone")
    @Mapping(target = "cohort", source = "profile.cohort")
    @Mapping(target = "studentCode", source = "profile.studentCode")
    @Mapping(target = "majorCode", source = "profile.major.code")
    @Mapping(target = "majorName", source = "profile.major.name")
    @Mapping(target = "role", source = "user.role.name")
    @Mapping(target = "accountStatus", source = "user.accountStatus")
    @Mapping(target = "isAccountVerified", source = "user.accountVerified")
    @Mapping(target = "emailVerified", source = "user.emailVerified")
    @Mapping(target = "authProvider", source = "user.authProvider")
    @Mapping(target = "createdAt", source = "user.createdAt")
    @Mapping(target = "updatedAt", source = "user.updatedAt")
    @Mapping(target = "lastLoginAt", source = "user.lastLoginAt")
    @Mapping(target = "headline", source = "profile.headline")
    @Mapping(target = "biography", source = "profile.biography")
    @Mapping(target = "currentPosition", source = "profile.currentPosition")
    @Mapping(target = "currentCompany", source = "profile.currentCompany")
    @Mapping(target = "city", source = "profile.city")
    @Mapping(target = "websiteUrl", source = "profile.websiteUrl")
    @Mapping(target = "linkedinUrl", source = "profile.linkedinUrl")
    AdminUserDto toDto(User user, UserProfile profile);
}
