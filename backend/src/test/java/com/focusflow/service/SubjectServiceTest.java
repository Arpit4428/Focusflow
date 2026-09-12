package com.focusflow.service;

import com.focusflow.dto.SubjectRequest;
import com.focusflow.dto.SubjectResponse;
import com.focusflow.exception.BadRequestException;
import com.focusflow.exception.ResourceNotFoundException;
import com.focusflow.model.Subject;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubjectServiceTest {

    @Mock
    private SubjectRepository subjectRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private FocusSessionRepository focusSessionRepository;

    private SubjectService subjectService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        subjectService = new SubjectService(subjectRepository, taskRepository, focusSessionRepository);

        userA = new User("User A", "a@example.com", "hashA");
        userA.setId("userA_id");

        userB = new User("User B", "b@example.com", "hashB");
        userB.setId("userB_id");
    }

    @Test
    @DisplayName("Create subject succeeds with default color when omitted")
    void testCreateSubject() {
        SubjectRequest req = new SubjectRequest("Data Structures", null, "Core CS course");

        when(subjectRepository.existsByUserIdAndNameIgnoreCase("userA_id", "Data Structures")).thenReturn(false);
        when(subjectRepository.save(any(Subject.class))).thenAnswer(inv -> {
            Subject s = inv.getArgument(0);
            s.setId("sub1");
            return s;
        });

        SubjectResponse res = subjectService.createSubject(req, userA);

        assertNotNull(res);
        assertEquals("sub1", res.getId());
        assertEquals("userA_id", res.getUserId());
        assertEquals("Data Structures", res.getName());
        assertEquals("#DDEBDF", res.getColor());
        assertEquals("Core CS course", res.getDescription());
        verify(subjectRepository).save(any(Subject.class));
    }

    @Test
    @DisplayName("Duplicate subject name rejected for the same user")
    void testDuplicateSubjectRejectedForSameUser() {
        SubjectRequest req = new SubjectRequest("Data Structures", "#E7FF63", null);

        when(subjectRepository.existsByUserIdAndNameIgnoreCase("userA_id", "Data Structures")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                subjectService.createSubject(req, userA)
        );

        assertTrue(ex.getMessage().contains("already exists"));
        verify(subjectRepository, never()).save(any(Subject.class));
    }

    @Test
    @DisplayName("Same subject name is allowed across different users")
    void testSameSubjectNameAllowedForDifferentUsers() {
        SubjectRequest req = new SubjectRequest("Mathematics", "#DDEBDF", null);

        when(subjectRepository.existsByUserIdAndNameIgnoreCase("userB_id", "Mathematics")).thenReturn(false);
        when(subjectRepository.save(any(Subject.class))).thenAnswer(inv -> {
            Subject s = inv.getArgument(0);
            s.setId("sub_b");
            return s;
        });

        SubjectResponse res = subjectService.createSubject(req, userB);

        assertEquals("userB_id", res.getUserId());
        assertEquals("Mathematics", res.getName());
    }

    @Test
    @DisplayName("getSubjects only returns current user's subjects")
    void testGetSubjectsOnlyReturnsCurrentUserSubjects() {
        Subject s1 = new Subject("userA_id", "Algorithms", "#DDEBDF", null);
        s1.setId("s1");
        Subject s2 = new Subject("userA_id", "Operating Systems", "#C9DCCB", null);
        s2.setId("s2");

        when(subjectRepository.findByUserIdOrderByNameAsc("userA_id")).thenReturn(List.of(s1, s2));

        List<SubjectResponse> list = subjectService.getSubjects(userA);

        assertEquals(2, list.size());
        assertEquals("Algorithms", list.get(0).getName());
        assertEquals("Operating Systems", list.get(1).getName());
    }

    @Test
    @DisplayName("getSubjectById rejects another user's subject")
    void testGetSubjectByIdRejectsAnotherUser() {
        when(subjectRepository.findByIdAndUserId("sub1", "userB_id")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                subjectService.getSubjectById("sub1", userB)
        );
    }

    @Test
    @DisplayName("Update subject updates fields and timestamp")
    void testUpdateSubject() {
        Subject existing = new Subject("userA_id", "Old Name", "#DDEBDF", "Desc");
        existing.setId("sub1");

        when(subjectRepository.findByIdAndUserId("sub1", "userA_id")).thenReturn(Optional.of(existing));
        when(subjectRepository.existsByUserIdAndNameIgnoreCaseAndIdNot("userA_id", "New Name", "sub1")).thenReturn(false);
        when(subjectRepository.save(any(Subject.class))).thenAnswer(inv -> inv.getArgument(0));

        SubjectRequest req = new SubjectRequest("New Name", "#E7FF63", "Updated Desc");
        SubjectResponse updated = subjectService.updateSubject("sub1", req, userA);

        assertEquals("New Name", updated.getName());
        assertEquals("#E7FF63", updated.getColor());
        assertEquals("Updated Desc", updated.getDescription());
    }

    @Test
    @DisplayName("Delete subject succeeds when no tasks or sessions reference it")
    void testDeleteSubjectSuccess() {
        Subject existing = new Subject("userA_id", "Physics", "#DDEBDF", null);
        existing.setId("sub1");

        when(subjectRepository.findByIdAndUserId("sub1", "userA_id")).thenReturn(Optional.of(existing));
        when(taskRepository.existsBySubjectIdAndUserId("sub1", "userA_id")).thenReturn(false);
        when(focusSessionRepository.existsBySubjectIdAndUserId("sub1", "userA_id")).thenReturn(false);

        subjectService.deleteSubject("sub1", userA);

        verify(subjectRepository).delete(existing);
    }

    @Test
    @DisplayName("Cross-user delete rejected with ResourceNotFoundException")
    void testCrossUserDeleteRejected() {
        when(subjectRepository.findByIdAndUserId("sub1", "userB_id")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () ->
                subjectService.deleteSubject("sub1", userB)
        );

        verify(subjectRepository, never()).delete(any(Subject.class));
    }

    @Test
    @DisplayName("Deletion blocked when tasks reference subject")
    void testDeletionBlockedWhenTasksReferenceSubject() {
        Subject existing = new Subject("userA_id", "Chemistry", "#DDEBDF", null);
        existing.setId("sub1");

        when(subjectRepository.findByIdAndUserId("sub1", "userA_id")).thenReturn(Optional.of(existing));
        when(taskRepository.existsBySubjectIdAndUserId("sub1", "userA_id")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                subjectService.deleteSubject("sub1", userA)
        );

        assertTrue(ex.getMessage().contains("associated tasks or focus sessions"));
        verify(subjectRepository, never()).delete(any(Subject.class));
    }

    @Test
    @DisplayName("Deletion blocked when focus sessions reference subject")
    void testDeletionBlockedWhenSessionsReferenceSubject() {
        Subject existing = new Subject("userA_id", "Biology", "#DDEBDF", null);
        existing.setId("sub1");

        when(subjectRepository.findByIdAndUserId("sub1", "userA_id")).thenReturn(Optional.of(existing));
        when(taskRepository.existsBySubjectIdAndUserId("sub1", "userA_id")).thenReturn(false);
        when(focusSessionRepository.existsBySubjectIdAndUserId("sub1", "userA_id")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                subjectService.deleteSubject("sub1", userA)
        );

        assertTrue(ex.getMessage().contains("associated tasks or focus sessions"));
        verify(subjectRepository, never()).delete(any(Subject.class));
    }
}
