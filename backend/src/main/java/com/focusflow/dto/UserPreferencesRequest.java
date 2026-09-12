package com.focusflow.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UserPreferencesRequest {

    @NotNull(message = "Daily focus goal is required")
    @Min(value = 15, message = "Daily focus goal must be at least 15 minutes")
    @Max(value = 720, message = "Daily focus goal cannot exceed 720 minutes (12 hours)")
    private Integer dailyFocusGoalMinutes;

    public UserPreferencesRequest() {
    }

    public UserPreferencesRequest(Integer dailyFocusGoalMinutes) {
        this.dailyFocusGoalMinutes = dailyFocusGoalMinutes;
    }

    public Integer getDailyFocusGoalMinutes() {
        return dailyFocusGoalMinutes;
    }

    public void setDailyFocusGoalMinutes(Integer dailyFocusGoalMinutes) {
        this.dailyFocusGoalMinutes = dailyFocusGoalMinutes;
    }
}
