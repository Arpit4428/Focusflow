package com.focusflow.service;

import com.focusflow.dto.UserPreferencesRequest;
import com.focusflow.dto.UserPreferencesResponse;
import com.focusflow.model.User;
import com.focusflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("Alice", "alice@example.com", "hashedPassword");
        testUser.setId("user123");
        testUser.setDailyFocusGoalMinutes(120);
    }

    @Test
    @DisplayName("Default daily focus goal should be 120 minutes")
    void defaultDailyFocusGoalShouldBe120Minutes() {
        User newUser = new User("Bob", "bob@example.com", "pass");
        assertEquals(120, newUser.getDailyFocusGoalMinutes());

        newUser.setDailyFocusGoalMinutes(null);
        assertEquals(120, newUser.getDailyFocusGoalMinutes());
    }

    @Test
    @DisplayName("Authenticated user can update their own daily focus goal")
    void authenticatedUserCanUpdateGoal() {
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserPreferencesRequest request = new UserPreferencesRequest(180);
        UserPreferencesResponse response = userService.updatePreferences(testUser, request);

        assertNotNull(response);
        assertEquals(180, response.getDailyFocusGoalMinutes());
        assertEquals(180, testUser.getDailyFocusGoalMinutes());
        verify(userRepository, times(1)).save(testUser);
    }

    @Test
    @DisplayName("Get preferences returns user's current goal")
    void getPreferencesReturnsCurrentGoal() {
        when(userRepository.findById("user123")).thenReturn(Optional.of(testUser));

        UserPreferencesResponse response = userService.getPreferences(testUser);

        assertNotNull(response);
        assertEquals(120, response.getDailyFocusGoalMinutes());
    }

    @Test
    @DisplayName("Updating preferences throws exception if user not found")
    void updatePreferencesThrowsIfUserNotFound() {
        when(userRepository.findById("user123")).thenReturn(Optional.empty());

        UserPreferencesRequest request = new UserPreferencesRequest(180);
        assertThrows(IllegalArgumentException.class, () -> userService.updatePreferences(testUser, request));
    }
}
