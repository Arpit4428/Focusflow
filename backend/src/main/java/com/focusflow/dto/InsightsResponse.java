package com.focusflow.dto;

import java.util.List;

/**
 * Data Transfer Object for Academic Productivity Insights.
 * Delivers all-time metrics, last-7-days patterns, subject breakdowns, and rule-based recommendations.
 */
public class InsightsResponse {

    // 1. Overall Focus Stats (All-Time)
    private long totalFocusSeconds;
    private long averageSessionDurationSeconds;
    private long totalSessions;
    private String mostFocusedSubject;

    // 2. Task Statistics
    private long totalTasks;
    private long completedTasks;
    private long pendingTasks;
    private double taskCompletionRate;

    // 3. Study Patterns (Last 7 Days & Distribution)
    private String mostProductiveDayOfWeek;
    private int activeDaysLast7Days;
    private long weeklyFocusSeconds;

    // 4. Breakdowns
    private List<SubjectStat> subjectBreakdown;
    private List<DayOfWeekStat> dayOfWeekBreakdown;

    // 5. Deterministic Rule-Based Recommendations
    private List<Recommendation> recommendations;

    public InsightsResponse() {
    }

    public InsightsResponse(long totalFocusSeconds, long averageSessionDurationSeconds, long totalSessions,
                            String mostFocusedSubject, long totalTasks, long completedTasks, long pendingTasks,
                            double taskCompletionRate, String mostProductiveDayOfWeek, int activeDaysLast7Days,
                            long weeklyFocusSeconds, List<SubjectStat> subjectBreakdown,
                            List<DayOfWeekStat> dayOfWeekBreakdown, List<Recommendation> recommendations) {
        this.totalFocusSeconds = totalFocusSeconds;
        this.averageSessionDurationSeconds = averageSessionDurationSeconds;
        this.totalSessions = totalSessions;
        this.mostFocusedSubject = mostFocusedSubject;
        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.pendingTasks = pendingTasks;
        this.taskCompletionRate = taskCompletionRate;
        this.mostProductiveDayOfWeek = mostProductiveDayOfWeek;
        this.activeDaysLast7Days = activeDaysLast7Days;
        this.weeklyFocusSeconds = weeklyFocusSeconds;
        this.subjectBreakdown = subjectBreakdown;
        this.dayOfWeekBreakdown = dayOfWeekBreakdown;
        this.recommendations = recommendations;
    }

    public static class SubjectStat {
        private String subject;
        private long durationSeconds;
        private int minutes;
        private double percentage;

        public SubjectStat() {
        }

        public SubjectStat(String subject, long durationSeconds, int minutes, double percentage) {
            this.subject = subject;
            this.durationSeconds = durationSeconds;
            this.minutes = minutes;
            this.percentage = percentage;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public long getDurationSeconds() {
            return durationSeconds;
        }

        public void setDurationSeconds(long durationSeconds) {
            this.durationSeconds = durationSeconds;
        }

        public int getMinutes() {
            return minutes;
        }

        public void setMinutes(int minutes) {
            this.minutes = minutes;
        }

        public double getPercentage() {
            return percentage;
        }

        public void setPercentage(double percentage) {
            this.percentage = percentage;
        }
    }

    public static class DayOfWeekStat {
        private String dayOfWeek;
        private long durationSeconds;
        private int sessionCount;

        public DayOfWeekStat() {
        }

        public DayOfWeekStat(String dayOfWeek, long durationSeconds, int sessionCount) {
            this.dayOfWeek = dayOfWeek;
            this.durationSeconds = durationSeconds;
            this.sessionCount = sessionCount;
        }

        public String getDayOfWeek() {
            return dayOfWeek;
        }

        public void setDayOfWeek(String dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
        }

        public long getDurationSeconds() {
            return durationSeconds;
        }

        public void setDurationSeconds(long durationSeconds) {
            this.durationSeconds = durationSeconds;
        }

        public int getSessionCount() {
            return sessionCount;
        }

        public void setSessionCount(int sessionCount) {
            this.sessionCount = sessionCount;
        }
    }

    public static class Recommendation {
        private String type; // "SUCCESS", "WARNING", "INFO"
        private String title;
        private String message;

        public Recommendation() {
        }

        public Recommendation(String type, String title, String message) {
            this.type = type;
            this.title = title;
            this.message = message;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    public long getTotalFocusSeconds() {
        return totalFocusSeconds;
    }

    public void setTotalFocusSeconds(long totalFocusSeconds) {
        this.totalFocusSeconds = totalFocusSeconds;
    }

    public long getAverageSessionDurationSeconds() {
        return averageSessionDurationSeconds;
    }

    public void setAverageSessionDurationSeconds(long averageSessionDurationSeconds) {
        this.averageSessionDurationSeconds = averageSessionDurationSeconds;
    }

    public long getTotalSessions() {
        return totalSessions;
    }

    public void setTotalSessions(long totalSessions) {
        this.totalSessions = totalSessions;
    }

    public String getMostFocusedSubject() {
        return mostFocusedSubject;
    }

    public void setMostFocusedSubject(String mostFocusedSubject) {
        this.mostFocusedSubject = mostFocusedSubject;
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

    public String getMostProductiveDayOfWeek() {
        return mostProductiveDayOfWeek;
    }

    public void setMostProductiveDayOfWeek(String mostProductiveDayOfWeek) {
        this.mostProductiveDayOfWeek = mostProductiveDayOfWeek;
    }

    public int getActiveDaysLast7Days() {
        return activeDaysLast7Days;
    }

    public void setActiveDaysLast7Days(int activeDaysLast7Days) {
        this.activeDaysLast7Days = activeDaysLast7Days;
    }

    public long getWeeklyFocusSeconds() {
        return weeklyFocusSeconds;
    }

    public void setWeeklyFocusSeconds(long weeklyFocusSeconds) {
        this.weeklyFocusSeconds = weeklyFocusSeconds;
    }

    public List<SubjectStat> getSubjectBreakdown() {
        return subjectBreakdown;
    }

    public void setSubjectBreakdown(List<SubjectStat> subjectBreakdown) {
        this.subjectBreakdown = subjectBreakdown;
    }

    public List<DayOfWeekStat> getDayOfWeekBreakdown() {
        return dayOfWeekBreakdown;
    }

    public void setDayOfWeekBreakdown(List<DayOfWeekStat> dayOfWeekBreakdown) {
        this.dayOfWeekBreakdown = dayOfWeekBreakdown;
    }

    public List<Recommendation> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<Recommendation> recommendations) {
        this.recommendations = recommendations;
    }
}
