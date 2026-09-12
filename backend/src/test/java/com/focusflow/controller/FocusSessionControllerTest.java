package com.focusflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.focusflow.config.JwtAuthenticationFilter;
import com.focusflow.config.SecurityConfig;
import com.focusflow.dto.FocusSessionRequest;
import com.focusflow.dto.FocusSessionResponse;
import com.focusflow.exception.GlobalExceptionHandler;
import com.focusflow.model.User;
import com.focusflow.repository.UserRepository;
import com.focusflow.service.FocusSessionService;
import com.focusflow.service.JwtService;
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

@WebMvcTest(controllers = FocusSessionController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class})
public class FocusSessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FocusSessionService focusSessionService;

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
    @DisplayName("GET /api/focus-sessions rejects unauthenticated requests with 403")
    void testGetSessionsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/focus-sessions"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/focus-sessions returns 200 OK with authenticated user's sessions")
    void testGetSessionsAuthenticated() throws Exception {
        FocusSessionResponse s1 = new FocusSessionResponse("s1", "userA_id", "Math", 1500L,
                Instant.now(), Instant.now(), true);

        when(focusSessionService.getSessions(any(User.class), eq(null))).thenReturn(List.of(s1));

        mockMvc.perform(get("/api/focus-sessions")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("s1"))
                .andExpect(jsonPath("$[0].subject").value("Math"))
                .andExpect(jsonPath("$[0].duration").value(1500));
    }

    @Test
    @DisplayName("POST /api/focus-sessions creates focus session with valid payload")
    void testCreateSessionSuccess() throws Exception {
        FocusSessionRequest req = new FocusSessionRequest("Physics", 1200L, Instant.now(), Instant.now(), true);
        FocusSessionResponse res = new FocusSessionResponse("s2", "userA_id", "Physics", 1200L,
                req.getStartedAt(), req.getEndedAt(), true);

        when(focusSessionService.createSession(any(FocusSessionRequest.class), any(User.class))).thenReturn(res);

        mockMvc.perform(post("/api/focus-sessions")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("s2"))
                .andExpect(jsonPath("$.subject").value("Physics"))
                .andExpect(jsonPath("$.duration").value(1200));
    }

    @Test
    @DisplayName("POST /api/focus-sessions with blank subject returns 400 Bad Request")
    void testCreateSessionValidationFailureBlankSubject() throws Exception {
        FocusSessionRequest req = new FocusSessionRequest("", 1200L, Instant.now(), Instant.now(), true);

        mockMvc.perform(post("/api/focus-sessions")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.subject").exists());
    }

    @Test
    @DisplayName("POST /api/focus-sessions with zero duration returns 400 Bad Request")
    void testCreateSessionValidationFailureZeroDuration() throws Exception {
        FocusSessionRequest req = new FocusSessionRequest("Chemistry", 0L, Instant.now(), Instant.now(), true);

        mockMvc.perform(post("/api/focus-sessions")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.duration").exists());
    }

    @Test
    @DisplayName("DELETE /api/focus-sessions/{id} returns 204 No Content")
    void testDeleteSession() throws Exception {
        mockMvc.perform(delete("/api/focus-sessions/s1")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isNoContent());
    }
}
