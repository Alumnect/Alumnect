package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.dto.response.admin.AdminRevenueOverviewResponse;

import java.time.Instant;

public interface AdminRevenueService {
    AdminRevenueOverviewResponse getOverview(Instant from, Instant to);
}
