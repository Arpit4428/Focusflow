package com.focusflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.focusflow.config.JwtAuthenticationFilter;
import com.focusflow.config.SecurityConfig;
import com.focusflow.dto.TaskRequest;
import com.focusflow.dto.TaskResponse;
import com.focusflow.exception.GlobalExceptionHandler;
import com.focusflow.model.Priority;
import com.focusflow.model.TaskStatus;
import com.focusflow.model.User;
import com.focusflow.repository.UserRepository;
import com.focusflow.service.JwtService;
import com.focusflow.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = TaskController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class})
public class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TaskService taskService;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private String validToken;
    private User authenticatedUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtService, "secretKey", "testSecretKeyForAcademicProjectVivaDemo20261234567890");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L);

        authenticatedUser = new User("Alice", "alice@example.com", "hash");
        authenticatedUser.setId("userA_id");

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(authenticatedUser));
        validToken = jwtService.generateToken("userA_id", "alice@example.com", "Alice");
    }

    @Test
    @DisplayName("GET /api/tasks rejects unauthenticated requests with 403")
    void testGetTasksUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/tasks returns 200 OK with authenticated user's tasks")
    void testGetTasksAuthenticated() throws Exception {
        TaskResponse t1 = new TaskResponse("t1", "userA_id", "Math Prep", "Notes",
                "Math", Priority.HIGH, TaskStatus.PENDING, Instant.now(), Instant.now(), null);

        when(taskService.getTasks(any(User.class), eq(null), eq(null))).thenReturn(List.of(t1));

        mockMvc.perform(get("/api/tasks")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("t1"))
                .andExpect(jsonPath("$[0].title").value("Math Prep"));
    }

    @Test
    @DisplayName("POST /api/tasks creates task with valid body")
    void testCreateTaskSuccess() throws Exception {
        TaskRequest req = new TaskRequest("Chemistry Lab", "Prepare report", "Chemistry", Priority.MEDIUM, Instant.now());
        TaskResponse res = new TaskResponse("t2", "userA_id", "Chemistry Lab", "Prepare report",
                "Chemistry", Priority.MEDIUM, TaskStatus.PENDING, req.getDueDate(), Instant.now(), null);

        when(taskService.createTask(any(TaskRequest.class), any(User.class))).thenReturn(res);

        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("t2"))
                .andExpect(jsonPath("$.title").value("Chemistry Lab"));
    }

    @Test
    @DisplayName("POST /api/tasks with blank title returns 400 Bad Request")
    void testCreateTaskValidationFailure() throws Exception {
        TaskRequest req = new TaskRequest("", "desc", "Math", Priority.LOW, Instant.now());

        mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.title").exists());
    }

    @Test
    @DisplayName("PATCH /api/tasks/{id}/complete toggles completion")
    void testCompleteTask() throws Exception {
        TaskResponse res = new TaskResponse("t1", "userA_id", "Math Prep", "Notes",
                "Math", Priority.HIGH, TaskStatus.COMPLETED, Instant.now(), Instant.now(), Instant.now());

        when(taskService.completeTask(eq("t1"), any(User.class))).thenReturn(res);

        mockMvc.perform(patch("/api/tasks/t1/complete")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("DELETE /api/tasks/{id} returns 204 No Content")
    void testDeleteTask() throws Exception {
        mockMvc.perform(delete("/api/tasks/t1")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isNoContent());
    }
}
