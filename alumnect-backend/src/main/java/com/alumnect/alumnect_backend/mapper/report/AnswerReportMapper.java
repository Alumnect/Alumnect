package com.alumnect.alumnect_backend.mapper.report;

import com.alumnect.alumnect_backend.dto.response.admin.AdminAnswerReportResponse;
import com.alumnect.alumnect_backend.entity.report.Report;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper chuyển đổi giữa thực thể Report (loại câu trả lời) và Admin Response DTO (UC79).
 */
@Mapper(componentModel = "spring")
public interface AnswerReportMapper {

    @Mapping(target = "answerId", source = "answer.id")
    @Mapping(target = "answerContent", source = "answer.body")
    @Mapping(target = "answerStatus", source = "answer.status")
    @Mapping(target = "questionId", source = "answer.question.id")
    @Mapping(target = "questionTitle", source = "answer.question.title")
    @Mapping(target = "questionBody", source = "answer.question.body")
    @Mapping(target = "questionAuthorName", source = "answer.question.author.profile.fullName")
    @Mapping(target = "answerAuthorId", source = "answer.author.id")
    @Mapping(target = "answerAuthorName", source = "answer.author.profile.fullName")
    @Mapping(target = "answerAuthorEmail", source = "answer.author.email")
    @Mapping(target = "reporterId", source = "reporter.id")
    @Mapping(target = "reporterName", source = "reporter.profile.fullName")
    @Mapping(target = "reporterEmail", source = "reporter.email")
    @Mapping(target = "reporterAvatarUrl", source = "reporter.profile.avatarUrl")
    AdminAnswerReportResponse toAdminResponse(Report report);
}
