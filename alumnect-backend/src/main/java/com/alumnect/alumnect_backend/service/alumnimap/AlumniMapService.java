package com.alumnect.alumnect_backend.service.alumnimap;

import com.alumnect.alumnect_backend.dto.response.alumnimap.AlumniMapResponse;
import java.util.List;

public interface AlumniMapService {
    List<AlumniMapResponse> getAlumniMapLocations(
            String search,
            String title,
            String company,
            String location,
            Integer cohort,
            Long majorId
    );
}
