package com.alumnect.alumnect_backend.dao.alumnemap;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface AlumniMapProjection {
    Long getUserId();
    Long getMajorId();
    String getFullName();
    String getAvatarUrl();
    Boolean getVerified();
    String getTitle();
    String getCompany();
    String getLocation();
    String getLocationCity();
    String getLocationCountry();
    String getLocationCountryCode();
    BigDecimal getLatitude();
    BigDecimal getLongitude();
    LocalDate getStartDate();
    Integer getCohort();
}
