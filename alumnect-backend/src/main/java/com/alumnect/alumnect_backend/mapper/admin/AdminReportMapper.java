package com.alumnect.alumnect_backend.mapper.admin;

import com.alumnect.alumnect_backend.dto.response.admin.AdminReportResponse;
import com.alumnect.alumnect_backend.entity.report.Report;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper chuyển đổi thông tin báo cáo sang DTO chuyên dụng cho Admin.
 */
@Mapper(componentModel = "spring")
public interface AdminReportMapper {

    @Mapping(target = "id", source = "report.id")
    @Mapping(target = "postId", source = "report.post.id")
    @Mapping(target = "postContent", source = "report.post.content")
    @Mapping(target = "postStatus", expression = "java(report.getPost().getStatus() != null ? report.getPost().getStatus().name() : null)")
    @Mapping(target = "postAuthorId", source = "report.post.author.id")
    @Mapping(target = "postAuthorName", source = "report.post.author.profile.fullName")
    @Mapping(target = "postAuthorEmail", source = "report.post.author.email")
    @Mapping(target = "reporterId", source = "report.reporter.id")
    @Mapping(target = "reporterName", source = "report.reporter.profile.fullName")
    @Mapping(target = "reporterEmail", source = "report.reporter.email")
    @Mapping(target = "reporterAvatarUrl", source = "report.reporter.profile.avatarUrl")
    @Mapping(target = "reason", source = "report.reason")
    @Mapping(target = "description", source = "report.description")
    @Mapping(target = "status", source = "report.status")
    @Mapping(target = "createdAt", source = "report.createdAt")
    AdminReportResponse toDto(Report report);
}
