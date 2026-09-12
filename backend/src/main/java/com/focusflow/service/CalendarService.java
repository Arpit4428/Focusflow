package com.focusflow.service;

import com.focusflow.dto.CalendarDayActivity;
import com.focusflow.dto.CalendarResponse;
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
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Calendar Activity Service.
 * Aggregates tasks and focus sessions per date for the authenticated user.
 */
@Service
public class CalendarService {

    private final TaskRepository taskRepository;
    private final FocusSessionRepository focusSessionRepository;
    private final SubjectRepository subjectRepository;

    public CalendarService(TaskRepository taskRepository,
                           FocusSessionRepository focusSessionRepository,
                           SubjectRepository subjectRepository) {
        this.taskRepository = taskRepository;
        this.focusSessionRepository = focusSessionRepository;
        this.subjectRepository = subjectRepository;
    }

    public CalendarResponse getCalendarActivity(User currentUser, Integer year, Integer month) {
        String userId = currentUser.getId();
        ZoneId zone = ZoneId.systemDefault();

        LocalDate now = LocalDate.now(zone);
        int targetYear = (year != null && year >= 2000 && year <= 2100) ? year : now.getYear();
        int targetMonth = (month != null && month >= 1 && month <= 12) ? month : now.getMonthValue();

        YearMonth yearMonth = YearMonth.of(targetYear, targetMonth);
        LocalDate startOfMonth = yearMonth.atDay(1);
        LocalDate endOfMonth = yearMonth.atEndOfMonth();

        // 1. Fetch user subjects to map names and colors
        List<Subject> userSubjects = subjectRepository.findByUserIdOrderByNameAsc(userId);
        Map<String, Subject> subjectMapById = userSubjects.stream()
                .collect(Collectors.toMap(Subject::getId, s -> s, (a, b) -> a));

        // 2. Fetch all tasks and focus sessions for the authenticated user
        List<Task> allUserTasks = taskRepository.findByUserIdOrderByDueDateAsc(userId);
        List<FocusSession> allUserSessions = focusSessionRepository.findByUserIdOrderByStartedAtDesc(userId);

        // 3. Filter for the requested month
        Map<LocalDate, List<Task>> tasksByDate = new HashMap<>();
        for (Task task : allUserTasks) {
            if (task.getDueDate() != null) {
                LocalDate taskDate = task.getDueDate().atZone(zone).toLocalDate();
                if (!taskDate.isBefore(startOfMonth) && !taskDate.isAfter(endOfMonth)) {
                    tasksByDate.computeIfAbsent(taskDate, k -> new ArrayList<>()).add(task);
                }
            }
        }

        Map<LocalDate, List<FocusSession>> sessionsByDate = new HashMap<>();
        for (FocusSession session : allUserSessions) {
            if (session.getStartedAt() != null) {
                LocalDate sessionDate = session.getStartedAt().atZone(zone).toLocalDate();
                if (!sessionDate.isBefore(startOfMonth) && !sessionDate.isAfter(endOfMonth)) {
                    sessionsByDate.computeIfAbsent(sessionDate, k -> new ArrayList<>()).add(session);
                }
            }
        }

        // 4. Combine all dates with activity
        Set<LocalDate> activeDates = new TreeSet<>();
        activeDates.addAll(tasksByDate.keySet());
        activeDates.addAll(sessionsByDate.keySet());

        List<CalendarDayActivity> activities = new ArrayList<>();
        DateTimeFormatter isoFormatter = DateTimeFormatter.ISO_LOCAL_DATE;

        for (LocalDate date : activeDates) {
            List<Task> dayTasks = tasksByDate.getOrDefault(date, Collections.emptyList());
            List<FocusSession> daySessions = sessionsByDate.getOrDefault(date, Collections.emptyList());

            long totalFocusSeconds = daySessions.stream().mapToLong(FocusSession::getDuration).sum();
            int totalFocusMinutes = (int) Math.round((double) totalFocusSeconds / 60.0);

            long taskCount = dayTasks.size();
            long completedTaskCount = dayTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
            long pendingTaskCount = taskCount - completedTaskCount;

            // Compute Subject Breakdown for this day
            Map<String, CalendarDayActivity.SubjectBreakdown> breakdownMap = new LinkedHashMap<>();

            // Focus sessions by subject
            for (FocusSession session : daySessions) {
                String subKey = resolveSubjectKey(session.getSubjectId(), session.getSubject());
                Subject sub = session.getSubjectId() != null ? subjectMapById.get(session.getSubjectId()) : null;
                String subName = sub != null ? sub.getName() : (session.getSubject() != null ? session.getSubject() : "General");
                String color = sub != null && sub.getColor() != null ? sub.getColor() : "#DDEBDF";

                CalendarDayActivity.SubjectBreakdown sb = breakdownMap.computeIfAbsent(subKey, k ->
                        new CalendarDayActivity.SubjectBreakdown(
                                session.getSubjectId(),
                                subName,
                                color,
                                0L,
                                0,
                                0L,
                                0L
                        )
                );
                sb.setFocusSeconds(sb.getFocusSeconds() + session.getDuration());
            }

            // Tasks by subject
            for (Task task : dayTasks) {
                String subKey = resolveSubjectKey(task.getSubjectId(), task.getSubject());
                Subject sub = task.getSubjectId() != null ? subjectMapById.get(task.getSubjectId()) : null;
                String subName = sub != null ? sub.getName() : (task.getSubject() != null ? task.getSubject() : "General");
                String color = sub != null && sub.getColor() != null ? sub.getColor() : "#DDEBDF";

                CalendarDayActivity.SubjectBreakdown sb = breakdownMap.computeIfAbsent(subKey, k ->
                        new CalendarDayActivity.SubjectBreakdown(
                                task.getSubjectId(),
                                subName,
                                color,
                                0L,
                                0,
                                0L,
                                0L
                        )
                );
                sb.setTaskCount(sb.getTaskCount() + 1);
                if (task.getStatus() == TaskStatus.COMPLETED) {
                    sb.setCompletedTaskCount(sb.getCompletedTaskCount() + 1);
                }
            }

            List<CalendarDayActivity.SubjectBreakdown> breakdownList = new ArrayList<>(breakdownMap.values());
            for (CalendarDayActivity.SubjectBreakdown sb : breakdownList) {
                sb.setFocusMinutes((int) Math.round((double) sb.getFocusSeconds() / 60.0));
            }
            breakdownList.sort((a, b) -> Long.compare(b.getFocusSeconds(), a.getFocusSeconds()));

            List<TaskResponse> taskResponses = dayTasks.stream()
                    .map(TaskResponse::fromEntity)
                    .collect(Collectors.toList());

            List<FocusSessionResponse> sessionResponses = daySessions.stream()
                    .map(FocusSessionResponse::fromEntity)
                    .collect(Collectors.toList());

            activities.add(new CalendarDayActivity(
                    date.format(isoFormatter),
                    totalFocusSeconds,
                    totalFocusMinutes,
                    taskCount,
                    completedTaskCount,
                    pendingTaskCount,
                    breakdownList,
                    taskResponses,
                    sessionResponses
            ));
        }

        activities.sort(Comparator.comparing(CalendarDayActivity::getDate));
        return new CalendarResponse(targetYear, targetMonth, activities);
    }

    private String resolveSubjectKey(String subjectId, String subject) {
        if (subjectId != null && !subjectId.trim().isEmpty()) {
            return "id_" + subjectId.trim();
        }
        if (subject != null && !subject.trim().isEmpty()) {
            return "name_" + subject.trim().toLowerCase();
        }
        return "general";
    }
}
