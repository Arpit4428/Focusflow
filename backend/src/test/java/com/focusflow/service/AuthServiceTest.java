package com.focusflow.service;

import com.focusflow.dto.AuthResponse;
import com.focusflow.dto.LoginRequest;
import com.focusflow.dto.RegisterRequest;
import com.focusflow.dto.UserDto;
import com.focusflow.exception.BadRequestException;
import com.focusflow.model.User;
import com.focusflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", "testSecretKeyForAcademicProjectVivaDemo20261234567890");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 86400000L);

        authService = new AuthService(userRepository, passwordEncoder, jwtService);
    }

    @Test
    @DisplayName("Registration successfully creates user with BCrypt hashed password")
    void testRegisterSuccess() {
        RegisterRequest request = new RegisterRequest("Alice", "alice@example.com", "password123");

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User userToSave = invocation.getArgument(0);
            userToSave.setId("user123");
            return userToSave;
        });

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("user123", response.getId());
        assertEquals("Alice", response.getName());
        assertEquals("alice@example.com", response.getEmail());
        assertNotNull(response.getToken());

        verify(userRepository).save(argThat(user -> {
            // Confirm password is NOT stored as plaintext
            assertNotEquals("password123", user.getPassword());
            // Confirm password is validly hashed by BCrypt
            assertTrue(passwordEncoder.matches("password123", user.getPassword()));
            return true;
        }));
    }

    @Test
    @DisplayName("Registration rejects duplicate email with BadRequestException")
    void testRegisterDuplicateEmail() {
        RegisterRequest request = new RegisterRequest("Alice", "alice@example.com", "password123");
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(request));
        assertEquals("Email is already registered", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Login with valid credentials returns JWT token")
    void testLoginSuccess() {
        String hashedPassword = passwordEncoder.encode("secretPass");
        User mockUser = new User("Bob", "bob@example.com", hashedPassword);
        mockUser.setId("user456");

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(mockUser));

        LoginRequest request = new LoginRequest("bob@example.com", "secretPass");
        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("user456", response.getId());
        assertEquals("Bob", response.getName());
        assertNotNull(response.getToken());

        // Verify token can be parsed and is valid
        assertTrue(jwtService.isTokenValid(response.getToken(), "bob@example.com"));
    }

    @Test
    @DisplayName("Login with invalid password throws BadCredentialsException")
    void testLoginInvalidPassword() {
        String hashedPassword = passwordEncoder.encode("correctPass");
        User mockUser = new User("Bob", "bob@example.com", hashedPassword);

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(mockUser));

        LoginRequest request = new LoginRequest("bob@example.com", "wrongPass");
        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Login with non-existent email throws BadCredentialsException")
    void testLoginUserNotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("unknown@example.com", "pass");
        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Get current user returns safe UserDto")
    void testGetCurrentUser() {
        User user = new User("Charlie", "charlie@example.com", "hashed");
        user.setId("user789");

        UserDto dto = authService.getCurrentUser(user);
        assertEquals("user789", dto.getId());
        assertEquals("Charlie", dto.getName());
        assertEquals("charlie@example.com", dto.getEmail());
    }
}
