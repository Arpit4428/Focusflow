package com.focusflow.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO representing aggregated student study activity for a single calendar date.
 */
public class CalendarDayActivity {

    private String date; // e.g. "2026-09-12"
    private long totalFocusSeconds;
    private int totalFocusMinutes;
    private long taskCount;
    private long completedTaskCount;
    private long pendingTaskCount;

    private List<SubjectBreakdown> subjectBreakdown = new ArrayList<>();
    private List<TaskResponse> tasks = new ArrayList<>();
    private List<FocusSessionResponse> sessions = new ArrayList<>();

    public CalendarDayActivity() {
    }

    public CalendarDayActivity(String date, long totalFocusSeconds, int totalFocusMinutes,
                               long taskCount, long completedTaskCount, long pendingTaskCount,
                               List<SubjectBreakdown> subjectBreakdown, List<TaskResponse> tasks,
                               List<FocusSessionResponse> sessions) {
        this.date = date;
        this.totalFocusSeconds = totalFocusSeconds;
        this.totalFocusMinutes = totalFocusMinutes;
        this.taskCount = taskCount;
        this.completedTaskCount = completedTaskCount;
        this.pendingTaskCount = pendingTaskCount;
        this.subjectBreakdown = subjectBreakdown != null ? subjectBreakdown : new ArrayList<>();
        this.tasks = tasks != null ? tasks : new ArrayList<>();
        this.sessions = sessions != null ? sessions : new ArrayList<>();
    }

    public static class SubjectBreakdown {
        private String subjectId;
        private String subjectName;
        private String color;
        private long focusSeconds;
        private int focusMinutes;
        private long taskCount;
        private long completedTaskCount;

        public SubjectBreakdown() {
        }

        public SubjectBreakdown(String subjectId, String subjectName, String color,
                                long focusSeconds, int focusMinutes, long taskCount,
                                long completedTaskCount) {
            this.subjectId = subjectId;
            this.subjectName = subjectName;
            this.color = color;
            this.focusSeconds = focusSeconds;
            this.focusMinutes = focusMinutes;
            this.taskCount = taskCount;
            this.completedTaskCount = completedTaskCount;
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

        public long getTaskCount() {
            return taskCount;
        }

        public void setTaskCount(long taskCount) {
            this.taskCount = taskCount;
        }

        public long getCompletedTaskCount() {
            return completedTaskCount;
        }

        public void setCompletedTaskCount(long completedTaskCount) {
            this.completedTaskCount = completedTaskCount;
        }
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public long getTotalFocusSeconds() {
        return totalFocusSeconds;
    }

    public void setTotalFocusSeconds(long totalFocusSeconds) {
        this.totalFocusSeconds = totalFocusSeconds;
    }

    public int getTotalFocusMinutes() {
        return totalFocusMinutes;
    }

    public void setTotalFocusMinutes(int totalFocusMinutes) {
        this.totalFocusMinutes = totalFocusMinutes;
    }

    public long getTaskCount() {
        return taskCount;
    }

    public void setTaskCount(long taskCount) {
        this.taskCount = taskCount;
    }

    public long getCompletedTaskCount() {
        return completedTaskCount;
    }

    public void setCompletedTaskCount(long completedTaskCount) {
        this.completedTaskCount = completedTaskCount;
    }

    public long getPendingTaskCount() {
        return pendingTaskCount;
    }

    public void setPendingTaskCount(long pendingTaskCount) {
        this.pendingTaskCount = pendingTaskCount;
    }

    public List<SubjectBreakdown> getSubjectBreakdown() {
        return subjectBreakdown;
    }

    public void setSubjectBreakdown(List<SubjectBreakdown> subjectBreakdown) {
        this.subjectBreakdown = subjectBreakdown;
    }

    public List<TaskResponse> getTasks() {
        return tasks;
    }

    public void setTasks(List<TaskResponse> tasks) {
        this.tasks = tasks;
    }

    public List<FocusSessionResponse> getSessions() {
        return sessions;
    }

    public void setSessions(List<FocusSessionResponse> sessions) {
        this.sessions = sessions;
    }
}
