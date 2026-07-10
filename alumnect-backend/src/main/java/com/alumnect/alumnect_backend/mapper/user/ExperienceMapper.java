package com.alumnect.alumnect_backend.mapper.user;

import com.alumnect.alumnect_backend.dto.response.user.ExperienceResponse;
import com.alumnect.alumnect_backend.entity.user.Experience;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ExperienceMapper {
    @Mapping(target = "isCurrent", source = "current")
    ExperienceResponse toResponse(Experience experience);
}
