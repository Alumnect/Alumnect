package com.alumnect.alumnect_backend.mapper.user;

import com.alumnect.alumnect_backend.dto.response.user.MajorResponse;
import com.alumnect.alumnect_backend.entity.user.Major;
import org.mapstruct.Mapper;

/**
 * Lớp MapStruct Mapper chuyển đổi dữ liệu chuyên ngành học.
 * Chuyển đổi từ Entity Major sang DTO MajorResponse để phản hồi cho Client.
 */
@Mapper(componentModel = "spring")
public interface MajorMapper {

    /**
     * Chuyển đổi Major Entity sang MajorResponse DTO.
     */
    MajorResponse toResponse(Major major);
}
