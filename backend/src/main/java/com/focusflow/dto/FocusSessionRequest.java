package com.focusflow.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class FocusSessionRequest {

    @NotBlank(message = "Subject is required")
    @Size(min = 2, max = 50, message = "Subject must be between 2 and 50 characters")
    private String subject;

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 second")
    private Long duration; // in seconds

    @NotNull(message = "Start time is required")
    private Instant startedAt;

    @NotNull(message = "End time is required")
    private Instant endedAt;

    private boolean completed = true;

    public FocusSessionRequest() {
    }

    public FocusSessionRequest(String subject, Long duration, Instant startedAt, Instant endedAt, boolean completed) {
        this.subject = subject;
        this.duration = duration;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.completed = completed;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public Long getDuration() {
        return duration;
    }

    public void setDuration(Long duration) {
        this.duration = duration;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
