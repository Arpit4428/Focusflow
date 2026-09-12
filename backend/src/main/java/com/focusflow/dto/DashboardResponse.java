package com.focusflow.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Data Transfer Object for Dashboard aggregation.
 * Combines task metrics, focus session stats, weekly breakdown, productivity score,
 * and first-class subject distribution analytics.
 */
public class DashboardResponse {

    private long todayFocusSeconds;
    private long totalTasks;
    private long completedTasks;
    private long pendingTasks;
    private double taskCompletionRate; // 0.0 to 100.0
    private int productivityScore;     // 0 to 100

    private int dailyFocusGoalMinutes = 120;

    private List<DailyFocusStat> weeklyFocus;
    private List<TaskResponse> recentTasks;
    private List<FocusSessionResponse> recentSessions;
    private List<SubjectStat> subjectAnalytics = new ArrayList<>();

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
        this.subjectAnalytics = new ArrayList<>();
        this.dailyFocusGoalMinutes = 120;
    }

    public DashboardResponse(long todayFocusSeconds, long totalTasks, long completedTasks,
                             long pendingTasks, double taskCompletionRate, int productivityScore,
                             List<DailyFocusStat> weeklyFocus, List<TaskResponse> recentTasks,
                             List<FocusSessionResponse> recentSessions, List<SubjectStat> subjectAnalytics) {
        this.todayFocusSeconds = todayFocusSeconds;
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.pendingTasks = pendingTasks;
        this.taskCompletionRate = taskCompletionRate;
        this.productivityScore = productivityScore;
        this.weeklyFocus = weeklyFocus;
        this.recentTasks = recentTasks;
        this.recentSessions = recentSessions;
        this.subjectAnalytics = subjectAnalytics != null ? subjectAnalytics : new ArrayList<>();
        this.dailyFocusGoalMinutes = 120;
    }

    public DashboardResponse(long todayFocusSeconds, long totalTasks, long completedTasks,
                             long pendingTasks, double taskCompletionRate, int productivityScore,
                             List<DailyFocusStat> weeklyFocus, List<TaskResponse> recentTasks,
                             List<FocusSessionResponse> recentSessions, List<SubjectStat> subjectAnalytics,
                             int dailyFocusGoalMinutes) {
        this.todayFocusSeconds = todayFocusSeconds;
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.pendingTasks = pendingTasks;
        this.taskCompletionRate = taskCompletionRate;
        this.productivityScore = productivityScore;
        this.weeklyFocus = weeklyFocus;
        this.recentTasks = recentTasks;
        this.recentSessions = recentSessions;
        this.subjectAnalytics = subjectAnalytics != null ? subjectAnalytics : new ArrayList<>();
        this.dailyFocusGoalMinutes = dailyFocusGoalMinutes > 0 ? dailyFocusGoalMinutes : 120;
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

    public static class SubjectStat {
        private String subjectId;
        private String subjectName;
        private String color;
        private long focusSeconds;
        private int focusMinutes;
        private double focusPercentage;
        private long totalTasks;
        private long completedTasks;
        private long pendingTasks;

        public SubjectStat() {
        }

        public SubjectStat(String subjectId, String subjectName, String color, long focusSeconds,
                           int focusMinutes, double focusPercentage, long totalTasks,
                           long completedTasks, long pendingTasks) {
            this.subjectId = subjectId;
            this.subjectName = subjectName;
            this.color = color;
            this.focusSeconds = focusSeconds;
            this.focusMinutes = focusMinutes;
            this.focusPercentage = focusPercentage;
            this.totalTasks = totalTasks;
            this.completedTasks = completedTasks;
            this.pendingTasks = pendingTasks;
        }

        public String getSubjectId() {
            return subjectId;
        }

        public void setSubjectId(String subjectId) {
            this.subjectId = subjectId;
        }

        public String getSubjectName() {
            return subjectName;
        }

        public void setSubjectName(String subjectName) {
            this.subjectName = subjectName;
        }

        public String getColor() {
            return color;
        }

        public void setColor(String color) {
            this.color = color;
        }

        public long getFocusSeconds() {
            return focusSeconds;
        }

        public void setFocusSeconds(long focusSeconds) {
            this.focusSeconds = focusSeconds;
        }

        public int getFocusMinutes() {
            return focusMinutes;
        }

        public void setFocusMinutes(int focusMinutes) {
            this.focusMinutes = focusMinutes;
        }

        public double getFocusPercentage() {
            return focusPercentage;
        }

        public void setFocusPercentage(double focusPercentage) {
            this.focusPercentage = focusPercentage;
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

    public List<SubjectStat> getSubjectAnalytics() {
        return subjectAnalytics;
    }

    public void setSubjectAnalytics(List<SubjectStat> subjectAnalytics) {
        this.subjectAnalytics = subjectAnalytics;
    }

    public int getDailyFocusGoalMinutes() {
        return dailyFocusGoalMinutes > 0 ? dailyFocusGoalMinutes : 120;
    }

    public void setDailyFocusGoalMinutes(int dailyFocusGoalMinutes) {
        this.dailyFocusGoalMinutes = dailyFocusGoalMinutes > 0 ? dailyFocusGoalMinutes : 120;
    }
}
