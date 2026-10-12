package com.alumnect.alumnect_backend.controller.mentorship;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorSearchCriteria;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorCardResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorFilterOptionsResponse;
import com.alumnect.alumnect_backend.service.mentorship.MentorSearchService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử đơn vị cho MentorSearchController (UC98).
 */
@ExtendWith(MockitoExtension.class)
class MentorSearchControllerTest {

    @Mock
    private MentorSearchService mentorSearchService;

    @InjectMocks
    private MentorSearchController mentorSearchController;

    @Test
    @DisplayName("GET /api/v1/mentors - Tìm kiếm thành công trả HTTP 200 OK và ApiResponse bọc PageResponse")
    void searchMentors_returns200Ok() {
        MentorCardResponse card = MentorCardResponse.builder()
                .mentorId(1L)
                .userId(100L)
                .fullName("Trần Thị Mentor")
                .headline("Senior Frontend Engineer")
                .workingMode(MentoringWorkingMode.ONLINE)
                .mentoringType(MentoringType.INDIVIDUAL)
                .reputationScore(90)
                .rating(BigDecimal.valueOf(4.9))
                .build();

        PageResponse<MentorCardResponse> pageResponse = PageResponse.<MentorCardResponse>builder()
                .content(List.of(card))
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(mentorSearchService.searchMentors(any(MentorSearchCriteria.class), any(Pageable.class)))
                .thenReturn(pageResponse);

        ResponseEntity<ApiResponse<PageResponse<MentorCardResponse>>> responseEntity =
                mentorSearchController.searchMentors("Frontend", 10L, null, "SE", null, null, "React", null,
                        MentoringWorkingMode.ONLINE, MentoringType.INDIVIDUAL, "reputationScore", "DESC", 0, 10);

        assertNotNull(responseEntity);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertNotNull(responseEntity.getBody());
        assertEquals(0, responseEntity.getBody().getError());
        assertEquals("Tìm kiếm danh sách Mentor thành công", responseEntity.getBody().getMessage());
        assertEquals(1, responseEntity.getBody().getData().getContent().size());
        assertEquals("Trần Thị Mentor", responseEntity.getBody().getData().getContent().get(0).getFullName());
    }

    @Test
    @DisplayName("GET /api/v1/mentors/filter-options - Lấy tùy chọn bộ lọc thành công")
    void getFilterOptions_returns200Ok() {
        MentorFilterOptionsResponse options = MentorFilterOptionsResponse.builder()
                .industries(List.of(MentorFilterOptionsResponse.FilterOptionItem.builder().id(1L).name("IT").build()))
                .specializations(List.of(MentorFilterOptionsResponse.SpecializationOptionItem.builder().id(1L).code("SE").name("Kỹ thuật phần mềm").build()))
                .build();

        when(mentorSearchService.getFilterOptions()).thenReturn(options);

        ResponseEntity<ApiResponse<MentorFilterOptionsResponse>> responseEntity = mentorSearchController.getFilterOptions();

        assertNotNull(responseEntity);
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertNotNull(responseEntity.getBody());
        assertEquals(0, responseEntity.getBody().getError());
        assertEquals(1, responseEntity.getBody().getData().getIndustries().size());
    }
}
