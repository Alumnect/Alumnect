package com.alumnect.alumnect_backend.mapper.user;

import com.alumnect.alumnect_backend.dto.request.user.ExperienceRequest;
import com.alumnect.alumnect_backend.dto.response.user.ExperienceResponse;
import com.alumnect.alumnect_backend.entity.user.Experience;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface ExperienceMapper {
    
    @Mapping(target = "isCurrent", source = "current")
    ExperienceResponse toResponse(Experience experience);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Experience toEntity(ExperienceRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(ExperienceRequest request, @MappingTarget Experience experience);
}
