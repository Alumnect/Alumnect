package com.alumnect.alumnect_backend.mapper.user;

import com.alumnect.alumnect_backend.dto.response.user.UserSkillResponse;
import com.alumnect.alumnect_backend.entity.user.UserSkill;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserSkillMapper {
    UserSkillResponse toResponse(UserSkill userSkill);
}
