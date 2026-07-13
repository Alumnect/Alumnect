package com.alumnect.alumnect_backend.dao.careerpath;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CareerPathQueryRepository {
    Page<Long> findActiveAlumniUserIds(
            String search,
            String title,
            String company,
            String location,
            Integer cohort,
            Long majorId,
            Pageable pageable
    );
}
