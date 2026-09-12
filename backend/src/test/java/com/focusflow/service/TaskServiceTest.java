package com.focusflow.service;

import com.focusflow.dto.TaskRequest;
import com.focusflow.dto.TaskResponse;
import com.focusflow.exception.ResourceNotFoundException;
import com.focusflow.model.Priority;
import com.focusflow.model.Task;
import com.focusflow.model.TaskStatus;
import com.focusflow.model.User;
import com.focusflow.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    private TaskService taskService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository);

        userA = new User("User A", "a@example.com", "hashA");
        userA.setId("userA_id");

        userB = new User("User B", "b@example.com", "hashB");
        userB.setId("userB_id");
    }

    @Test
    @DisplayName("Create task associates task exclusively with authenticated currentUser.id")
    void testCreateTask() {
        Instant dueDate = Instant.now().plus(2, ChronoUnit.DAYS);
        TaskRequest request = new TaskRequest("Study Math", "Read ch 3", "Mathematics", Priority.HIGH, dueDate);

        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId("task1");
            return t;
        });

        TaskResponse response = taskService.createTask(request, userA);

        assertNotNull(response);
        assertEquals("task1", response.getId());
        assertEquals("userA_id", response.getUserId());
        assertEquals("Study Math", response.getTitle());
        assertEquals(Priority.HIGH, response.getPriority());
        assertEquals(TaskStatus.PENDING, response.getStatus());

        verify(taskRepository).save(argThat(t -> t.getUserId().equals("userA_id")));
    }

    @Test
    @DisplayName("Retrieve tasks only queries currentUser.id")
    void testGetTasks() {
        Task t1 = new Task("userA_id", "Task 1", "Desc", "Physics", Priority.LOW, Instant.now());
        t1.setId("t1");

        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(List.of(t1));

        List<TaskResponse> results = taskService.getTasks(userA, null, null);

        assertEquals(1, results.size());
        assertEquals("t1", results.get(0).getId());
        assertEquals("userA_id", results.get(0).getUserId());
        verify(taskRepository).findByUserIdOrderByDueDateAsc("userA_id");
    }

    @Test
    @DisplayName("Update task succeeds when task belongs to currentUser")
    void testUpdateTaskSuccess() {
        Instant due = Instant.now().plus(1, ChronoUnit.DAYS);
        Task existingTask = new Task("userA_id", "Old Title", "Old Desc", "Math", Priority.LOW, due);
        existingTask.setId("task1");

        when(taskRepository.findByIdAndUserId("task1", "userA_id")).thenReturn(Optional.of(existingTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskRequest updateReq = new TaskRequest("New Title", "New Desc", "Math Advanced", Priority.HIGH, due);
        TaskResponse updated = taskService.updateTask("task1", updateReq, userA);

        assertEquals("New Title", updated.getTitle());
        assertEquals(Priority.HIGH, updated.getPriority());
        assertEquals("Math Advanced", updated.getSubject());
    }

    @Test
    @DisplayName("Security Isolation: User B cannot access or update User A's task")
    void testUserBCannotUpdateUserATask() {
        // When User B attempts to access task1 belonging to User A, findByIdAndUserId returns empty
        when(taskRepository.findByIdAndUserId("task1", "userB_id")).thenReturn(Optional.empty());

        TaskRequest updateReq = new TaskRequest("Hacked", "Desc", "Math", Priority.LOW, Instant.now());

        assertThrows(ResourceNotFoundException.class, () ->
                taskService.updateTask("task1", updateReq, userB));

        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("Security Isolation: User B cannot delete User A's task")
    void testUserBCannotDeleteUserATask() {
        when(taskRepository.findByIdAndUserId("task1", "userB_id")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                taskService.deleteTask("task1", userB));

        verify(taskRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Complete task toggles status between PENDING and COMPLETED")
    void testCompleteTaskToggle() {
        Task task = new Task("userA_id", "Task", "Desc", "Math", Priority.MEDIUM, Instant.now());
        task.setId("t1");
        task.setStatus(TaskStatus.PENDING);

        when(taskRepository.findByIdAndUserId("t1", "userA_id")).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskResponse res1 = taskService.completeTask("t1", userA);
        assertEquals(TaskStatus.COMPLETED, res1.getStatus());
        assertNotNull(res1.getCompletedAt());

        // Toggle back
        TaskResponse res2 = taskService.completeTask("t1", userA);
        assertEquals(TaskStatus.PENDING, res2.getStatus());
        assertNull(res2.getCompletedAt());
    }
}
