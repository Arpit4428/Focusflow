package com.focusflow.controller;

import com.focusflow.dto.TaskRequest;
import com.focusflow.dto.TaskResponse;
import com.focusflow.model.Priority;
import com.focusflow.model.TaskStatus;
import com.focusflow.model.User;
import com.focusflow.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Task Management REST Controller.
 * Injects authenticated User to guarantee strict tenant isolation.
 */
@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Priority priority) {
        List<TaskResponse> tasks = taskService.getTasks(currentUser, status, priority);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody TaskRequest request) {
        TaskResponse created = taskService.createTask(request, currentUser);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(
            @AuthenticationPrincipal User currentUser,
            @PathVariable String id) {
        TaskResponse task = taskService.getTaskById(id, currentUser);
        return ResponseEntity.ok(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @AuthenticationPrincipal User currentUser,
            @PathVariable String id,
            @Valid @RequestBody TaskRequest request) {
        TaskResponse updated = taskService.updateTask(id, request, currentUser);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @AuthenticationPrincipal User currentUser,
            @PathVariable String id) {
        taskService.deleteTask(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<TaskResponse> toggleComplete(
            @AuthenticationPrincipal User currentUser,
            @PathVariable String id) {
        TaskResponse updated = taskService.completeTask(id, currentUser);
        return ResponseEntity.ok(updated);
    }
}
