package com.alumnect.alumnect_backend.mapper.careerpath;

import com.alumnect.alumnect_backend.dto.response.careerpath.CareerPathSummaryResponse;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CareerPathMapper {

    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "fullName", source = "fullName")
    @Mapping(target = "avatarUrl", source = "avatarUrl")
    @Mapping(target = "verifiedStatus", source = "user.accountVerified")
    @Mapping(target = "cohort", source = "cohort")
    @Mapping(target = "major", source = "major.name")
    @Mapping(target = "currentTitle", ignore = true)
    @Mapping(target = "currentCompany", ignore = true)
    @Mapping(target = "currentLocation", ignore = true)
    @Mapping(target = "careerPreview", ignore = true)
    @Mapping(target = "totalExperiences", ignore = true)
    CareerPathSummaryResponse toSummary(UserProfile profile);
}
