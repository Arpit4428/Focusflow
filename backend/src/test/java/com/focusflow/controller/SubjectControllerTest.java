package com.focusflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.focusflow.config.JwtAuthenticationFilter;
import com.focusflow.config.SecurityConfig;
import com.focusflow.dto.SubjectRequest;
import com.focusflow.dto.SubjectResponse;
import com.focusflow.exception.GlobalExceptionHandler;
import com.focusflow.model.User;
import com.focusflow.repository.UserRepository;
import com.focusflow.service.JwtService;
import com.focusflow.service.SubjectService;
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
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = SubjectController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class})
public class SubjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SubjectService subjectService;

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
    @DisplayName("GET /api/subjects rejects unauthenticated requests with 403")
    void testGetSubjectsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/subjects"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/subjects returns 200 OK with authenticated user's subjects")
    void testGetSubjectsAuthenticated() throws Exception {
        SubjectResponse s1 = new SubjectResponse("s1", "userA_id", "Computer Networks", "#DDEBDF",
                "Protocols & Architecture", Instant.now(), Instant.now());

        when(subjectService.getSubjects(any(User.class))).thenReturn(List.of(s1));

        mockMvc.perform(get("/api/subjects")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("s1"))
                .andExpect(jsonPath("$[0].name").value("Computer Networks"));
    }

    @Test
    @DisplayName("POST /api/subjects creates subject with valid payload")
    void testCreateSubjectSuccess() throws Exception {
        SubjectRequest req = new SubjectRequest("Operating Systems", "#E7FF63", "Processes & Memory");
        SubjectResponse res = new SubjectResponse("s2", "userA_id", "Operating Systems", "#E7FF63",
                "Processes & Memory", Instant.now(), Instant.now());

        when(subjectService.createSubject(any(SubjectRequest.class), any(User.class))).thenReturn(res);

        mockMvc.perform(post("/api/subjects")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("s2"))
                .andExpect(jsonPath("$.name").value("Operating Systems"));
    }

    @Test
    @DisplayName("POST /api/subjects returns 400 Bad Request on invalid payload")
    void testCreateSubjectValidationError() throws Exception {
        SubjectRequest req = new SubjectRequest("", "#E7FF63", null); // blank name

        mockMvc.perform(post("/api/subjects")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/subjects/{id} returns 200 OK")
    void testGetSubjectById() throws Exception {
        SubjectResponse res = new SubjectResponse("s1", "userA_id", "Math", "#DDEBDF", null, Instant.now(), Instant.now());

        when(subjectService.getSubjectById(eq("s1"), any(User.class))).thenReturn(res);

        mockMvc.perform(get("/api/subjects/s1")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("s1"))
                .andExpect(jsonPath("$.name").value("Math"));
    }

    @Test
    @DisplayName("PUT /api/subjects/{id} updates subject and returns 200 OK")
    void testUpdateSubject() throws Exception {
        SubjectRequest req = new SubjectRequest("Advanced Math", "#C9DCCB", "Updated syllabus");
        SubjectResponse res = new SubjectResponse("s1", "userA_id", "Advanced Math", "#C9DCCB",
                "Updated syllabus", Instant.now(), Instant.now());

        when(subjectService.updateSubject(eq("s1"), any(SubjectRequest.class), any(User.class))).thenReturn(res);

        mockMvc.perform(put("/api/subjects/s1")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Advanced Math"));
    }

    @Test
    @DisplayName("DELETE /api/subjects/{id} deletes subject and returns 204 No Content")
    void testDeleteSubject() throws Exception {
        doNothing().when(subjectService).deleteSubject(eq("s1"), any(User.class));

        mockMvc.perform(delete("/api/subjects/s1")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isNoContent());
    }
}
