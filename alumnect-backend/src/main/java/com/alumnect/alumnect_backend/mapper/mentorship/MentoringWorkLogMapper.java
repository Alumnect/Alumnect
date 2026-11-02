package com.alumnect.alumnect_backend.mapper.mentorship;

import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWorkLogAttachmentResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWorkLogFeedbackResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWorkLogResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringWorkLogRevisionResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLog;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLogAttachment;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLogFeedback;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringWorkLogRevision;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct Mapper chuyển đổi giữa entity MentoringWorkLog và các DTO phản hồi (UC107 & UC108).
 */
@Mapper(componentModel = "spring")
public interface MentoringWorkLogMapper {

    @Mapping(target = "taskId", source = "task.id")
    @Mapping(target = "mentorId", source = "mentor.id")
    @Mapping(target = "mentorName", source = "mentor.profile.fullName")
    @Mapping(target = "mentorAvatar", source = "mentor.profile.avatarUrl")
    @Mapping(target = "confirmedBy", source = "confirmedBy.id")
    @Mapping(target = "confirmedByName", source = "confirmedBy.profile.fullName")
    @Mapping(target = "canEdit", constant = "false")
    @Mapping(target = "canConfirm", constant = "false")
    @Mapping(target = "canReject", constant = "false")
    MentoringWorkLogResponse toWorkLogResponse(MentoringWorkLog workLog);

    List<MentoringWorkLogResponse> toWorkLogResponseList(List<MentoringWorkLog> workLogs);

    MentoringWorkLogAttachmentResponse toAttachmentResponse(MentoringWorkLogAttachment attachment);

    List<MentoringWorkLogAttachmentResponse> toAttachmentResponseList(List<MentoringWorkLogAttachment> attachments);

    @Mapping(target = "workLogId", source = "workLog.id")
    @Mapping(target = "studentId", source = "student.id")
    @Mapping(target = "studentName", source = "student.profile.fullName")
    @Mapping(target = "studentAvatar", source = "student.profile.avatarUrl")
    MentoringWorkLogFeedbackResponse toFeedbackResponse(MentoringWorkLogFeedback feedback);

    List<MentoringWorkLogFeedbackResponse> toFeedbackResponseList(List<MentoringWorkLogFeedback> feedbacks);

    @Mapping(target = "workLogId", source = "workLog.id")
    @Mapping(target = "mentorId", source = "mentor.id")
    @Mapping(target = "mentorName", source = "mentor.profile.fullName")
    MentoringWorkLogRevisionResponse toRevisionResponse(MentoringWorkLogRevision revision);

    List<MentoringWorkLogRevisionResponse> toRevisionResponseList(List<MentoringWorkLogRevision> revisions);
}
