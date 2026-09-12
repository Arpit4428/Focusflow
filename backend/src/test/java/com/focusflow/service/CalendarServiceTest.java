package com.focusflow.service;

import com.focusflow.dto.CalendarDayActivity;
import com.focusflow.dto.CalendarResponse;
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

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CalendarServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private FocusSessionRepository focusSessionRepository;

    @Mock
    private SubjectRepository subjectRepository;

    private CalendarService calendarService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        calendarService = new CalendarService(taskRepository, focusSessionRepository, subjectRepository);

        userA = new User("Alice", "alice@example.com", "hashA");
        userA.setId("userA_id");

        userB = new User("Bob", "bob@example.com", "hashB");
        userB.setId("userB_id");
    }

    @Test
    @DisplayName("Calendar aggregates tasks and focus sessions by date for requested month")
    void testCalendarAggregatesByDate() {
        ZoneId zone = ZoneId.systemDefault();
        LocalDate targetDate = LocalDate.of(2026, 9, 15);
        Instant targetInstant = targetDate.atStartOfDay(zone).toInstant().plusSeconds(3600); // 01:00 AM

        Subject sub1 = new Subject("userA_id", "Computer Networks", "#E7FF63", null);
        sub1.setId("sub_cn");

        when(subjectRepository.findByUserIdOrderByNameAsc("userA_id")).thenReturn(List.of(sub1));

        Task task1 = new Task("userA_id", "Assignment 1", null, "Computer Networks", Priority.HIGH, targetInstant);
        task1.setId("t1");
        task1.setSubjectId("sub_cn");
        task1.setStatus(TaskStatus.COMPLETED);

        Task task2 = new Task("userA_id", "Assignment 2", null, "Computer Networks", Priority.MEDIUM, targetInstant);
        task2.setId("t2");
        task2.setSubjectId("sub_cn");
        task2.setStatus(TaskStatus.PENDING);

        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(List.of(task1, task2));

        FocusSession session1 = new FocusSession("userA_id", "sub_cn", "Computer Networks", 1800L, targetInstant, targetInstant.plusSeconds(1800), true);
        session1.setId("s1");

        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id")).thenReturn(List.of(session1));

        CalendarResponse res = calendarService.getCalendarActivity(userA, 2026, 9);

        assertNotNull(res);
        assertEquals(2026, res.getYear());
        assertEquals(9, res.getMonth());
        assertEquals(1, res.getActivities().size());

        CalendarDayActivity day = res.getActivities().get(0);
        assertEquals("2026-09-15", day.getDate());
        assertEquals(1800L, day.getTotalFocusSeconds());
        assertEquals(30, day.getTotalFocusMinutes());
        assertEquals(2, day.getTaskCount());
        assertEquals(1, day.getCompletedTaskCount());
        assertEquals(2, day.getTasks().size());
        assertEquals(1, day.getSessions().size());

        // Check subject breakdown
        assertEquals(1, day.getSubjectBreakdown().size());
        CalendarDayActivity.SubjectBreakdown sb = day.getSubjectBreakdown().get(0);
        assertEquals("sub_cn", sb.getSubjectId());
        assertEquals("Computer Networks", sb.getSubjectName());
        assertEquals("#E7FF63", sb.getColor());
        assertEquals(1800L, sb.getFocusSeconds());
        assertEquals(2, sb.getTaskCount());
        assertEquals(1, sb.getCompletedTaskCount());
    }

    @Test
    @DisplayName("Calendar handles historical records without subjectId")
    void testCalendarHandlesHistoricalRecords() {
        ZoneId zone = ZoneId.systemDefault();
        LocalDate targetDate = LocalDate.of(2026, 9, 20);
        Instant targetInstant = targetDate.atStartOfDay(zone).toInstant().plusSeconds(7200);

        when(subjectRepository.findByUserIdOrderByNameAsc("userA_id")).thenReturn(Collections.emptyList());

        Task legacyTask = new Task("userA_id", "Old Task", null, "Mathematics", Priority.LOW, targetInstant);
        legacyTask.setId("lt1");
        legacyTask.setSubjectId(null);

        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(List.of(legacyTask));

        FocusSession legacySession = new FocusSession("userA_id", "Mathematics", 1200L, targetInstant, targetInstant.plusSeconds(1200), true);
        legacySession.setId("ls1");
        legacySession.setSubjectId(null);

        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id")).thenReturn(List.of(legacySession));

        CalendarResponse res = calendarService.getCalendarActivity(userA, 2026, 9);

        assertNotNull(res);
        assertEquals(1, res.getActivities().size());
        CalendarDayActivity day = res.getActivities().get(0);
        assertEquals("2026-09-20", day.getDate());
        assertEquals(1, day.getSubjectBreakdown().size());
        assertEquals("Mathematics", day.getSubjectBreakdown().get(0).getSubjectName());
        assertEquals("#DDEBDF", day.getSubjectBreakdown().get(0).getColor());
    }

    @Test
    @DisplayName("Calendar returns empty activity list when month has no activity")
    void testEmptyMonthReturnsCleanly() {
        when(subjectRepository.findByUserIdOrderByNameAsc("userA_id")).thenReturn(Collections.emptyList());
        when(taskRepository.findByUserIdOrderByDueDateAsc("userA_id")).thenReturn(Collections.emptyList());
        when(focusSessionRepository.findByUserIdOrderByStartedAtDesc("userA_id")).thenReturn(Collections.emptyList());

        CalendarResponse res = calendarService.getCalendarActivity(userA, 2026, 8);

        assertNotNull(res);
        assertEquals(2026, res.getYear());
        assertEquals(8, res.getMonth());
        assertTrue(res.getActivities().isEmpty());
    }
}
