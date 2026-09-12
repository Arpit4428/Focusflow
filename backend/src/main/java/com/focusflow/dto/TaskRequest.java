package com.focusflow.dto;

import com.focusflow.model.Priority;
import com.focusflow.model.TaskStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class TaskRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 2, max = 100, message = "Title must be between 2 and 100 characters")
    private String title;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    private String subjectId;

    @Size(max = 50, message = "Subject must not exceed 50 characters")
    private String subject;

    @NotNull(message = "Priority is required")
    private Priority priority = Priority.MEDIUM;

    @NotNull(message = "Due date is required")
    private Instant dueDate;

    private TaskStatus status;

    @AssertTrue(message = "Subject is required")
    public boolean isSubject() {
        return (subjectId != null && !subjectId.trim().isEmpty()) ||
               (subject != null && !subject.trim().isEmpty());
    }

    public TaskRequest() {
    }

    public TaskRequest(String title, String description, String subject, Priority priority, Instant dueDate) {
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.priority = priority;
        this.dueDate = dueDate;
    }

    public TaskRequest(String title, String description, String subjectId, String subject, Priority priority, Instant dueDate) {
        this.title = title;
        this.description = description;
        this.subjectId = subjectId;
        this.subject = subject;
        this.priority = priority;
        this.dueDate = dueDate;
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

    public String getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(String subjectId) {
        this.subjectId = subjectId;
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

    public Instant getDueDate() {
        return dueDate;
    }

    public void setDueDate(Instant dueDate) {
        this.dueDate = dueDate;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }
}
