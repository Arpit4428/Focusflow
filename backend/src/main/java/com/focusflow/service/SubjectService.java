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
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Dedicated Subject Management Service.
 * Enforces strict per-user tenancy and uniqueness constraints.
 */
@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final TaskRepository taskRepository;
    private final FocusSessionRepository focusSessionRepository;

    public SubjectService(SubjectRepository subjectRepository,
                          TaskRepository taskRepository,
                          FocusSessionRepository focusSessionRepository) {
        this.subjectRepository = subjectRepository;
        this.taskRepository = taskRepository;
        this.focusSessionRepository = focusSessionRepository;
    }

    public SubjectResponse createSubject(SubjectRequest request, User currentUser) {
        String trimmedName = request.getName() != null ? request.getName().trim() : "";
        if (trimmedName.isEmpty()) {
            throw new BadRequestException("Subject name is required");
        }

        if (subjectRepository.existsByUserIdAndNameIgnoreCase(currentUser.getId(), trimmedName)) {
            throw new BadRequestException("Subject with name '" + trimmedName + "' already exists.");
        }

        Subject subject = new Subject(
                currentUser.getId(),
                trimmedName,
                request.getColor(),
                request.getDescription() != null ? request.getDescription().trim() : null
        );

        try {
            Subject saved = subjectRepository.save(subject);
            return SubjectResponse.fromEntity(saved);
        } catch (DuplicateKeyException e) {
            throw new BadRequestException("Subject with name '" + trimmedName + "' already exists.");
        }
    }

    public List<SubjectResponse> getSubjects(User currentUser) {
        return subjectRepository.findByUserIdOrderByNameAsc(currentUser.getId()).stream()
                .map(SubjectResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public SubjectResponse getSubjectById(String id, User currentUser) {
        Subject subject = subjectRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));

        return SubjectResponse.fromEntity(subject);
    }

    public SubjectResponse updateSubject(String id, SubjectRequest request, User currentUser) {
        Subject subject = subjectRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));

        String trimmedName = request.getName() != null ? request.getName().trim() : "";
        if (trimmedName.isEmpty()) {
            throw new BadRequestException("Subject name is required");
        }

        if (subjectRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(currentUser.getId(), trimmedName, id)) {
            throw new BadRequestException("Subject with name '" + trimmedName + "' already exists.");
        }

        subject.setName(trimmedName);
        if (request.getColor() != null && !request.getColor().trim().isEmpty()) {
            subject.setColor(request.getColor().trim());
        }
        subject.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        subject.setUpdatedAt(Instant.now());

        try {
            Subject updated = subjectRepository.save(subject);
            return SubjectResponse.fromEntity(updated);
        } catch (DuplicateKeyException e) {
            throw new BadRequestException("Subject with name '" + trimmedName + "' already exists.");
        }
    }

    public void deleteSubject(String id, User currentUser) {
        Subject subject = subjectRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + id));

        // Delete Rule: Check if any tasks reference this subject
        if (taskRepository.existsBySubjectIdAndUserId(id, currentUser.getId())) {
            throw new BadRequestException("Cannot delete subject because it has associated tasks or focus sessions.");
        }

        // Check if any focus sessions reference this subject
        if (focusSessionRepository.existsBySubjectIdAndUserId(id, currentUser.getId())) {
            throw new BadRequestException("Cannot delete subject because it has associated tasks or focus sessions.");
        }

        subjectRepository.delete(subject);
    }
}
