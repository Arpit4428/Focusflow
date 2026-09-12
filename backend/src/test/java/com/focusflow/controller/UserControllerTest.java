package com.focusflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.focusflow.config.JwtAuthenticationFilter;
import com.focusflow.config.SecurityConfig;
import com.focusflow.dto.UserPreferencesRequest;
import com.focusflow.dto.UserPreferencesResponse;
import com.focusflow.exception.GlobalExceptionHandler;
import com.focusflow.model.User;
import com.focusflow.repository.UserRepository;
import com.focusflow.service.JwtService;
import com.focusflow.service.UserService;
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

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = UserController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class})
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

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
        authenticatedUser.setDailyFocusGoalMinutes(120);

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(authenticatedUser));
        validToken = jwtService.generateToken("userA_id", "alice@example.com", "Alice");
    }

    @Test
    @DisplayName("PUT /api/users/me/preferences rejects unauthenticated requests with 403")
    void testUpdatePreferencesUnauthenticated() throws Exception {
        UserPreferencesRequest req = new UserPreferencesRequest(180);
        mockMvc.perform(put("/api/users/me/preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /api/users/me/preferences succeeds for valid goal (180 mins)")
    void testUpdatePreferencesValid() throws Exception {
        UserPreferencesRequest req = new UserPreferencesRequest(180);
        UserPreferencesResponse res = new UserPreferencesResponse(180);

        when(userService.updatePreferences(any(User.class), any(UserPreferencesRequest.class)))
                .thenReturn(res);

        mockMvc.perform(put("/api/users/me/preferences")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailyFocusGoalMinutes").value(180));
    }

    @Test
    @DisplayName("PUT /api/users/me/preferences rejects values below 15 with 400 Bad Request")
    void testUpdatePreferencesBelowMinimum() throws Exception {
        UserPreferencesRequest req = new UserPreferencesRequest(10);

        mockMvc.perform(put("/api/users/me/preferences")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/users/me/preferences rejects values above 720 with 400 Bad Request")
    void testUpdatePreferencesAboveMaximum() throws Exception {
        UserPreferencesRequest req = new UserPreferencesRequest(750);

        mockMvc.perform(put("/api/users/me/preferences")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/users/me/preferences rejects null goal with 400 Bad Request")
    void testUpdatePreferencesNull() throws Exception {
        UserPreferencesRequest req = new UserPreferencesRequest(null);

        mockMvc.perform(put("/api/users/me/preferences")
                        .header("Authorization", "Bearer " + validToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/users/me/preferences returns current user's goal")
    void testGetPreferences() throws Exception {
        when(userService.getPreferences(any(User.class)))
                .thenReturn(new UserPreferencesResponse(120));

        mockMvc.perform(get("/api/users/me/preferences")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dailyFocusGoalMinutes").value(120));
    }
}
