package com.alumnect.alumnect_backend.mapper.mentorship;

import com.alumnect.alumnect_backend.dto.response.mentorship.MentorSubscriptionResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorSubscription;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Interface Mapper chuyển đổi dữ liệu giữa Entity MentorSubscription và DTO MentorSubscriptionResponse.
 */
@Mapper(componentModel = "spring")
public interface MentorSubscriptionMapper {

    /**
     * Chuyển đổi từ Entity MentorSubscription sang DTO MentorSubscriptionResponse.
     *
     * @param subscription Entity đăng ký gói Mentor
     * @return DTO phản hồi đăng ký gói
     */
    @Mapping(target = "mentorProfileId", source = "mentorProfile.id")
    @Mapping(target = "packageId", source = "mentorPackage.id")
    @Mapping(target = "packageCode", source = "mentorPackage.code")
    @Mapping(target = "packageName", source = "mentorPackage.name")
    @Mapping(target = "nextStep", constant = "UC93_PAYMENT")
    MentorSubscriptionResponse toResponse(MentorSubscription subscription);
}
