package com.focusflow.service;

import com.focusflow.dto.DashboardResponse;
import com.focusflow.model.FocusSession;
import com.focusflow.model.Priority;
import com.focusflow.model.Subject;
import com.focusflow.model.Task;
import com.focusflow.model.TaskStatus;
import com.focusflow.model.User;
import com.focusflow.repository.FocusSessionRepository;
import com.focusflow.repository.SubjectRepository;
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

    @Mock
    private SubjectRepository subjectRepository;

    private DashboardService dashboardService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        // SyncTaskExecutor runs CompletableFuture synchronously in unit test thread
        dashboardService = new DashboardService(taskRepository, focusSessionRepository, subjectRepository, new SyncTaskExecutor());

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
        when(subjectRepository.findByUserIdOrderByNameAsc("userA_id")).thenReturn(Collections.emptyList());

        DashboardResponse response = dashboardService.getDashboardData(userA);

        assertNotNull(response);
        assertEquals(0, response.getTodayFocusSeconds());
        assertEquals(0, response.getTotalTasks());
        assertEquals(0, response.getCompletedTasks());
        assertEquals(0, response.getPendingTasks());
        assertEquals(0.0, response.getTaskCompletionRate());
        assertEquals(0, response.getProductivityScore());
        assertEquals(7, response.getWeeklyFocus().size()); // 7 days of 0s
        assertEquals(120, response.getDailyFocusGoalMinutes());
        assertTrue(response.getRecentTasks().isEmpty());
        assertTrue(response.getRecentSessions().isEmpty());
        assertTrue(response.getSubjectAnalytics().isEmpty());
    }

    @Test
    @DisplayName("Aggregated metrics, weekly rhythm, and subject analytics calculation")
    void testAggregatedMetricsAndSubjectAnalytics() {
        when(taskRepository.countByUserId("userA_id")).thenReturn(4L);
        when(taskRepository.countByUserIdAndStatus("userA_id", TaskStatus.COMPLETED)).thenReturn(2L);

        Instant now = Instant.now();
        Instant yesterday = now.minus(1, ChronoUnit.DAYS);

        Subject sub1 = new Subject("userA_id", "Data Structures", "#E7FF63", null);
        sub1.setId("sub_ds");
        when(subjectRepository.findByUserIdOrderByNameAsc("userA_id")).thenReturn(List.of(sub1));

        Task t1 = new Task("userA_id", "T1", "desc", "Data Structures", Priority.HIGH, now);
        t1.setId("t1");
        t1.setSubjectId("sub_ds");
        t1.setStatus(TaskStatus.COMPLETED);

        Task t2 = new Task("userA_id", "T2", "desc", "Data Structures", Priority.MEDIUM, now);
        t2.setId("t2");
        t2.setSubjectId("sub_ds");
        t2.setStatus(TaskStatus.PENDING);

        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(List.of(t1, t2));

        // 3600s today, 1800s yesterday
        FocusSession s1 = new FocusSession("userA_id", "sub_ds", "Data Structures", 3600L, now, now.plusSeconds(3600), true);
        s1.setId("s1");
        FocusSession s2 = new FocusSession("userA_id", "sub_ds", "Data Structures", 1800L, yesterday, yesterday.plusSeconds(1800), true);
        s2.setId("s2");

        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id")).thenReturn(List.of(s1, s2));

        DashboardResponse response = dashboardService.getDashboardData(userA);

        assertNotNull(response);
        assertEquals(3600L, response.getTodayFocusSeconds());
        assertEquals(4L, response.getTotalTasks());
        assertEquals(2L, response.getCompletedTasks());
        assertEquals(2L, response.getPendingTasks());
        assertEquals(50.0, response.getTaskCompletionRate());
        assertEquals(7, response.getWeeklyFocus().size());

        // Subject Analytics verification
        assertNotNull(response.getSubjectAnalytics());
        assertEquals(1, response.getSubjectAnalytics().size());
        DashboardResponse.SubjectStat stat = response.getSubjectAnalytics().get(0);
        assertEquals("sub_ds", stat.getSubjectId());
        assertEquals("Data Structures", stat.getSubjectName());
        assertEquals("#E7FF63", stat.getColor());
        assertEquals(5400L, stat.getFocusSeconds());
        assertEquals(90, stat.getFocusMinutes());
        assertEquals(100.0, stat.getFocusPercentage());
        assertEquals(2L, stat.getTotalTasks());
        assertEquals(1L, stat.getCompletedTasks());
        assertEquals(1L, stat.getPendingTasks());
    }

    @Test
    @DisplayName("Productivity score formula clamping and weighting")
    void testProductivityScoreFormula() {
        int perfectScore = dashboardService.calculateProductivityScore(10, 10, 8000, 7);
        assertEquals(100, perfectScore);

        int zeroScore = dashboardService.calculateProductivityScore(0, 0, 0, 0);
        assertEquals(0, zeroScore);

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
        when(subjectRepository.findByUserIdOrderByNameAsc("userB_id")).thenReturn(Collections.emptyList());

        DashboardResponse response = dashboardService.getDashboardData(userB);

        assertEquals(0, response.getTotalTasks());
        assertEquals(0, response.getTodayFocusSeconds());
        verify(taskRepository).countByUserId("userB_id");
        verify(focusSessionRepository).findByUserIdOrderByStartedAtDesc("userB_id");
        verify(taskRepository, never()).countByUserId("userA_id");
    }

    @Test
    @DisplayName("User with custom daily focus goal (e.g. 240 mins) returns that goal in DashboardResponse")
    void testCustomDailyFocusGoal() {
        userA.setDailyFocusGoalMinutes(240);

        when(taskRepository.countByUserId("userA_id")).thenReturn(0L);
        when(taskRepository.countByUserIdAndStatus("userA_id", TaskStatus.COMPLETED)).thenReturn(0L);
        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(Collections.emptyList());
        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id")).thenReturn(Collections.emptyList());
        when(subjectRepository.findByUserIdOrderByNameAsc("userA_id")).thenReturn(Collections.emptyList());

        DashboardResponse response = dashboardService.getDashboardData(userA);

        assertEquals(240, response.getDailyFocusGoalMinutes());
    }
}
