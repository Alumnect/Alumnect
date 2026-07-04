package com.alumnect.alumnect_backend.mapper.alumnemap;

import com.alumnect.alumnect_backend.dto.response.alumnemap.AlumniMapResponse;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import org.mapstruct.Mapper;

/**
 * Lớp MapStruct Mapper chuyển đổi dữ liệu bản đồ cựu sinh viên.
 * Chuyển đổi từ Entity UserProfile sang DTO AlumniMapResponse để trả về Client.
 */
@Mapper(componentModel = "spring")
public interface AlumniMapMapper {

    /**
     * Chuyển đổi UserProfile Entity sang AlumniMapResponse DTO.
     *
     * @param userProfile Thực thể hồ sơ người dùng cần chuyển đổi
     * @return DTO AlumniMapResponse chứa thông tin rút gọn
     */
    AlumniMapResponse toResponse(UserProfile userProfile);
}
