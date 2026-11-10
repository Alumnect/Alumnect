package com.alumnect.alumnect_backend.mapper.verification;

import com.alumnect.alumnect_backend.dto.response.verification.VerificationStatusResponseDto;
import com.alumnect.alumnect_backend.entity.user.Major;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import org.mapstruct.Mapper;

/**
 * Mapper chuyển đổi dữ liệu phiếu yêu cầu xác minh / nâng cấp Cựu sinh viên sang {@link VerificationStatusResponseDto} (UC08).
 */
@Mapper(componentModel = "spring")
public interface VerificationMapper {

    /**
     * Chuyển đổi thông tin người dùng, hồ sơ cá nhân và phiếu xác minh gần nhất (nếu có) sang DTO phản hồi.
     *
     * @param user    Thực thể tài khoản người dùng
     * @param profile Thực thể hồ sơ cá nhân
     * @param request Phiếu yêu cầu xác minh gần nhất (có thể null nếu chưa từng gửi)
     * @return DTO chứa trạng thái xác minh/nâng cấp Cựu sinh viên
     */
    default VerificationStatusResponseDto toStatusResponse(User user, UserProfile profile, VerificationRequest request) {
        if (user == null) {
            return null;
        }

        String roleName = user.getRole() != null ? user.getRole().getName() : null;
        Integer graduationYear = profile != null ? profile.getGraduationYear() : null;

        if (request == null) {
            Major profileMajor = profile != null ? profile.getMajor() : null;
            return VerificationStatusResponseDto.builder()
                    .id(null)
                    .userId(user.getId())
                    .currentRole(roleName)
                    .isAccountVerified(user.isAccountVerified())
                    .hasSubmitted(false)
                    .status("NONE")
                    .proofUrl(null)
                    .graduationYear(graduationYear)
                    .majorId(profileMajor != null ? profileMajor.getId() : null)
                    .majorCode(profileMajor != null ? profileMajor.getCode() : null)
                    .majorName(profileMajor != null ? profileMajor.getName() : null)
                    .reviewNote(null)
                    .reviewedAt(null)
                    .createdAt(null)
                    .build();
        }

        Major effectiveMajor = request.getMajor() != null
                ? request.getMajor()
                : (profile != null ? profile.getMajor() : null);

        return VerificationStatusResponseDto.builder()
                .id(request.getId())
                .userId(user.getId())
                .currentRole(roleName)
                .isAccountVerified(user.isAccountVerified())
                .hasSubmitted(true)
                .status(request.getStatus() != null ? request.getStatus().name() : "PENDING")
                .proofUrl(request.getProofUrl())
                .graduationYear(graduationYear)
                .majorId(effectiveMajor != null ? effectiveMajor.getId() : null)
                .majorCode(effectiveMajor != null ? effectiveMajor.getCode() : null)
                .majorName(effectiveMajor != null ? effectiveMajor.getName() : null)
                .reviewNote(request.getReviewNote())
                .reviewedAt(request.getReviewedAt())
                .createdAt(request.getCreatedAt())
                .build();
    }
}

