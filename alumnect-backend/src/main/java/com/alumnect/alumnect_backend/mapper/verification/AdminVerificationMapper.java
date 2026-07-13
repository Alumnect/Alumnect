package com.alumnect.alumnect_backend.mapper.verification;

import com.alumnect.alumnect_backend.dto.response.verification.AdminVerificationRequestDto;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper chuyển đổi thông tin phiếu yêu cầu xác minh cựu sinh viên sang DTO cho Admin.
 */
@Mapper(componentModel = "spring")
public interface AdminVerificationMapper {

    /**
     * Chuyển đổi kết hợp giữa phiếu xác minh và hồ sơ người đăng ký thành DTO.
     *
     * @param request Phiếu xác minh cựu sinh viên
     * @param profile Hồ sơ người dùng của cựu sinh viên đăng ký
     * @return DTO thông tin phiếu xác minh chi tiết
     */
    @Mapping(target = "id", source = "request.id")
    @Mapping(target = "userId", source = "request.user.id")
    @Mapping(target = "email", source = "request.user.email")
    @Mapping(target = "fullName", source = "profile.fullName")
    @Mapping(target = "avatarUrl", source = "profile.avatarUrl")
    @Mapping(target = "graduationYear", source = "request.graduationYear")
    @Mapping(target = "majorCode", source = "request.major.code")
    @Mapping(target = "majorName", source = "request.major.name")
    @Mapping(target = "proofUrl", source = "request.proofUrl")
    @Mapping(target = "note", source = "request.note")
    @Mapping(target = "status", source = "request.status")
    @Mapping(target = "createdAt", source = "request.createdAt")
    @Mapping(target = "reviewedBy", source = "request.reviewedBy.email")
    @Mapping(target = "reviewNote", source = "request.reviewNote")
    @Mapping(target = "reviewedAt", source = "request.reviewedAt")
    AdminVerificationRequestDto toDto(VerificationRequest request, UserProfile profile);
}
