package com.alumnect.alumnect_backend.mapper.report;

import com.alumnect.alumnect_backend.dto.response.report.ReportResponse;
import com.alumnect.alumnect_backend.entity.report.Report;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/** MapStruct mapper giữa entity báo cáo và DTO trả về cho UC24. */
@Mapper(componentModel = "spring")
public interface ReportMapper {

    @Mapping(target = "postId", source = "post.id")
    ReportResponse toResponse(Report report);
}
