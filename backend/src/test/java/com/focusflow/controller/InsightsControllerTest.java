package com.focusflow.controller;

import com.focusflow.config.JwtAuthenticationFilter;
import com.focusflow.config.SecurityConfig;
import com.focusflow.dto.InsightsResponse;
import com.focusflow.exception.GlobalExceptionHandler;
import com.focusflow.model.User;
import com.focusflow.repository.UserRepository;
import com.focusflow.service.InsightsService;
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

@WebMvcTest(controllers = InsightsController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class})
public class InsightsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InsightsService insightsService;

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
    @DisplayName("GET /api/insights rejects unauthenticated requests with 403")
    void testGetInsightsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/insights"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/insights returns 200 OK with analytics data for authenticated user")
    void testGetInsightsAuthenticated() throws Exception {
        InsightsResponse mockResponse = new InsightsResponse(
                7200L, 1800L, 4L, "Mathematics",
                6L, 4L, 2L, 66.7, "Wednesday",
                3, 5400L, Collections.emptyList(),
                Collections.emptyList(), Collections.emptyList()
        );

        when(insightsService.getInsights(any(User.class))).thenReturn(mockResponse);

        mockMvc.perform(get("/api/insights")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalFocusSeconds").value(7200))
                .andExpect(jsonPath("$.averageSessionDurationSeconds").value(1800))
                .andExpect(jsonPath("$.mostFocusedSubject").value("Mathematics"))
                .andExpect(jsonPath("$.mostProductiveDayOfWeek").value("Wednesday"))
                .andExpect(jsonPath("$.taskCompletionRate").value(66.7));
    }
}
