package com.focusflow.service;

import com.focusflow.dto.DashboardResponse;
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
import org.springframework.core.task.SyncTaskExecutor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DashboardServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private FocusSessionRepository focusSessionRepository;

    private DashboardService dashboardService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        // SyncTaskExecutor runs CompletableFuture synchronously in unit test thread
        dashboardService = new DashboardService(taskRepository, focusSessionRepository, new SyncTaskExecutor());

        userA = new User("Alice", "alice@example.com", "hash");
        userA.setId("userA_id");

        userB = new User("Bob", "bob@example.com", "hashB");
        userB.setId("userB_id");
    }

    @Test
    @DisplayName("Empty data case: returns 0s and empty lists without null pointer exceptions")
    void testEmptyDataCase() {
        when(taskRepository.countByUserId("userA_id")).thenReturn(0L);
        when(taskRepository.countByUserIdAndStatus("userA_id", TaskStatus.COMPLETED)).thenReturn(0L);
        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(Collections.emptyList());
        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id")).thenReturn(Collections.emptyList());

        DashboardResponse response = dashboardService.getDashboardData(userA);

        assertNotNull(response);
        assertEquals(0, response.getTodayFocusSeconds());
        assertEquals(0, response.getTotalTasks());
        assertEquals(0, response.getCompletedTasks());
        assertEquals(0, response.getPendingTasks());
        assertEquals(0.0, response.getTaskCompletionRate());
        assertEquals(0, response.getProductivityScore());
        assertEquals(7, response.getWeeklyFocus().size()); // 7 days of zeroes
        assertTrue(response.getRecentTasks().isEmpty());
        assertTrue(response.getRecentSessions().isEmpty());
    }

    @Test
    @DisplayName("Calculates today's focus time, task completion, and weekly stats correctly")
    void testAggregatedStatistics() {
        // Setup Tasks for userA
        when(taskRepository.countByUserId("userA_id")).thenReturn(4L);
        when(taskRepository.countByUserIdAndStatus("userA_id", TaskStatus.COMPLETED)).thenReturn(2L);

        Task t1 = new Task("userA_id", "T1", "D1", "Math", Priority.HIGH, Instant.now());
        t1.setId("t1");
        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(List.of(t1));

        // Setup Focus Sessions for userA:
        // Session 1: Today, 3600 seconds (1 hour)
        FocusSession todaySession = new FocusSession("userA_id", "Math", 3600L, Instant.now(), Instant.now(), true);
        todaySession.setId("s1");

        // Session 2: 2 days ago, 1800 seconds (30 mins)
        FocusSession pastSession = new FocusSession("userA_id", "Physics", 1800L,
                Instant.now().minus(2, ChronoUnit.DAYS), Instant.now().minus(2, ChronoUnit.DAYS), true);
        pastSession.setId("s2");

        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id"))
                .thenReturn(List.of(todaySession, pastSession));

        DashboardResponse response = dashboardService.getDashboardData(userA);

        assertNotNull(response);
        assertEquals(3600L, response.getTodayFocusSeconds());
        assertEquals(4L, response.getTotalTasks());
        assertEquals(2L, response.getCompletedTasks());
        assertEquals(2L, response.getPendingTasks());
        assertEquals(50.0, response.getTaskCompletionRate());
        assertEquals(7, response.getWeeklyFocus().size());

        // 2 distinct active days out of 7, 50% task rate, 3600s/7200s (50% focus target)
        // Score = (0.5 * 40) + (2/7 * 30) + (0.5 * 30) = 20 + 8.57 + 15 = 44
        assertEquals(44, response.getProductivityScore());
    }

    @Test
    @DisplayName("Productivity score formula clamping and weighting")
    void testProductivityScoreFormula() {
        // 100% tasks completed, 7/7 active days, > 7200s focus -> 100
        int perfectScore = dashboardService.calculateProductivityScore(10, 10, 8000, 7);
        assertEquals(100, perfectScore);

        // 0 tasks, 0 sessions -> 0
        int zeroScore = dashboardService.calculateProductivityScore(0, 0, 0, 0);
        assertEquals(0, zeroScore);

        // Half completion (20), 0 consistency (0), 0 focus (0) -> 20
        int halfTaskScore = dashboardService.calculateProductivityScore(10, 5, 0, 0);
        assertEquals(20, halfTaskScore);
    }

    @Test
    @DisplayName("User A cannot see User B's dashboard data")
    void testUserIsolation() {
        when(taskRepository.countByUserId("userB_id")).thenReturn(0L);
        when(taskRepository.countByUserIdAndStatus("userB_id", TaskStatus.COMPLETED)).thenReturn(0L);
        when(taskRepository.findByUserIdOrderByDueDateAsc("userB_id")).thenReturn(Collections.emptyList());
        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userB_id")).thenReturn(Collections.emptyList());

        DashboardResponse response = dashboardService.getDashboardData(userB);

        assertEquals(0, response.getTotalTasks());
        assertEquals(0, response.getTodayFocusSeconds());
        verify(taskRepository).countByUserId("userB_id");
        verify(focusSessionRepository).findByUserIdOrderByStartedAtDesc("userB_id");
        verify(taskRepository, never()).countByUserId("userA_id");
    }
}
