package com.alumnect.alumnect_backend.mapper.report;

import com.alumnect.alumnect_backend.dto.response.admin.AdminQuestionReportResponse;
import com.alumnect.alumnect_backend.entity.report.Report;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper chuyển đổi giữa thực thể Report (loại câu hỏi) và Admin Response DTO (UC78).
 */
@Mapper(componentModel = "spring")
public interface QuestionReportMapper {

    @Mapping(target = "questionId", source = "question.id")
    @Mapping(target = "questionTitle", source = "question.title")
    @Mapping(target = "questionBody", source = "question.body")
    @Mapping(target = "questionStatus", source = "question.status")
    @Mapping(target = "answerCount", source = "question.answerCount")
    @Mapping(target = "voteCount", source = "question.voteCount")
    @Mapping(target = "topicId", source = "question.topic.id")
    @Mapping(target = "topicName", source = "question.topic.name")
    @Mapping(target = "questionAuthorId", source = "question.author.id")
    @Mapping(target = "questionAuthorName", source = "question.author.profile.fullName")
    @Mapping(target = "questionAuthorEmail", source = "question.author.email")
    @Mapping(target = "reporterId", source = "reporter.id")
    @Mapping(target = "reporterName", source = "reporter.profile.fullName")
    @Mapping(target = "reporterEmail", source = "reporter.email")
    @Mapping(target = "reporterAvatarUrl", source = "reporter.profile.avatarUrl")
    AdminQuestionReportResponse toAdminResponse(Report report);
}
