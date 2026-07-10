package com.alumnect.alumnect_backend.mapper.auth;

import com.alumnect.alumnect_backend.dto.request.auth.RegisterRequest;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Lớp MapStruct Mapper chuyển đổi dữ liệu xác thực.
 * Tự động chuyển đổi từ DTO RegisterRequest sang các Entity tương ứng (UserProfile, VerificationRequest).
 */
@Mapper(componentModel = "spring")
public interface AuthMapper {

    /**
     * Chuyển đổi thông tin đăng ký thành Entity thông tin cá nhân (UserProfile).
     * Bỏ qua các trường không có sẵn trong request hoặc cần xử lý riêng (VD: avatar, bio, maps).
     */
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "major", ignore = true)
    @Mapping(target = "avatarUrl", ignore = true)
    @Mapping(target = "phone", ignore = true)
    @Mapping(target = "headline", ignore = true)
    @Mapping(target = "biography", ignore = true)
    @Mapping(target = "city", ignore = true)
    @Mapping(target = "latitude", ignore = true)
    @Mapping(target = "longitude", ignore = true)
    @Mapping(target = "socialLinks", ignore = true)
    @Mapping(target = "coverUrl", ignore = true)
    @Mapping(target = "experiences", ignore = true)
    @Mapping(target = "skills", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    UserProfile toUserProfile(RegisterRequest request);

    /**
     * Chuyển đổi thông tin đăng ký thành Entity phiếu duyệt Alumni (VerificationRequest).
     * Bỏ qua các trường được gán tự động hoặc chỉ Admin có quyền điền (VD: status, reviewer, review note).
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "major", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "reviewedBy", ignore = true)
    @Mapping(target = "reviewNote", ignore = true)
    @Mapping(target = "reviewedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    VerificationRequest toVerificationRequest(RegisterRequest request);
}
