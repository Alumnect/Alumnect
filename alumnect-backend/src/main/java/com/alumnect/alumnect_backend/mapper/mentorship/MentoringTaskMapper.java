package com.alumnect.alumnect_backend.mapper.mentorship;

import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentCheckoutResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentStatusResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTask;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringTaskPayment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * MapStruct Mapper chuyển đổi đối tượng Mentoring Task và Task Payment (UC105).
 */
@Mapper(componentModel = "spring")
public interface MentoringTaskMapper {

    @Mapping(target = "dealId", source = "deal.id")
    @Mapping(target = "studentId", source = "student.id")
    @Mapping(target = "studentName", source = "student.profile.fullName")
    @Mapping(target = "studentAvatar", source = "student.profile.avatarUrl")
    @Mapping(target = "mentorId", source = "mentor.id")
    @Mapping(target = "mentorName", source = "mentor.profile.fullName")
    @Mapping(target = "mentorAvatar", source = "mentor.profile.avatarUrl")
    MentoringTaskResponse toTaskResponse(MentoringTask task);

    @Mapping(target = "paymentId", source = "id")
    @Mapping(target = "dealId", source = "deal.id")
    @Mapping(target = "taskTitle", expression = "java(payment.getTask() != null ? payment.getTask().getTaskTitle() : payment.getDeal().getTaskScope())")
    @Mapping(target = "mentorName", source = "deal.mentor.profile.fullName")
    MentoringTaskPaymentCheckoutResponse toCheckoutResponse(MentoringTaskPayment payment);

    @Mapping(target = "paymentId", source = "id")
    @Mapping(target = "dealId", source = "deal.id")
    @Mapping(target = "taskId", source = "task.id")
    @Mapping(target = "taskStatus", source = "task.status")
    @Mapping(target = "message", ignore = true)
    MentoringTaskPaymentStatusResponse toStatusResponse(MentoringTaskPayment payment);
}
