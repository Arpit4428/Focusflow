package com.focusflow.dto;

public class UserPreferencesResponse {

    private Integer dailyFocusGoalMinutes;

    public UserPreferencesResponse() {
    }

    public UserPreferencesResponse(Integer dailyFocusGoalMinutes) {
        this.dailyFocusGoalMinutes = dailyFocusGoalMinutes;
    }

    public Integer getDailyFocusGoalMinutes() {
        return dailyFocusGoalMinutes;
    }

    public void setDailyFocusGoalMinutes(Integer dailyFocusGoalMinutes) {
        this.dailyFocusGoalMinutes = dailyFocusGoalMinutes;
    }
}
