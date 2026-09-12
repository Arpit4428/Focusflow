package com.focusflow.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB Document representing a student study task.
 * Indexed by userId for fast queries and security isolation.
 */
@Document(collection = "tasks")
@CompoundIndex(name = "user_status_idx", def = "{'userId': 1, 'status': 1}")
@CompoundIndex(name = "user_due_idx", def = "{'userId': 1, 'dueDate': 1}")
public class Task {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String title;

    private String description;

    private String subject;

    private Priority priority = Priority.MEDIUM;

    private TaskStatus status = TaskStatus.PENDING;

    private Instant dueDate;

    private Instant createdAt = Instant.now();

    private Instant completedAt;

    public Task() {
    }

    public Task(String userId, String title, String description, String subject,
                Priority priority, Instant dueDate) {
        this.userId = userId;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.priority = priority != null ? priority : Priority.MEDIUM;
        this.status = TaskStatus.PENDING;
        this.dueDate = dueDate;
        this.createdAt = Instant.now();
        this.completedAt = null;
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
