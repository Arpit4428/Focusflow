package com.focusflow.service;

import com.focusflow.dto.DashboardResponse;
import com.focusflow.dto.FocusSessionResponse;
import com.focusflow.dto.TaskResponse;
import com.focusflow.model.FocusSession;
import com.focusflow.model.Subject;
import com.focusflow.model.Task;
import com.focusflow.model.TaskStatus;
import com.focusflow.model.User;
import com.focusflow.repository.FocusSessionRepository;
import com.focusflow.repository.SubjectRepository;
import com.focusflow.repository.TaskRepository;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Dashboard Service.
 * Aggregates statistics from tasks, focus_sessions, and subjects collections for the authenticated user.
 *
 * Demonstrates Unit 3 Multithreading:
 * Executes task metrics computation and focus session analysis concurrently using
 * CompletableFuture and Spring's configured ThreadPoolTaskExecutor (Scatter-Gather pattern).
 */
@Service
public class DashboardService {

    private final TaskRepository taskRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final SubjectRepository subjectRepository;
    private final TaskExecutor taskExecutor;

    public DashboardService(TaskRepository taskRepository,
                            FocusSessionRepository focusSessionRepository,
                            SubjectRepository subjectRepository,
                            TaskExecutor taskExecutor) {
        this.taskRepository = taskRepository;
        this.focusSessionRepository = focusSessionRepository;
        this.subjectRepository = subjectRepository;
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

            return new TaskMetrics(total, completed, pending, rate, recentTasks, allTasks);
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
            return new FocusMetrics(todaySeconds, recentSessions, weeklyList, activeDaysCount, allSessions);
        }, taskExecutor);

        // 3. Combine both asynchronous computations
        CompletableFuture.allOf(taskFuture, focusFuture).join();

        TaskMetrics taskMetrics = taskFuture.join();
        FocusMetrics focusMetrics = focusFuture.join();

        int goalMinutes = currentUser.getDailyFocusGoalMinutes() != null ? currentUser.getDailyFocusGoalMinutes() : 120;

        // 4. Calculate Rule-Based Productivity Score
        int score = calculateProductivityScore(
                taskMetrics.total,
                taskMetrics.completed,
                focusMetrics.todaySeconds,
                focusMetrics.activeDaysLast7Days,
                goalMinutes
        );

        // 5. Calculate Subject Distribution Analytics
        List<DashboardResponse.SubjectStat> subjectAnalytics = calculateSubjectAnalytics(
                userId,
                taskMetrics.allTasks,
                focusMetrics.allSessions
        );

        DashboardResponse response = new DashboardResponse(
                focusMetrics.todaySeconds,
                taskMetrics.total,
                taskMetrics.completed,
                taskMetrics.pending,
                taskMetrics.completionRate,
                score,
                focusMetrics.weeklyFocus,
                taskMetrics.recentTasks,
                focusMetrics.recentSessions,
                subjectAnalytics
        );
        response.setDailyFocusGoalMinutes(goalMinutes);
        return response;
    }

    private List<DashboardResponse.SubjectStat> calculateSubjectAnalytics(
            String userId, List<Task> tasks, List<FocusSession> sessions) {

        List<Subject> userSubjects = subjectRepository.findByUserIdOrderByNameAsc(userId);
        long totalAllFocusSeconds = sessions.stream().mapToLong(FocusSession::getDuration).sum();

        Map<String, DashboardResponse.SubjectStat> statMap = new LinkedHashMap<>();

        // Initialize with registered subjects
        for (Subject sub : userSubjects) {
            statMap.put(sub.getId(), new DashboardResponse.SubjectStat(
                    sub.getId(),
                    sub.getName(),
                    sub.getColor() != null ? sub.getColor() : "#DDEBDF",
                    0L,
                    0,
                    0.0,
                    0L,
                    0L,
                    0L
            ));
        }

        // Map focus sessions
        for (FocusSession session : sessions) {
            String subId = session.getSubjectId();
            DashboardResponse.SubjectStat stat = null;
            if (subId != null && statMap.containsKey(subId)) {
                stat = statMap.get(subId);
            } else if (session.getSubject() != null && !session.getSubject().trim().isEmpty()) {
                String name = session.getSubject().trim();
                for (DashboardResponse.SubjectStat s : statMap.values()) {
                    if (s.getSubjectName().equalsIgnoreCase(name)) {
                        stat = s;
                        break;
                    }
                }
                if (stat == null) {
                    stat = statMap.computeIfAbsent("legacy_" + name.toLowerCase(), k -> new DashboardResponse.SubjectStat(
                            null,
                            name,
                            "#DDEBDF",
                            0L,
                            0,
                            0.0,
                            0L,
                            0L,
                            0L
                    ));
                }
            }

            if (stat != null) {
                stat.setFocusSeconds(stat.getFocusSeconds() + session.getDuration());
            }
        }

        // Map tasks
        for (Task task : tasks) {
            String subId = task.getSubjectId();
            DashboardResponse.SubjectStat stat = null;
            if (subId != null && statMap.containsKey(subId)) {
                stat = statMap.get(subId);
            } else if (task.getSubject() != null && !task.getSubject().trim().isEmpty()) {
                String name = task.getSubject().trim();
                for (DashboardResponse.SubjectStat s : statMap.values()) {
                    if (s.getSubjectName().equalsIgnoreCase(name)) {
                        stat = s;
                        break;
                    }
                }
                if (stat == null) {
                    stat = statMap.computeIfAbsent("legacy_" + name.toLowerCase(), k -> new DashboardResponse.SubjectStat(
                            null,
                            name,
                            "#DDEBDF",
                            0L,
                            0,
                            0.0,
                            0L,
                            0L,
                            0L
                    ));
                }
            }

            if (stat != null) {
                stat.setTotalTasks(stat.getTotalTasks() + 1);
                if (task.getStatus() == TaskStatus.COMPLETED) {
                    stat.setCompletedTasks(stat.getCompletedTasks() + 1);
                } else {
                    stat.setPendingTasks(stat.getPendingTasks() + 1);
                }
            }
        }

        // Calculate rounded minutes, percentages, and sort
        List<DashboardResponse.SubjectStat> result = new ArrayList<>();
        for (DashboardResponse.SubjectStat stat : statMap.values()) {
            stat.setFocusMinutes((int) Math.round((double) stat.getFocusSeconds() / 60.0));
            double pct = totalAllFocusSeconds > 0
                    ? ((double) stat.getFocusSeconds() / totalAllFocusSeconds) * 100.0
                    : 0.0;
            stat.setFocusPercentage(Math.round(pct * 10.0) / 10.0);

            if (stat.getSubjectId() != null || stat.getFocusSeconds() > 0 || stat.getTotalTasks() > 0) {
                result.add(stat);
            }
        }

        result.sort((a, b) -> {
            int cmp = Long.compare(b.getFocusSeconds(), a.getFocusSeconds());
            if (cmp != 0) return cmp;
            return Long.compare(b.getTotalTasks(), a.getTotalTasks());
        });

        return result;
    }

    public int calculateProductivityScore(long totalTasks, long completedTasks,
                                         long todayFocusSeconds, int activeDaysLast7Days) {
        return calculateProductivityScore(totalTasks, completedTasks, todayFocusSeconds, activeDaysLast7Days, 120);
    }

    public int calculateProductivityScore(long totalTasks, long completedTasks,
                                         long todayFocusSeconds, int activeDaysLast7Days,
                                         int goalMinutes) {
        if (totalTasks == 0 && todayFocusSeconds == 0 && activeDaysLast7Days == 0) {
            return 0;
        }

        double taskFactor = totalTasks > 0 ? (double) completedTasks / totalTasks : 0.0;
        double consistencyFactor = Math.min(1.0, (double) activeDaysLast7Days / 7.0);
        double targetSeconds = (goalMinutes > 0 ? goalMinutes : 120) * 60.0;
        double focusTimeFactor = Math.min(1.0, (double) todayFocusSeconds / targetSeconds);

        double totalScore = (taskFactor * 40.0) + (consistencyFactor * 30.0) + (focusTimeFactor * 30.0);
        return (int) Math.max(0, Math.min(100, Math.round(totalScore)));
    }

    private static class TaskMetrics {
        final long total;
        final long completed;
        final long pending;
        final double completionRate;
        final List<TaskResponse> recentTasks;
        final List<Task> allTasks;

        TaskMetrics(long total, long completed, long pending, double completionRate,
                    List<TaskResponse> recentTasks, List<Task> allTasks) {
            this.total = total;
            this.completed = completed;
            this.pending = pending;
            this.completionRate = completionRate;
            this.recentTasks = recentTasks;
            this.allTasks = allTasks;
        }
    }

    private static class FocusMetrics {
        final long todaySeconds;
        final List<FocusSessionResponse> recentSessions;
        final List<DashboardResponse.DailyFocusStat> weeklyFocus;
        final int activeDaysLast7Days;
        final List<FocusSession> allSessions;

        FocusMetrics(long todaySeconds, List<FocusSessionResponse> recentSessions,
                     List<DashboardResponse.DailyFocusStat> weeklyFocus, int activeDaysLast7Days,
                     List<FocusSession> allSessions) {
            this.todaySeconds = todaySeconds;
            this.recentSessions = recentSessions;
            this.weeklyFocus = weeklyFocus;
            this.activeDaysLast7Days = activeDaysLast7Days;
            this.allSessions = allSessions;
        }
    }
}
