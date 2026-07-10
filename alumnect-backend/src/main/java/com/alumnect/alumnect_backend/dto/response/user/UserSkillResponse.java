package com.alumnect.alumnect_backend.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkillResponse {
    private Long id;
    private String groupName;
    private String skillName;
    private short sortOrder;
}
