package com.focusflow.service;

import com.focusflow.dto.InsightsResponse;
import com.focusflow.model.FocusSession;
import com.focusflow.model.Priority;
import com.focusflow.model.Task;
import com.focusflow.model.TaskStatus;
import com.focusflow.model.User;
import com.focusflow.repository.FocusSessionRepository;
import com.focusflow.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InsightsServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private FocusSessionRepository focusSessionRepository;

    private InsightsService insightsService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        insightsService = new InsightsService(taskRepository, focusSessionRepository);

        userA = new User("Alice", "alice@example.com", "hash");
        userA.setId("userA_id");

        userB = new User("Bob", "bob@example.com", "hashB");
        userB.setId("userB_id");
    }

    @Test
    @DisplayName("Empty data case: avoids divide-by-zero and returns welcoming recommendation")
    void testEmptyDataCase() {
        when(taskRepository.countByUserId("userA_id")).thenReturn(0L);
        when(taskRepository.countByUserIdAndStatus("userA_id", TaskStatus.COMPLETED)).thenReturn(0L);
        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(Collections.emptyList());
        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id")).thenReturn(Collections.emptyList());

        InsightsResponse response = insightsService.getInsights(userA);

        assertNotNull(response);
        assertEquals(0, response.getTotalFocusSeconds());
        assertEquals(0, response.getAverageSessionDurationSeconds());
        assertEquals(0, response.getTotalSessions());
        assertEquals("None", response.getMostFocusedSubject());
        assertEquals(0, response.getTotalTasks());
        assertEquals(0.0, response.getTaskCompletionRate());
        assertEquals("None", response.getMostProductiveDayOfWeek());
        assertEquals(0, response.getActiveDaysLast7Days());
        assertTrue(response.getSubjectBreakdown().isEmpty());
        assertFalse(response.getRecommendations().isEmpty());
        assertEquals("INFO", response.getRecommendations().get(0).getType());
    }

    @Test
    @DisplayName("Calculates overall focus stats, average session duration, and most focused subject")
    void testOverallFocusStatistics() {
        when(taskRepository.countByUserId("userA_id")).thenReturn(4L);
        when(taskRepository.countByUserIdAndStatus("userA_id", TaskStatus.COMPLETED)).thenReturn(3L);
        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(Collections.emptyList());

        // Session 1: 3600s in Math
        FocusSession s1 = new FocusSession("userA_id", "Mathematics", 3600L, Instant.now(), Instant.now(), true);
        // Session 2: 1800s in Math
        FocusSession s2 = new FocusSession("userA_id", "Mathematics", 1800L, Instant.now(), Instant.now(), true);
        // Session 3: 1200s in Physics
        FocusSession s3 = new FocusSession("userA_id", "Physics", 1200L, Instant.now(), Instant.now(), true);

        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id"))
                .thenReturn(List.of(s1, s2, s3));

        InsightsResponse response = insightsService.getInsights(userA);

        assertNotNull(response);
        // Total = 3600 + 1800 + 1200 = 6600 seconds
        assertEquals(6600L, response.getTotalFocusSeconds());
        // Average = 6600 / 3 = 2200 seconds
        assertEquals(2200L, response.getAverageSessionDurationSeconds());
        assertEquals(3L, response.getTotalSessions());
        assertEquals("Mathematics", response.getMostFocusedSubject());
        assertEquals(2, response.getSubjectBreakdown().size());
        assertEquals("Mathematics", response.getSubjectBreakdown().get(0).getSubject());
        assertEquals(75.0, response.getTaskCompletionRate());
    }

    @Test
    @DisplayName("Generates relevant rule-based recommendations based on metrics")
    void testRuleBasedRecommendations() {
        when(taskRepository.countByUserId("userA_id")).thenReturn(5L);
        when(taskRepository.countByUserIdAndStatus("userA_id", TaskStatus.COMPLETED)).thenReturn(1L);

        // High priority pending task
        Task urgentTask = new Task("userA_id", "Urgent Assignment", "Desc", "Math", Priority.HIGH, Instant.now());
        urgentTask.setStatus(TaskStatus.PENDING);
        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(List.of(urgentTask));

        // 1 short session
        FocusSession s1 = new FocusSession("userA_id", "Math", 1200L, Instant.now(), Instant.now(), true);
        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id")).thenReturn(List.of(s1));

        InsightsResponse response = insightsService.getInsights(userA);

        List<InsightsResponse.Recommendation> recs = response.getRecommendations();
        assertFalse(recs.isEmpty());

        // Check that urgent task recommendation is triggered
        boolean hasUrgentRec = recs.stream().anyMatch(r -> r.getTitle().contains("Urgent"));
        assertTrue(hasUrgentRec);
    }

    @Test
    @DisplayName("User A cannot see User B's insights data")
    void testUserIsolation() {
        when(taskRepository.countByUserId("userB_id")).thenReturn(0L);
        when(taskRepository.countByUserIdAndStatus("userB_id", TaskStatus.COMPLETED)).thenReturn(0L);
        when(taskRepository.findByUserIdOrderByDueDateAsc("userB_id")).thenReturn(Collections.emptyList());
        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userB_id")).thenReturn(Collections.emptyList());

        InsightsResponse response = insightsService.getInsights(userB);

        assertEquals(0, response.getTotalTasks());
        assertEquals(0, response.getTotalFocusSeconds());
        verify(taskRepository).countByUserId("userB_id");
        verify(focusSessionRepository).findByUserIdOrderByStartedAtDesc("userB_id");
        verify(taskRepository, never()).countByUserId("userA_id");
    }
}
