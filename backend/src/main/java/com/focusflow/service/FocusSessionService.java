package com.focusflow.service;

import com.focusflow.dto.FocusSessionRequest;
import com.focusflow.dto.FocusSessionResponse;
import com.focusflow.exception.ResourceNotFoundException;
import com.focusflow.model.FocusSession;
import com.focusflow.model.User;
import com.focusflow.repository.FocusSessionRepository;
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

    public FocusSessionService(FocusSessionRepository focusSessionRepository) {
        this.focusSessionRepository = focusSessionRepository;
    }

    public FocusSessionResponse createSession(FocusSessionRequest request, User currentUser) {
        FocusSession session = new FocusSession(
                currentUser.getId(),
                request.getSubject().trim(),
                request.getDuration(),
                request.getStartedAt(),
                request.getEndedAt(),
                request.isCompleted()
        );

        FocusSession saved = focusSessionRepository.save(session);
        return FocusSessionResponse.fromEntity(saved);
    }

    public List<FocusSessionResponse> getSessions(User currentUser, String subject) {
        List<FocusSession> sessions;

        if (subject != null && !subject.trim().isEmpty()) {
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
