package com.focusflow.service;

import com.focusflow.dto.FocusSessionRequest;
import com.focusflow.dto.FocusSessionResponse;
import com.focusflow.exception.ResourceNotFoundException;
import com.focusflow.model.FocusSession;
import com.focusflow.model.User;
import com.focusflow.repository.FocusSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FocusSessionServiceTest {

    @Mock
    private FocusSessionRepository focusSessionRepository;

    private FocusSessionService focusSessionService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        focusSessionService = new FocusSessionService(focusSessionRepository);

        userA = new User("User A", "a@example.com", "hashA");
        userA.setId("userA_id");

        userB = new User("User B", "b@example.com", "hashB");
        userB.setId("userB_id");
    }

    @Test
    @DisplayName("Create focus session associates session exclusively with currentUser.id")
    void testCreateSession() {
        Instant start = Instant.now().minus(25, ChronoUnit.MINUTES);
        Instant end = Instant.now();
        FocusSessionRequest request = new FocusSessionRequest("Mathematics", 1500L, start, end, true);

        when(focusSessionRepository.save(any(FocusSession.class))).thenAnswer(inv -> {
            FocusSession s = inv.getArgument(0);
            s.setId("session1");
            return s;
        });

        FocusSessionResponse response = focusSessionService.createSession(request, userA);

        assertNotNull(response);
        assertEquals("session1", response.getId());
        assertEquals("userA_id", response.getUserId());
        assertEquals("Mathematics", response.getSubject());
        assertEquals(1500L, response.getDuration());
        assertTrue(response.isCompleted());

        verify(focusSessionRepository).save(argThat(s -> s.getUserId().equals("userA_id")));
    }

    @Test
    @DisplayName("Retrieve focus sessions only queries currentUser.id")
    void testGetSessions() {
        FocusSession s1 = new FocusSession("userA_id", "Physics", 1800L, Instant.now(), Instant.now(), true);
        s1.setId("s1");

        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id")).thenReturn(List.of(s1));

        List<FocusSessionResponse> results = focusSessionService.getSessions(userA, null);

        assertEquals(1, results.size());
        assertEquals("s1", results.get(0).getId());
        assertEquals("userA_id", results.get(0).getUserId());
        verify(focusSessionRepository).findByUserIdOrderByStartedAtDesc("userA_id");
    }

    @Test
    @DisplayName("Retrieve individual session by ID succeeds for owner")
    void testGetSessionByIdSuccess() {
        FocusSession s1 = new FocusSession("userA_id", "Physics", 1800L, Instant.now(), Instant.now(), true);
        s1.setId("s1");

        when(focusSessionRepository.findByIdAndUserId("s1", "userA_id")).thenReturn(Optional.of(s1));

        FocusSessionResponse result = focusSessionService.getSessionById("s1", userA);
        assertEquals("s1", result.getId());
        assertEquals("Physics", result.getSubject());
    }

    @Test
    @DisplayName("Delete focus session succeeds for owner")
    void testDeleteSessionSuccess() {
        FocusSession s1 = new FocusSession("userA_id", "Physics", 1800L, Instant.now(), Instant.now(), true);
        s1.setId("s1");

        when(focusSessionRepository.findByIdAndUserId("s1", "userA_id")).thenReturn(Optional.of(s1));

        focusSessionService.deleteSession("s1", userA);
        verify(focusSessionRepository).delete(s1);
    }

    @Test
    @DisplayName("Security Isolation: User B cannot access User A's session")
    void testUserBCannotAccessUserASession() {
        when(focusSessionRepository.findByIdAndUserId("s1", "userB_id")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                focusSessionService.getSessionById("s1", userB));
    }

    @Test
    @DisplayName("Security Isolation: User B cannot delete User A's session")
    void testUserBCannotDeleteUserASession() {
        when(focusSessionRepository.findByIdAndUserId("s1", "userB_id")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                focusSessionService.deleteSession("s1", userB));

        verify(focusSessionRepository, never()).delete(any());
    }
}
