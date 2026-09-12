package com.focusflow.service;

import com.focusflow.dto.TaskRequest;
import com.focusflow.dto.TaskResponse;
import com.focusflow.exception.BadRequestException;
import com.focusflow.exception.ResourceNotFoundException;
import com.focusflow.model.Priority;
import com.focusflow.model.Subject;
import com.focusflow.model.Task;
import com.focusflow.model.TaskStatus;
import com.focusflow.model.User;
import com.focusflow.repository.SubjectRepository;
import com.focusflow.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Task Management Service.
 * Enforces strict per-user tenancy by deriving the userId solely from
 * the authenticated User principal passed by Spring Security.
 */
@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final SubjectRepository subjectRepository;

    public TaskService(TaskRepository taskRepository, SubjectRepository subjectRepository) {
        this.taskRepository = taskRepository;
        this.subjectRepository = subjectRepository;
    }

    public TaskResponse createTask(TaskRequest request, User currentUser) {
        String resolvedSubject;
        String resolvedSubjectId = null;

        if (request.getSubjectId() != null && !request.getSubjectId().trim().isEmpty()) {
            String subId = request.getSubjectId().trim();
            Subject subject = subjectRepository.findByIdAndUserId(subId, currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subId));
            resolvedSubjectId = subject.getId();
            resolvedSubject = subject.getName();
        } else if (request.getSubject() != null && !request.getSubject().trim().isEmpty()) {
            resolvedSubject = request.getSubject().trim();
        } else {
            throw new BadRequestException("Subject or subjectId is required");
        }

        Task task = new Task(
                currentUser.getId(),
                request.getTitle().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                resolvedSubject,
                request.getPriority(),
                request.getDueDate()
        );
        task.setSubjectId(resolvedSubjectId);

        Task savedTask = taskRepository.save(task);
        return TaskResponse.fromEntity(savedTask);
    }

    public List<TaskResponse> getTasks(User currentUser, TaskStatus status, Priority priority) {
        List<Task> tasks;

        if (status != null && priority != null) {
            tasks = taskRepository.findByUserIdAndStatusAndPriorityOrderByDueDateAsc(
                    currentUser.getId(), status, priority);
        } else if (status != null) {
            tasks = taskRepository.findByUserIdAndStatusOrderByDueDateAsc(
                    currentUser.getId(), status);
        } else if (priority != null) {
            tasks = taskRepository.findByUserIdAndPriorityOrderByDueDateAsc(
                    currentUser.getId(), priority);
        } else {
            tasks = taskRepository.findByUserIdOrderByDueDateAsc(currentUser.getId());
        }

        return tasks.stream()
                .map(TaskResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public TaskResponse getTaskById(String id, User currentUser) {
        Task task = taskRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        return TaskResponse.fromEntity(task);
    }

    public TaskResponse updateTask(String id, TaskRequest request, User currentUser) {
        Task task = taskRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        if (request.getSubjectId() != null && !request.getSubjectId().trim().isEmpty()) {
            String subId = request.getSubjectId().trim();
            Subject subject = subjectRepository.findByIdAndUserId(subId, currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subId));
            task.setSubjectId(subject.getId());
            task.setSubject(subject.getName());
        } else if (request.getSubject() != null && !request.getSubject().trim().isEmpty()) {
            task.setSubject(request.getSubject().trim());
        }

        task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());

        if (request.getStatus() != null && request.getStatus() != task.getStatus()) {
            task.setStatus(request.getStatus());
            if (request.getStatus() == TaskStatus.COMPLETED) {
                task.setCompletedAt(Instant.now());
            } else {
                task.setCompletedAt(null);
            }
        }

        Task updated = taskRepository.save(task);
        return TaskResponse.fromEntity(updated);
    }

    public void deleteTask(String id, User currentUser) {
        Task task = taskRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        taskRepository.delete(task);
    }

    public TaskResponse completeTask(String id, User currentUser) {
        Task task = taskRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        if (task.getStatus() == TaskStatus.PENDING) {
            task.setStatus(TaskStatus.COMPLETED);
            task.setCompletedAt(Instant.now());
        } else {
            task.setStatus(TaskStatus.PENDING);
            task.setCompletedAt(null);
        }

        Task updated = taskRepository.save(task);
        return TaskResponse.fromEntity(updated);
    }
}
