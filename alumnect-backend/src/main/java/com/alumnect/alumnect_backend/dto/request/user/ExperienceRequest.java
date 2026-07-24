package com.alumnect.alumnect_backend.dto.request.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperienceRequest {

    @NotBlank(message = "Title không được để trống")
    @Size(max = 120, message = "Title tối đa 120 ký tự")
    private String title;

    @NotBlank(message = "Company / Organization không được để trống")
    @Size(max = 150, message = "Company / Organization tối đa 150 ký tự")
    private String company;

    @Size(max = 120, message = "Location tối đa 120 ký tự")
    private String location;

    @NotNull(message = "Start date không được để trống")
    private LocalDate startDate;

    private LocalDate endDate;

    @JsonProperty("isCurrent")
    private boolean isCurrent;

    @JsonProperty("isPrimary")
    private boolean isPrimary;


    private BigDecimal latitude;

    private BigDecimal longitude;

    @Size(max = 255, message = "Place ID tối đa 255 ký tự")
    private String placeId;

    @Size(max = 120, message = "Location City tối đa 120 ký tự")
    private String locationCity;

    @Size(max = 120, message = "Location Country tối đa 120 ký tự")
    private String locationCountry;

    @Size(max = 10, message = "Location Country Code tối đa 10 ký tự")
    private String locationCountryCode;

    @Size(max = 50, message = "Geocoding Provider tối đa 50 ký tự")
    private String geocodingProvider;

    private String description;
}
