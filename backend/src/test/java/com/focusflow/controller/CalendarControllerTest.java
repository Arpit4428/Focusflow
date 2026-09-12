package com.focusflow.controller;

import com.focusflow.config.JwtAuthenticationFilter;
import com.focusflow.config.SecurityConfig;
import com.focusflow.dto.CalendarDayActivity;
import com.focusflow.dto.CalendarResponse;
import com.focusflow.exception.GlobalExceptionHandler;
import com.focusflow.model.User;
import com.focusflow.repository.UserRepository;
import com.focusflow.service.CalendarService;
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
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = CalendarController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class})
public class CalendarControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CalendarService calendarService;

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
    @DisplayName("GET /api/calendar rejects unauthenticated requests with 403")
    void testGetCalendarUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/calendar?year=2026&month=9"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/calendar returns 200 OK with authenticated user's activity")
    void testGetCalendarAuthenticated() throws Exception {
        CalendarDayActivity day1 = new CalendarDayActivity(
                "2026-09-12",
                3600L,
                60,
                3L,
                2L,
                1L,
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList()
        );

        CalendarResponse res = new CalendarResponse(2026, 9, List.of(day1));

        when(calendarService.getCalendarActivity(any(User.class), eq(2026), eq(9))).thenReturn(res);

        mockMvc.perform(get("/api/calendar?year=2026&month=9")
                        .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.year").value(2026))
                .andExpect(jsonPath("$.month").value(9))
                .andExpect(jsonPath("$.activities[0].date").value("2026-09-12"))
                .andExpect(jsonPath("$.activities[0].totalFocusMinutes").value(60));
    }
}
