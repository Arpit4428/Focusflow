package com.focusflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SubjectRequest {

    @NotBlank(message = "Subject name is required")
    @Size(min = 1, max = 50, message = "Subject name must be between 1 and 50 characters")
    private String name;

    private String color;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    public SubjectRequest() {
    }

    public SubjectRequest(String name, String color, String description) {
        this.name = name;
        this.color = color;
        this.description = description;
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
        this.color = color;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
