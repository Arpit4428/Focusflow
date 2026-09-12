package com.focusflow.service;

import com.focusflow.dto.TaskRequest;
import com.focusflow.dto.TaskResponse;
import com.focusflow.exception.ResourceNotFoundException;
import com.focusflow.model.Priority;
import com.focusflow.model.Subject;
import com.focusflow.model.Task;
import com.focusflow.model.TaskStatus;
import com.focusflow.model.User;
import com.focusflow.repository.SubjectRepository;
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

    @Mock
    private SubjectRepository subjectRepository;

    private TaskService taskService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository, subjectRepository);

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
        assertEquals("Mathematics", response.getSubject());
        assertEquals(Priority.HIGH, response.getPriority());
        assertEquals(TaskStatus.PENDING, response.getStatus());

        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    @DisplayName("Create task with subjectId resolves Subject.name and assigns subjectId")
    void testCreateTaskWithSubjectId() {
        Instant dueDate = Instant.now().plus(2, ChronoUnit.DAYS);
        Subject subject = new Subject("userA_id", "Distributed Systems", "#E7FF63", null);
        subject.setId("sub_ds");

        when(subjectRepository.findByIdAndUserId("sub_ds", "userA_id")).thenReturn(Optional.of(subject));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId("task_ds");
            return t;
        });

        TaskRequest request = new TaskRequest("Lab 1", "Raft consensus", "sub_ds", null, Priority.HIGH, dueDate);
        TaskResponse response = taskService.createTask(request, userA);

        assertNotNull(response);
        assertEquals("sub_ds", response.getSubjectId());
        assertEquals("Distributed Systems", response.getSubject());
        verify(subjectRepository).findByIdAndUserId("sub_ds", "userA_id");
    }

    @Test
    @DisplayName("Create task with another user's subjectId throws ResourceNotFoundException")
    void testCreateTaskWithUnownedSubjectIdThrows() {
        Instant dueDate = Instant.now().plus(2, ChronoUnit.DAYS);
        when(subjectRepository.findByIdAndUserId("sub_unowned", "userA_id")).thenReturn(Optional.empty());

        TaskRequest request = new TaskRequest("Lab 1", "Raft", "sub_unowned", null, Priority.HIGH, dueDate);

        assertThrows(ResourceNotFoundException.class, () ->
                taskService.createTask(request, userA)
        );

        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("Get tasks returns only tasks for current user")
    void testGetTasksForCurrentUser() {
        Task t1 = new Task("userA_id", "Task 1", null, "Math", Priority.LOW, Instant.now());
        Task t2 = new Task("userA_id", "Task 2", null, "Physics", Priority.MEDIUM, Instant.now());

        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(List.of(t1, t2));

        List<TaskResponse> result = taskService.getTasks(userA, null, null);

        assertEquals(2, result.size());
        verify(taskRepository).findByUserIdOrderByDueDateAsc("userA_id");
    }

    @Test
    @DisplayName("Security Isolation: User A cannot retrieve User B's task by ID")
    void testUserACannotGetTaskOfUserB() {
        when(taskRepository.findByIdAndUserId("task_of_b", "userA_id")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                taskService.getTaskById("task_of_b", userA));
    }

    @Test
    @DisplayName("Security Isolation: User B cannot update User A's task")
    void testUserBCannotUpdateUserATask() {
        when(taskRepository.findByIdAndUserId("task1", "userB_id")).thenReturn(Optional.empty());

        TaskRequest updateReq = new TaskRequest("Hacked Title", "Hacked", "Math", Priority.LOW, Instant.now());

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
