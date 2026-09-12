package com.focusflow.service;

import com.focusflow.dto.DashboardResponse;
import com.focusflow.dto.FocusSessionResponse;
import com.focusflow.dto.TaskResponse;
import com.focusflow.model.FocusSession;
import com.focusflow.model.Task;
import com.focusflow.model.TaskStatus;
import com.focusflow.model.User;
import com.focusflow.repository.FocusSessionRepository;
import com.focusflow.repository.TaskRepository;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Dashboard Service.
 * Aggregates statistics from tasks and focus_sessions collections for the authenticated user.
 *
 * Demonstrates Unit 3 Multithreading:
 * Executes task metrics computation and focus session analysis concurrently using
 * CompletableFuture and Spring's configured ThreadPoolTaskExecutor (Scatter-Gather pattern).
 */
@Service
public class DashboardService {

    private final TaskRepository taskRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final TaskExecutor taskExecutor;

    public DashboardService(TaskRepository taskRepository,
                            FocusSessionRepository focusSessionRepository,
                            TaskExecutor taskExecutor) {
        this.taskRepository = taskRepository;
        this.focusSessionRepository = focusSessionRepository;
        this.taskExecutor = taskExecutor;
    }

    public DashboardResponse getDashboardData(User currentUser) {
        String userId = currentUser.getId();

        // 1. Asynchronous task: Retrieve and calculate Task metrics
        CompletableFuture<TaskMetrics> taskFuture = CompletableFuture.supplyAsync(() -> {
            long total = taskRepository.countByUserId(userId);
            long completed = taskRepository.countByUserIdAndStatus(userId, TaskStatus.COMPLETED);
            long pending = total - completed;
            double rate = total > 0 ? ((double) completed / total) * 100.0 : 0.0;

            List<Task> allTasks = taskRepository.findByUserIdOrderByDueDateAsc(userId);
            List<TaskResponse> recentTasks = allTasks.stream()
                    .limit(5)
                    .map(TaskResponse::fromEntity)
                    .collect(Collectors.toList());

            return new TaskMetrics(total, completed, pending, rate, recentTasks);
        }, taskExecutor);

        // 2. Asynchronous task: Retrieve and calculate Focus Session metrics
        CompletableFuture<FocusMetrics> focusFuture = CompletableFuture.supplyAsync(() -> {
            List<FocusSession> allSessions = focusSessionRepository.findByUserIdOrderByStartedAtDesc(userId);

            List<FocusSessionResponse> recentSessions = allSessions.stream()
                    .limit(5)
                    .map(FocusSessionResponse::fromEntity)
                    .collect(Collectors.toList());

            ZoneId zone = ZoneId.systemDefault();
            LocalDate today = LocalDate.now(zone);

            // Calculate today's focus seconds
            long todaySeconds = allSessions.stream()
                    .filter(s -> s.getStartedAt() != null &&
                            s.getStartedAt().atZone(zone).toLocalDate().isEqual(today))
                    .mapToLong(FocusSession::getDuration)
                    .sum();

            // Calculate weekly focus (last 7 days, oldest to today)
            List<DashboardResponse.DailyFocusStat> weeklyList = new ArrayList<>();
            Set<LocalDate> activeDays = new HashSet<>();

            DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH);

            for (int i = 6; i >= 0; i--) {
                LocalDate targetDate = today.minusDays(i);
                String dayName = targetDate.format(dayFormatter);
                String dateStr = targetDate.toString();

                long daySeconds = allSessions.stream()
                        .filter(s -> s.getStartedAt() != null &&
                                s.getStartedAt().atZone(zone).toLocalDate().isEqual(targetDate))
                        .mapToLong(FocusSession::getDuration)
                        .sum();

                if (daySeconds > 0) {
                    activeDays.add(targetDate);
                }

                int dayMinutes = (int) Math.round((double) daySeconds / 60.0);
                weeklyList.add(new DashboardResponse.DailyFocusStat(dayName, dateStr, daySeconds, dayMinutes));
            }

            int activeDaysCount = activeDays.size();
            return new FocusMetrics(todaySeconds, recentSessions, weeklyList, activeDaysCount);
        }, taskExecutor);

        // 3. Combine both asynchronous computations
        CompletableFuture.allOf(taskFuture, focusFuture).join();

        TaskMetrics taskMetrics = taskFuture.join();
        FocusMetrics focusMetrics = focusFuture.join();

        // 4. Calculate Rule-Based Productivity Score
        int score = calculateProductivityScore(
                taskMetrics.total,
                taskMetrics.completed,
                focusMetrics.todaySeconds,
                focusMetrics.activeDaysLast7Days
        );

        return new DashboardResponse(
                focusMetrics.todaySeconds,
                taskMetrics.total,
                taskMetrics.completed,
                taskMetrics.pending,
                taskMetrics.completionRate,
                score,
                focusMetrics.weeklyFocus,
                taskMetrics.recentTasks,
                focusMetrics.recentSessions
        );
    }

    /**
     * Deterministic Rule-Based Productivity Score Calculation:
     *
     * Weights:
     * - Task Completion Rate: 40%
     * - Focus Consistency (active days out of 7): 30%
     * - Daily Focus Goal (2 hours = 7200 seconds): 30%
     *
     * Clamped: [0, 100]
     */
    public int calculateProductivityScore(long totalTasks, long completedTasks,
                                         long todayFocusSeconds, int activeDaysLast7Days) {
        if (totalTasks == 0 && todayFocusSeconds == 0 && activeDaysLast7Days == 0) {
            return 0;
        }

        // 1. Task factor: 0.0 to 1.0 (40 points)
        double taskFactor = totalTasks > 0 ? (double) completedTasks / totalTasks : 0.0;

        // 2. Consistency factor: 0.0 to 1.0 (30 points)
        double consistencyFactor = Math.min(1.0, (double) activeDaysLast7Days / 7.0);

        // 3. Focus time factor: normalized to 7200s (2 hours) (30 points)
        double targetSeconds = 7200.0;
        double focusTimeFactor = Math.min(1.0, (double) todayFocusSeconds / targetSeconds);

        double totalScore = (taskFactor * 40.0) + (consistencyFactor * 30.0) + (focusTimeFactor * 30.0);
        return (int) Math.max(0, Math.min(100, Math.round(totalScore)));
    }

    // Helper data holders for combining async futures
    private static class TaskMetrics {
        final long total;
        final long completed;
        final long pending;
        final double completionRate;
        final List<TaskResponse> recentTasks;

        TaskMetrics(long total, long completed, long pending, double completionRate, List<TaskResponse> recentTasks) {
            this.total = total;
            this.completed = completed;
            this.pending = pending;
            this.completionRate = completionRate;
            this.recentTasks = recentTasks;
        }
    }

    private static class FocusMetrics {
        final long todaySeconds;
        final List<FocusSessionResponse> recentSessions;
        final List<DashboardResponse.DailyFocusStat> weeklyFocus;
        final int activeDaysLast7Days;

        FocusMetrics(long todaySeconds, List<FocusSessionResponse> recentSessions,
                     List<DashboardResponse.DailyFocusStat> weeklyFocus, int activeDaysLast7Days) {
            this.todaySeconds = todaySeconds;
            this.recentSessions = recentSessions;
            this.weeklyFocus = weeklyFocus;
            this.activeDaysLast7Days = activeDaysLast7Days;
        }
    }
}
