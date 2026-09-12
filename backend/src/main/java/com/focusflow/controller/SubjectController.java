package com.focusflow.controller;

import com.focusflow.dto.SubjectRequest;
import com.focusflow.dto.SubjectResponse;
import com.focusflow.model.User;
import com.focusflow.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Dedicated Subject Management REST Controller.
 * Guarantees strict user tenancy by deriving ownership solely from authenticated principal.
 */
@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    public ResponseEntity<List<SubjectResponse>> getSubjects(@AuthenticationPrincipal User currentUser) {
        List<SubjectResponse> subjects = subjectService.getSubjects(currentUser);
        return ResponseEntity.ok(subjects);
    }

    @PostMapping
    public ResponseEntity<SubjectResponse> createSubject(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody SubjectRequest request) {
        SubjectResponse created = subjectService.createSubject(request, currentUser);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubjectResponse> getSubjectById(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser) {
        SubjectResponse subject = subjectService.getSubjectById(id, currentUser);
        return ResponseEntity.ok(subject);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubjectResponse> updateSubject(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody SubjectRequest request) {
        SubjectResponse updated = subjectService.updateSubject(id, request, currentUser);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser) {
        subjectService.deleteSubject(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
