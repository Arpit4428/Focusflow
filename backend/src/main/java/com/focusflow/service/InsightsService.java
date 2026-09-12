package com.focusflow.service;

import com.focusflow.dto.InsightsResponse;
import com.focusflow.model.FocusSession;
import com.focusflow.model.Priority;
import com.focusflow.model.Task;
import com.focusflow.model.TaskStatus;
import com.focusflow.model.User;
import com.focusflow.repository.FocusSessionRepository;
import com.focusflow.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Academic Insights Analysis Service.
 * Performs statistical aggregation and generates rule-based academic recommendations.
 *
 * NOTE FOR VIVA:
 * This is a deterministic rule-based analytical system (NOT AI/ML).
 * It calculates statistical summaries directly from existing MongoDB tasks and focus_sessions data.
 * It is implemented synchronously to maintain simplicity, since the queries operate cleanly on indexed fields.
 */
@Service
public class InsightsService {

    private final TaskRepository taskRepository;
    private final FocusSessionRepository focusSessionRepository;

    public InsightsService(TaskRepository taskRepository, FocusSessionRepository focusSessionRepository) {
        this.taskRepository = taskRepository;
        this.focusSessionRepository = focusSessionRepository;
    }

    public InsightsResponse getInsights(User currentUser) {
        String userId = currentUser.getId();

        // 1. Fetch data from repositories
        long totalTasks = taskRepository.countByUserId(userId);
        long completedTasks = taskRepository.countByUserIdAndStatus(userId, TaskStatus.COMPLETED);
        long pendingTasks = totalTasks - completedTasks;
        double completionRate = totalTasks > 0 ? ((double) completedTasks / totalTasks) * 100.0 : 0.0;

        List<Task> allTasks = taskRepository.findByUserIdOrderByDueDateAsc(userId);
        List<FocusSession> allSessions = focusSessionRepository.findByUserIdOrderByStartedAtDesc(userId);

        // 2. Overall Focus Statistics (All-Time)
        long totalFocusSeconds = allSessions.stream()
                .mapToLong(FocusSession::getDuration)
                .sum();
        long totalSessions = allSessions.size();
        long avgSessionDurationSeconds = totalSessions > 0 ? totalFocusSeconds / totalSessions : 0;

        // 3. Subject-wise Analysis
        Map<String, Long> subjectDurations = allSessions.stream()
                .collect(Collectors.groupingBy(
                        FocusSession::getSubject,
                        Collectors.summingLong(FocusSession::getDuration)
                ));

        List<InsightsResponse.SubjectStat> subjectBreakdown = subjectDurations.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(entry -> {
                    String sub = entry.getKey();
                    long sec = entry.getValue();
                    int mins = (int) Math.round((double) sec / 60.0);
                    double pct = totalFocusSeconds > 0 ? ((double) sec / totalFocusSeconds) * 100.0 : 0.0;
                    return new InsightsResponse.SubjectStat(sub, sec, mins, Math.round(pct * 10.0) / 10.0);
                })
                .collect(Collectors.toList());

        String mostFocusedSubject = subjectBreakdown.isEmpty() ? "None" : subjectBreakdown.get(0).getSubject();

        // 4. Day of Week Pattern Analysis
        ZoneId zone = ZoneId.systemDefault();
        Map<DayOfWeek, Long> daySecondsMap = new EnumMap<>(DayOfWeek.class);
        Map<DayOfWeek, Integer> daySessionsMap = new EnumMap<>(DayOfWeek.class);

        for (DayOfWeek dow : DayOfWeek.values()) {
            daySecondsMap.put(dow, 0L);
            daySessionsMap.put(dow, 0);
        }

        for (FocusSession session : allSessions) {
            if (session.getStartedAt() != null) {
                DayOfWeek dow = session.getStartedAt().atZone(zone).getDayOfWeek();
                daySecondsMap.put(dow, daySecondsMap.get(dow) + session.getDuration());
                daySessionsMap.put(dow, daySessionsMap.get(dow) + 1);
            }
        }

        List<InsightsResponse.DayOfWeekStat> dayOfWeekBreakdown = new ArrayList<>();
        DayOfWeek topDay = null;
        long topDaySeconds = -1;

        // Sequence: Monday through Sunday
        for (DayOfWeek dow : DayOfWeek.values()) {
            String dayName = dow.getDisplayName(TextStyle.FULL, Locale.ENGLISH);
            long sec = daySecondsMap.get(dow);
            int count = daySessionsMap.get(dow);
            dayOfWeekBreakdown.add(new InsightsResponse.DayOfWeekStat(dayName, sec, count));

            if (sec > topDaySeconds) {
                topDaySeconds = sec;
                topDay = dow;
            }
        }

        String mostProductiveDay = (topDaySeconds > 0 && topDay != null)
                ? topDay.getDisplayName(TextStyle.FULL, Locale.ENGLISH)
                : "None";

        // 5. Last 7 Days Activity
        LocalDate today = LocalDate.now(zone);
        LocalDate sevenDaysAgo = today.minusDays(6);

        List<FocusSession> recentWeekSessions = allSessions.stream()
                .filter(s -> s.getStartedAt() != null)
                .filter(s -> {
                    LocalDate sessionDate = s.getStartedAt().atZone(zone).toLocalDate();
                    return !sessionDate.isBefore(sevenDaysAgo) && !sessionDate.isAfter(today);
                })
                .collect(Collectors.toList());

        long weeklyFocusSeconds = recentWeekSessions.stream()
                .mapToLong(FocusSession::getDuration)
                .sum();

        Set<LocalDate> activeDays = recentWeekSessions.stream()
                .map(s -> s.getStartedAt().atZone(zone).toLocalDate())
                .collect(Collectors.toSet());
        int activeDaysCount = activeDays.size();

        // 6. Generate Rule-Based Recommendations
        List<InsightsResponse.Recommendation> recommendations = generateRecommendations(
                totalTasks, completedTasks, pendingTasks, completionRate, allTasks,
                totalSessions, totalFocusSeconds, weeklyFocusSeconds, activeDaysCount,
                mostFocusedSubject, subjectBreakdown
        );

        return new InsightsResponse(
                totalFocusSeconds,
                avgSessionDurationSeconds,
                totalSessions,
                mostFocusedSubject,
                totalTasks,
                completedTasks,
                pendingTasks,
                Math.round(completionRate * 10.0) / 10.0,
                mostProductiveDay,
                activeDaysCount,
                weeklyFocusSeconds,
                subjectBreakdown,
                dayOfWeekBreakdown,
                recommendations
        );
    }

    /**
     * Rule-Based Recommendation Engine:
     * Evaluates deterministic condition thresholds based on real MongoDB student metrics.
     */
    public List<InsightsResponse.Recommendation> generateRecommendations(
            long totalTasks, long completedTasks, long pendingTasks, double completionRate, List<Task> allTasks,
            long totalSessions, long totalFocusSeconds, long weeklyFocusSeconds, int activeDaysCount,
            String mostFocusedSubject, List<InsightsResponse.SubjectStat> subjectBreakdown) {

        List<InsightsResponse.Recommendation> recs = new ArrayList<>();

        // Case 1: Empty state
        if (totalTasks == 0 && totalSessions == 0) {
            recs.add(new InsightsResponse.Recommendation(
                    "INFO",
                    "Welcome to Study Insights",
                    "Log your upcoming coursework tasks and start a focus session to unlock rule-based productivity insights."
            ));
            return recs;
        }

        // Rule 1: Study Consistency
        if (activeDaysCount >= 5) {
            recs.add(new InsightsResponse.Recommendation(
                    "SUCCESS",
                    "High Study Consistency",
                    "Outstanding consistency! You completed focused study on " + activeDaysCount + " of the last 7 days."
            ));
        } else if (activeDaysCount < 3 && totalSessions > 0) {
            recs.add(new InsightsResponse.Recommendation(
                    "WARNING",
                    "Improve Study Momentum",
                    "You studied on only " + activeDaysCount + " of the last 7 days. Aim for shorter, daily study intervals to build momentum."
            ));
        }

        // Rule 2: High Priority Task Alert
        long highPriorityPending = allTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.PENDING && t.getPriority() == Priority.HIGH)
                .count();

        if (highPriorityPending > 0) {
            recs.add(new InsightsResponse.Recommendation(
                    "WARNING",
                    "Urgent Assignments Pending",
                    "You have " + highPriorityPending + " high-priority task(s) awaiting completion. Prioritize these before lower-priority tasks."
            ));
        }

        // Rule 3: Task Completion Rate
        if (totalTasks >= 3 && completionRate >= 75.0) {
            recs.add(new InsightsResponse.Recommendation(
                    "SUCCESS",
                    "Strong Task Execution",
                    "You have completed " + Math.round(completionRate) + "% of your tasks. Great job staying on top of your deadlines!"
            ));
        } else if (totalTasks >= 3 && completionRate < 40.0) {
            recs.add(new InsightsResponse.Recommendation(
                    "INFO",
                    "Task Backlog Notice",
                    "Your task completion rate is " + Math.round(completionRate) + "%. Consider breaking down large tasks into smaller steps."
            ));
        }

        // Rule 4: Subject Balance
        if (subjectBreakdown.size() > 1) {
            InsightsResponse.SubjectStat topSubject = subjectBreakdown.get(0);
            if (topSubject.getPercentage() >= 65.0) {
                recs.add(new InsightsResponse.Recommendation(
                        "INFO",
                        "Coursework Balance",
                        Math.round(topSubject.getPercentage()) + "% of your focus time is going toward " + topSubject.getSubject() + ". Make sure not to neglect other subjects."
                ));
            }
        }

        // Rule 5: Weekly Volume
        if (weeklyFocusSeconds >= 28800) { // 8+ hours
            recs.add(new InsightsResponse.Recommendation(
                    "SUCCESS",
                    "High Focus Volume",
                    "You logged over " + (weeklyFocusSeconds / 3600) + " hours of focused study this week. Keep up the great pace!"
            ));
        } else if (weeklyFocusSeconds < 3600 && totalSessions > 0) {
            recs.add(new InsightsResponse.Recommendation(
                    "INFO",
                    "Focus Boost",
                    "Your weekly focus time is under 1 hour. Try starting a 25-minute focus session today."
            ));
        }

        return recs;
    }
}
