package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.dao.alumnimap.AlumniMapProjection;
import com.alumnect.alumnect_backend.dao.alumnimap.AlumniMapRepository;
import com.alumnect.alumnect_backend.dto.response.alumnimap.AlumniMapResponse;
import com.alumnect.alumnect_backend.service.alumnimap.AlumniMapServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * FE-31 Alumni Map (View, Filter & Profile Navigation).
 * Report sheet : FE-31 (Report5_Unit_Test.xlsx)
 * Functions    : AlumniMapServiceImpl.getAlumniMapLocations()
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FE-31 Alumni Map (View, Filter & Profile Navigation)")
class FE31_AlumniMapTest {

    // ===== Mocks (dependencies) =====
    @Mock
    private AlumniMapRepository alumniMapRepository;

    // ===== System under test =====
    @InjectMocks
    private AlumniMapServiceImpl alumniMapService;

    // ================= getAlumniMapLocations() =================

    @Test
    @DisplayName("UTCID01 - All filters null -> Repository queried with all nulls and returns empty list")
    void utcid01_getAlumniMapLocations_okAllNull() {
        // Given
        when(alumniMapRepository.findAlumniMapLocations(null, null, null, null, null, null))
                .thenReturn(Collections.emptyList());

        // When
        List<AlumniMapResponse> result = alumniMapService.getAlumniMapLocations(
                null, null, null, null, null, null);

        // Then
        assertThat(result).isEmpty();
        verify(alumniMapRepository).findAlumniMapLocations(null, null, null, null, null, null);
    }

    @Test
    @DisplayName("UTCID02 - Valid filters -> Text trimmed lowercase wrapped in % and numbers unchanged")
    void utcid02_getAlumniMapLocations_okPattern() {
        // Given
        when(alumniMapRepository.findAlumniMapLocations(
                "%nguyen%", "%engineer%", "%fpt%", "%ha noi%", 2018, 1L))
                .thenReturn(Collections.emptyList());

        // When
        List<AlumniMapResponse> result = alumniMapService.getAlumniMapLocations(
                " Nguyen ", "Engineer", "FPT", "Ha Noi", 2018, 1L);

        // Then
        assertThat(result).isEmpty();
        verify(alumniMapRepository).findAlumniMapLocations(
                "%nguyen%", "%engineer%", "%fpt%", "%ha noi%", 2018, 1L);
    }

    @Test
    @DisplayName("UTCID03 - Blank text filters -> Converted to null patterns")
    void utcid03_getAlumniMapLocations_okBlank() {
        // Given
        when(alumniMapRepository.findAlumniMapLocations(null, null, null, null, null, null))
                .thenReturn(Collections.emptyList());

        // When
        List<AlumniMapResponse> result = alumniMapService.getAlumniMapLocations(
                "   ", "", "  ", "", null, null);

        // Then
        assertThat(result).isEmpty();
        verify(alumniMapRepository).findAlumniMapLocations(null, null, null, null, null, null);
    }

    @Test
    @DisplayName("UTCID04 - One alumnus with coordinates -> Returns mapped AlumniMapResponse")
    void utcid04_getAlumniMapLocations_okSingle() {
        // Given
        AlumniMapProjection projection = mock(AlumniMapProjection.class);
        when(projection.getUserId()).thenReturn(100L);
        when(projection.getFullName()).thenReturn("Nguyen Van A");
        when(projection.getTitle()).thenReturn("Software Engineer");
        when(projection.getCompany()).thenReturn("FPT Software");
        when(projection.getLatitude()).thenReturn(new BigDecimal("21.0285"));
        when(projection.getLongitude()).thenReturn(new BigDecimal("105.8542"));
        when(projection.getVerified()).thenReturn(true);
        when(projection.getCohort()).thenReturn(2018);

        when(alumniMapRepository.findAlumniMapLocations(null, null, null, null, null, null))
                .thenReturn(List.of(projection));

        // When
        List<AlumniMapResponse> result = alumniMapService.getAlumniMapLocations(
                null, null, null, null, null, null);

        // Then
        assertThat(result).hasSize(1);
        AlumniMapResponse response = result.get(0);
        assertThat(response.getUserId()).isEqualTo(100L);
        assertThat(response.getFullName()).isEqualTo("Nguyen Van A");
        assertThat(response.getTitle()).isEqualTo("Software Engineer");
        assertThat(response.getCompany()).isEqualTo("FPT Software");
        assertThat(response.getLatitude()).isEqualTo(new BigDecimal("21.0285"));
        assertThat(response.getLongitude()).isEqualTo(new BigDecimal("105.8542"));
        assertThat(response.getVerifiedStatus()).isTrue();
        assertThat(response.getCohort()).isEqualTo(2018);
        assertThat(response.getProfileIdentifier()).isEqualTo("100");
    }

    @Test
    @DisplayName("UTCID05 - Three alumni from repository -> Returns 3 markers in same order")
    void utcid05_getAlumniMapLocations_okThree() {
        // Given
        AlumniMapProjection p1 = mock(AlumniMapProjection.class);
        when(p1.getUserId()).thenReturn(101L);
        AlumniMapProjection p2 = mock(AlumniMapProjection.class);
        when(p2.getUserId()).thenReturn(102L);
        AlumniMapProjection p3 = mock(AlumniMapProjection.class);
        when(p3.getUserId()).thenReturn(103L);

        when(alumniMapRepository.findAlumniMapLocations(null, null, null, null, null, null))
                .thenReturn(List.of(p1, p2, p3));

        // When
        List<AlumniMapResponse> result = alumniMapService.getAlumniMapLocations(
                null, null, null, null, null, null);

        // Then
        assertThat(result).hasSize(3);
        assertThat(result.get(0).getUserId()).isEqualTo(101L);
        assertThat(result.get(1).getUserId()).isEqualTo(102L);
        assertThat(result.get(2).getUserId()).isEqualTo(103L);
    }

    @Test
    @DisplayName("UTCID06 - Filter matches nobody -> Returns empty list without exception")
    void utcid06_getAlumniMapLocations_okNoMatch() {
        // Given
        when(alumniMapRepository.findAlumniMapLocations(
                null, null, "%no such company%", null, null, null))
                .thenReturn(Collections.emptyList());

        // When
        List<AlumniMapResponse> result = alumniMapService.getAlumniMapLocations(
                null, null, "No Such Company", null, null, null);

        // Then
        assertThat(result).isEmpty();
        verify(alumniMapRepository).findAlumniMapLocations(
                null, null, "%no such company%", null, null, null);
    }

    @Test
    @DisplayName("UTCID07 - Title only tab and spaces -> titlePattern is null")
    void utcid07_getAlumniMapLocations_okWhitespace() {
        // Given
        when(alumniMapRepository.findAlumniMapLocations(null, null, null, null, null, null))
                .thenReturn(Collections.emptyList());

        // When
        List<AlumniMapResponse> result = alumniMapService.getAlumniMapLocations(
                null, "  \t ", null, null, null, null);

        // Then
        assertThat(result).isEmpty();
        verify(alumniMapRepository).findAlumniMapLocations(null, null, null, null, null, null);
    }
}
