package com.alumnect.alumnect_backend.mapper.alumnemap;

import com.alumnect.alumnect_backend.dto.response.alumnemap.AlumniMapResponse;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface AlumniMapMapper {

    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "fullName", source = "fullName")
    @Mapping(target = "avatarUrl", source = "avatarUrl")
    @Mapping(target = "verifiedStatus", ignore = true)
    @Mapping(target = "title", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "location", ignore = true)
    @Mapping(target = "latitude", source = "latitude")
    @Mapping(target = "longitude", source = "longitude")
    @Mapping(target = "startDate", ignore = true)
    @Mapping(target = "profileIdentifier", ignore = true)
    AlumniMapResponse toResponse(UserProfile userProfile);
}
