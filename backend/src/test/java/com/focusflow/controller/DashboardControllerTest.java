package com.focusflow.controller;

import com.focusflow.config.JwtAuthenticationFilter;
import com.focusflow.config.SecurityConfig;
import com.focusflow.dto.DashboardResponse;
import com.focusflow.exception.GlobalExceptionHandler;
import com.focusflow.model.User;
import com.focusflow.repository.UserRepository;
import com.focusflow.service.DashboardService;
import com.focusflow.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = DashboardController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class})
public class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private String validToken;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtService, "secretKey", "testSecretKeyForAcademicProjectVivaDemo20261234567890");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L);

        User authenticatedUser = new User("Alice", "alice@example.com", "hash");
        authenticatedUser.setId("userA_id");

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(authenticatedUser));
        validToken = jwtService.generateToken("userA_id", "alice@example.com", "Alice");
    }

    @Test
    @DisplayName("GET /api/dashboard rejects unauthenticated requests with 403")
    void testGetDashboardUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/dashboard returns 200 OK with statistics for authenticated user")
    void testGetDashboardAuthenticated() throws Exception {
        DashboardResponse mockResponse = new DashboardResponse(
                3600L, 5L, 3L, 2L, 60.0, 65,
                Collections.emptyList(), Collections.emptyList(), Collections.emptyList()
        );

        when(dashboardService.getDashboardData(any(User.class))).thenReturn(mockResponse);

        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.todayFocusSeconds").value(3600))
                .andExpect(jsonPath("$.totalTasks").value(5))
                .andExpect(jsonPath("$.completedTasks").value(3))
                .andExpect(jsonPath("$.pendingTasks").value(2))
                .andExpect(jsonPath("$.productivityScore").value(65));
    }
}
