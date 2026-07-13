package com.alumnect.alumnect_backend.dao.alumnemap;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface AlumniMapProjection {
    Long getUserId();
    String getFullName();
    String getAvatarUrl();
    Boolean getVerified();
    String getTitle();
    String getCompany();
    String getLocation();
    BigDecimal getLatitude();
    BigDecimal getLongitude();
    LocalDate getStartDate();
    Integer getCohort();
}
