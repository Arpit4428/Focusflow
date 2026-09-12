package com.focusflow.service;

import com.focusflow.dto.FocusSessionRequest;
import com.focusflow.dto.FocusSessionResponse;
import com.focusflow.exception.BadRequestException;
import com.focusflow.exception.ResourceNotFoundException;
import com.focusflow.model.FocusSession;
import com.focusflow.model.Subject;
import com.focusflow.model.User;
import com.focusflow.repository.FocusSessionRepository;
import com.focusflow.repository.SubjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Focus Session Management Service.
 * Associates focus sessions strictly with the authenticated User identity.
 */
@Service
public class FocusSessionService {

    private final FocusSessionRepository focusSessionRepository;
    private final SubjectRepository subjectRepository;

    public FocusSessionService(FocusSessionRepository focusSessionRepository,
                               SubjectRepository subjectRepository) {
        this.focusSessionRepository = focusSessionRepository;
        this.subjectRepository = subjectRepository;
    }

    public FocusSessionResponse createSession(FocusSessionRequest request, User currentUser) {
        String resolvedSubject;
        String resolvedSubjectId = null;

        if (request.getSubjectId() != null && !request.getSubjectId().trim().isEmpty()) {
            String subId = request.getSubjectId().trim();
            Subject subject = subjectRepository.findByIdAndUserId(subId, currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + subId));
            resolvedSubjectId = subject.getId();
            resolvedSubject = subject.getName();
        } else if (request.getSubject() != null && !request.getSubject().trim().isEmpty()) {
            resolvedSubject = request.getSubject().trim();
        } else {
            throw new BadRequestException("Subject or subjectId is required");
        }

        FocusSession session = new FocusSession(
                currentUser.getId(),
                resolvedSubjectId,
                resolvedSubject,
                request.getDuration(),
                request.getStartedAt(),
                request.getEndedAt(),
                request.isCompleted()
        );

        FocusSession saved = focusSessionRepository.save(session);
        return FocusSessionResponse.fromEntity(saved);
    }

    public List<FocusSessionResponse> getSessions(User currentUser, String subject) {
        return getSessions(currentUser, null, subject);
    }

    public List<FocusSessionResponse> getSessions(User currentUser, String subjectId, String subject) {
        List<FocusSession> sessions;

        if (subjectId != null && !subjectId.trim().isEmpty()) {
            sessions = focusSessionRepository.findByUserIdAndSubjectIdOrderByStartedAtDesc(
                    currentUser.getId(), subjectId.trim());
        } else if (subject != null && !subject.trim().isEmpty()) {
            sessions = focusSessionRepository.findByUserIdAndSubjectOrderByStartedAtDesc(
                    currentUser.getId(), subject.trim());
        } else {
            sessions = focusSessionRepository.findByUserIdOrderByStartedAtDesc(currentUser.getId());
        }

        return sessions.stream()
                .map(FocusSessionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public FocusSessionResponse getSessionById(String id, User currentUser) {
        FocusSession session = focusSessionRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Focus session not found with id: " + id));

        return FocusSessionResponse.fromEntity(session);
    }

    public void deleteSession(String id, User currentUser) {
        FocusSession session = focusSessionRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Focus session not found with id: " + id));

        focusSessionRepository.delete(session);
    }
}
