package com.focusflow.dto;

import com.focusflow.model.Priority;
import com.focusflow.model.Task;
import com.focusflow.model.TaskStatus;

import java.time.Instant;

public class TaskResponse {

    private String id;
    private String userId;
    private String title;
    private String description;
    private String subject;
    private Priority priority;
    private TaskStatus status;
    private Instant dueDate;
    private Instant createdAt;
    private Instant completedAt;

    public TaskResponse() {
    }

    public TaskResponse(String id, String userId, String title, String description, String subject,
                        Priority priority, TaskStatus status, Instant dueDate, Instant createdAt, Instant completedAt) {
        this.id = id;
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.priority = priority;
        this.status = status;
        this.dueDate = dueDate;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }

    public static TaskResponse fromEntity(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getUserId(),
                task.getTitle(),
                task.getDescription(),
                task.getSubject(),
                task.getPriority(),
                task.getStatus(),
                task.getDueDate(),
                task.getCreatedAt(),
                task.getCompletedAt()
        );
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }

    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }
}
