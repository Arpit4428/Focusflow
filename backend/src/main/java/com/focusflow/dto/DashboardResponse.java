package com.focusflow.dto;

import java.util.List;

/**
 * Data Transfer Object for Dashboard aggregation.
 * Combines task metrics, focus session stats, weekly breakdown, and productivity score.
 */
public class DashboardResponse {

    private long todayFocusSeconds;
    private long totalTasks;
    private long completedTasks;
    private long pendingTasks;
    private double taskCompletionRate; // 0.0 to 100.0
    private int productivityScore;     // 0 to 100

    private List<DailyFocusStat> weeklyFocus;
    private List<TaskResponse> recentTasks;
    private List<FocusSessionResponse> recentSessions;

    public DashboardResponse() {
    }

    public DashboardResponse(long todayFocusSeconds, long totalTasks, long completedTasks,
                             long pendingTasks, double taskCompletionRate, int productivityScore,
                             List<DailyFocusStat> weeklyFocus, List<TaskResponse> recentTasks,
                             List<FocusSessionResponse> recentSessions) {
        this.todayFocusSeconds = todayFocusSeconds;
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.pendingTasks = pendingTasks;
        this.taskCompletionRate = taskCompletionRate;
        this.productivityScore = productivityScore;
        this.weeklyFocus = weeklyFocus;
        this.recentTasks = recentTasks;
        this.recentSessions = recentSessions;
    }

    public static class DailyFocusStat {
        private String day;      // e.g. "Mon"
        private String date;     // e.g. "2026-09-12"
        private long seconds;    // total focus seconds
        private int minutes;     // rounded minutes for charts

        public DailyFocusStat() {
        }

        public DailyFocusStat(String day, String date, long seconds, int minutes) {
            this.day = day;
            this.date = date;
            this.seconds = seconds;
            this.minutes = minutes;
        }

        public String getDay() {
            return day;
        }

        public void setDay(String day) {
            this.day = day;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public long getSeconds() {
            return seconds;
        }

        public void setSeconds(long seconds) {
            this.seconds = seconds;
        }

        public int getMinutes() {
            return minutes;
        }

        public void setMinutes(int minutes) {
            this.minutes = minutes;
        }
    }

    public long getTodayFocusSeconds() {
        return todayFocusSeconds;
    }

    public void setTodayFocusSeconds(long todayFocusSeconds) {
        this.todayFocusSeconds = todayFocusSeconds;
    }

    public long getTotalTasks() {
        return totalTasks;
    }

    public void setTotalTasks(long totalTasks) {
        this.totalTasks = totalTasks;
    }

    public long getCompletedTasks() {
        return completedTasks;
    }

    public void setCompletedTasks(long completedTasks) {
        this.completedTasks = completedTasks;
    }

    public long getPendingTasks() {
        return pendingTasks;
    }

    public void setPendingTasks(long pendingTasks) {
        this.pendingTasks = pendingTasks;
    }

    public double getTaskCompletionRate() {
        return taskCompletionRate;
    }

    public void setTaskCompletionRate(double taskCompletionRate) {
        this.taskCompletionRate = taskCompletionRate;
    }

    public int getProductivityScore() {
        return productivityScore;
    }

    public void setProductivityScore(int productivityScore) {
        this.productivityScore = productivityScore;
    }

    public List<DailyFocusStat> getWeeklyFocus() {
        return weeklyFocus;
    }

    public void setWeeklyFocus(List<DailyFocusStat> weeklyFocus) {
        this.weeklyFocus = weeklyFocus;
    }

    public List<TaskResponse> getRecentTasks() {
        return recentTasks;
    }

    public void setRecentTasks(List<TaskResponse> recentTasks) {
        this.recentTasks = recentTasks;
    }

    public List<FocusSessionResponse> getRecentSessions() {
        return recentSessions;
    }

    public void setRecentSessions(List<FocusSessionResponse> recentSessions) {
        this.recentSessions = recentSessions;
    }
}
