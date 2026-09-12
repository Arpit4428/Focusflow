package com.focusflow.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * MongoDB Document representing an academic subject or study module.
 * Scoped strictly per user with a unique compound index on userId and name.
 */
@Document(collection = "subjects")
@CompoundIndex(name = "user_subject_unique_idx", def = "{'userId': 1, 'name': 1}", unique = true)
public class Subject {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String name;

    private String color = "#DDEBDF";

    private String description;

    private Instant createdAt = Instant.now();

    private Instant updatedAt = Instant.now();

    public Subject() {
    }

    public Subject(String userId, String name, String color, String description) {
        this.userId = userId;
        this.name = name;
        this.color = (color != null && !color.trim().isEmpty()) ? color.trim() : "#DDEBDF";
        this.description = description;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = (color != null && !color.trim().isEmpty()) ? color.trim() : "#DDEBDF";
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
