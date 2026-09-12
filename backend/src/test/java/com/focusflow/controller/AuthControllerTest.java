package com.focusflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.focusflow.config.JwtAuthenticationFilter;
import com.focusflow.config.SecurityConfig;
import com.focusflow.dto.AuthResponse;
import com.focusflow.dto.LoginRequest;
import com.focusflow.dto.RegisterRequest;
import com.focusflow.dto.UserDto;
import com.focusflow.exception.BadRequestException;
import com.focusflow.exception.GlobalExceptionHandler;
import com.focusflow.model.User;
import com.focusflow.repository.UserRepository;
import com.focusflow.service.AuthService;
import com.focusflow.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class})
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtService, "secretKey", "testSecretKeyForAcademicProjectVivaDemo20261234567890");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L);
    }

    @Test
    @DisplayName("Public endpoint: POST /api/auth/register creates user")
    void testRegisterEndpoint() throws Exception {
        RegisterRequest request = new RegisterRequest("David", "david@example.com", "password123");
        AuthResponse response = new AuthResponse("mock.jwt.token", "user1", "David", "david@example.com");

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.id").value("user1"))
                .andExpect(jsonPath("$.email").value("david@example.com"));
    }

    @Test
    @DisplayName("Registration validation failure returns 400 Bad Request")
    void testRegisterValidationFailure() throws Exception {
        // Password too short (< 6 chars)
        RegisterRequest request = new RegisterRequest("David", "david@example.com", "123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.password").exists());
    }

    @Test
    @DisplayName("Duplicate email registration returns 400 Bad Request")
    void testRegisterDuplicateEmail() throws Exception {
        RegisterRequest request = new RegisterRequest("David", "david@example.com", "password123");
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new BadRequestException("Email is already registered"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is already registered"));
    }

    @Test
    @DisplayName("Public endpoint: POST /api/auth/login returns token")
    void testLoginEndpoint() throws Exception {
        LoginRequest request = new LoginRequest("david@example.com", "password123");
        AuthResponse response = new AuthResponse("mock.jwt.token", "user1", "David", "david@example.com");

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.email").value("david@example.com"));
    }

    @Test
    @DisplayName("Login with invalid credentials returns 401 Unauthorized")
    void testLoginInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest("david@example.com", "wrongPass");
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("Protected endpoint: GET /api/auth/me rejects unauthenticated request")
    void testProtectedMeEndpointWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Protected endpoint: GET /api/auth/me allows request with valid JWT Bearer token")
    void testProtectedMeEndpointWithValidToken() throws Exception {
        User user = new User("David", "david@example.com", "hashedPass");
        user.setId("user1");

        when(userRepository.findByEmail("david@example.com")).thenReturn(Optional.of(user));
        when(authService.getCurrentUser(any(User.class)))
                .thenReturn(new UserDto("user1", "David", "david@example.com", Instant.now()));

        String token = jwtService.generateToken("user1", "david@example.com", "David");

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user1"))
                .andExpect(jsonPath("$.email").value("david@example.com"));
    }
}
