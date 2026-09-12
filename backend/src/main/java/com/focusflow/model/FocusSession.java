package com.focusflow.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB Document representing a completed focus study session.
 * Duration is stored consistently in SECONDS.
 */
@Document(collection = "focus_sessions")
@CompoundIndex(name = "user_started_idx", def = "{'userId': 1, 'startedAt': -1}")
@CompoundIndex(name = "user_subject_idx", def = "{'userId': 1, 'subject': 1}")
@CompoundIndex(name = "user_subject_id_idx", def = "{'userId': 1, 'subjectId': 1}")
public class FocusSession {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String subjectId;

    private String subject;

    // Stored in seconds
    private long duration;

    private Instant startedAt;

    private Instant endedAt;

    private boolean completed = true;

    public FocusSession() {
    }

    public FocusSession(String userId, String subject, long duration, Instant startedAt, Instant endedAt, boolean completed) {
        this.userId = userId;
        this.subject = subject;
        this.duration = duration;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.completed = completed;
    }

    public FocusSession(String userId, String subjectId, String subject, long duration, Instant startedAt, Instant endedAt, boolean completed) {
        this.userId = userId;
        this.subjectId = subjectId;
        this.subject = subject;
        this.duration = duration;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.completed = completed;
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
