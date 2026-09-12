package com.focusflow.service;

import com.focusflow.dto.FocusSessionRequest;
import com.focusflow.dto.FocusSessionResponse;
import com.focusflow.exception.ResourceNotFoundException;
import com.focusflow.model.FocusSession;
import com.focusflow.model.Subject;
import com.focusflow.model.User;
import com.focusflow.repository.FocusSessionRepository;
import com.focusflow.repository.SubjectRepository;
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

    @Mock
    private SubjectRepository subjectRepository;

    private FocusSessionService focusSessionService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        focusSessionService = new FocusSessionService(focusSessionRepository, subjectRepository);

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

        verify(focusSessionRepository, times(1)).save(any(FocusSession.class));
    }

    @Test
    @DisplayName("Create focus session with subjectId resolves Subject.name and assigns subjectId")
    void testCreateSessionWithSubjectId() {
        Instant start = Instant.now().minus(30, ChronoUnit.MINUTES);
        Instant end = Instant.now();
        Subject subject = new Subject("userA_id", "Operating Systems", "#E7FF63", null);
        subject.setId("sub_os");

        when(subjectRepository.findByIdAndUserId("sub_os", "userA_id")).thenReturn(Optional.of(subject));
        when(focusSessionRepository.save(any(FocusSession.class))).thenAnswer(inv -> {
            FocusSession s = inv.getArgument(0);
            s.setId("sess_os");
            return s;
        });

        FocusSessionRequest request = new FocusSessionRequest("sub_os", null, 1800L, start, end, true);
        FocusSessionResponse response = focusSessionService.createSession(request, userA);

        assertNotNull(response);
        assertEquals("sub_os", response.getSubjectId());
        assertEquals("Operating Systems", response.getSubject());
        verify(subjectRepository).findByIdAndUserId("sub_os", "userA_id");
    }

    @Test
    @DisplayName("Create focus session with another user's subjectId throws ResourceNotFoundException")
    void testCreateSessionWithUnownedSubjectIdThrows() {
        Instant start = Instant.now().minus(30, ChronoUnit.MINUTES);
        Instant end = Instant.now();
        when(subjectRepository.findByIdAndUserId("sub_other", "userA_id")).thenReturn(Optional.empty());

        FocusSessionRequest request = new FocusSessionRequest("sub_other", null, 1800L, start, end, true);

        assertThrows(ResourceNotFoundException.class, () ->
                focusSessionService.createSession(request, userA)
        );

        verify(focusSessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Get focus sessions returns only authenticated user's sessions")
    void testGetSessions() {
        FocusSession s1 = new FocusSession("userA_id", "Math", 1500L, Instant.now(), Instant.now(), true);
        FocusSession s2 = new FocusSession("userA_id", "Physics", 2000L, Instant.now(), Instant.now(), true);

        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id")).thenReturn(List.of(s1, s2));

        List<FocusSessionResponse> result = focusSessionService.getSessions(userA, null);

        assertEquals(2, result.size());
        verify(focusSessionRepository).findByUserIdOrderByStartedAtDesc("userA_id");
    }

    @Test
    @DisplayName("Filter sessions by subject delegates to repository method")
    void testGetSessionsFilteredBySubject() {
        FocusSession s1 = new FocusSession("userA_id", "Math", 1500L, Instant.now(), Instant.now(), true);

        when(focusSessionRepository.findByUserIdAndSubjectOrderByStartedAtDesc("userA_id", "Math"))
                .thenReturn(List.of(s1));

        List<FocusSessionResponse> result = focusSessionService.getSessions(userA, "Math");

        assertEquals(1, result.size());
        assertEquals("Math", result.get(0).getSubject());
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
