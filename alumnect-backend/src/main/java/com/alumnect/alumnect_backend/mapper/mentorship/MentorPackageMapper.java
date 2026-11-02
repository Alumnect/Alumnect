package com.alumnect.alumnect_backend.mapper.mentorship;

import com.alumnect.alumnect_backend.dto.response.mentorship.MentorPackageResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPackage;
import org.mapstruct.Mapper;

import java.util.List;

/**
 * Interface Mapper chuyển đổi dữ liệu giữa Entity MentorPackage và DTO MentorPackageResponse.
 */
@Mapper(componentModel = "spring")
public interface MentorPackageMapper {

    /**
     * Chuyển đổi từ Entity MentorPackage sang DTO MentorPackageResponse.
     *
     * @param mentorPackage Entity gói Mentor
     * @return DTO phản hồi gói Mentor
     */
    MentorPackageResponse toResponse(MentorPackage mentorPackage);

    /**
     * Chuyển đổi danh sách Entity MentorPackage sang danh sách DTO MentorPackageResponse.
     *
     * @param mentorPackages Danh sách Entity gói Mentor
     * @return Danh sách DTO phản hồi
     */
    List<MentorPackageResponse> toResponseList(List<MentorPackage> mentorPackages);
}
