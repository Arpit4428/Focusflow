package com.focusflow.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO representing monthly calendar response containing day activities.
 */
public class CalendarResponse {

    private int year;
    private int month;
    private List<CalendarDayActivity> activities = new ArrayList<>();

    public CalendarResponse() {
    }

    public CalendarResponse(int year, int month, List<CalendarDayActivity> activities) {
        this.year = year;
        this.month = month;
        this.activities = activities != null ? activities : new ArrayList<>();
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public List<CalendarDayActivity> getActivities() {
        return activities;
    }

    public void setActivities(List<CalendarDayActivity> activities) {
        this.activities = activities;
    }
}
