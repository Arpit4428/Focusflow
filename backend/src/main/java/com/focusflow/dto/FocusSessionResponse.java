package com.focusflow.dto;

import com.focusflow.model.FocusSession;

import java.time.Instant;

public class FocusSessionResponse {

    private String id;
    private String userId;
    private String subjectId;
    private String subject;
    private long duration; // in seconds
    private Instant startedAt;
    private Instant endedAt;
    private boolean completed;

    public FocusSessionResponse() {
    }

    public FocusSessionResponse(String id, String userId, String subject, long duration,
                                Instant startedAt, Instant endedAt, boolean completed) {
        this.id = id;
        this.userId = userId;
        this.subjectId = null;
        this.subject = subject;
        this.duration = duration;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.completed = completed;
    }

    public FocusSessionResponse(String id, String userId, String subjectId, String subject, long duration,
                                Instant startedAt, Instant endedAt, boolean completed) {
        this.id = id;
        this.userId = userId;
        this.subjectId = subjectId;
        this.subject = subject;
        this.duration = duration;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.completed = completed;
    }

    public static FocusSessionResponse fromEntity(FocusSession session) {
        return new FocusSessionResponse(
                session.getId(),
                session.getUserId(),
                session.getSubjectId(),
                session.getSubject(),
                session.getDuration(),
                session.getStartedAt(),
                session.getEndedAt(),
                session.isCompleted()
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

    public long getDuration() {
        return duration;
    }

    public void setDuration(long duration) {
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
